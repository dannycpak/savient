import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithApple() {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is only available on iOS.");
  }
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) throw new Error("Sign in with Apple is not available on this device.");

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error("No identity token from Apple.");

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple only sends the name on first authorization — stash it if present.
  const given = credential.fullName?.givenName;
  const family = credential.fullName?.familyName;
  if (given || family) {
    const display = [given, family].filter(Boolean).join(" ");
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").update({ display_name: display }).eq("id", data.user.id);
    }
  }
}

export async function signInWithGoogle() {
  const redirectTo = makeRedirectUri({ scheme: "sage", path: "auth/callback" });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !("url" in result) || !result.url) {
    throw new Error("Google sign-in was cancelled.");
  }

  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.replace(/^#/, "") || url.search.replace(/^\?/, ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) {
    throw new Error("Missing tokens in OAuth redirect.");
  }

  const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionErr) throw sessionErr;
}
