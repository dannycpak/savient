import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithApple() {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is available on iOS.");
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

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;

  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(" ");
  if (fullName && data.user) {
    await supabase.from("profiles").update({ display_name: fullName }).eq("id", data.user.id);
  }
  return data;
}

/** Prefer ID-token flow for Supabase `signInWithIdToken`. */
export function useGoogleAuthRequest() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  return Google.useIdTokenAuthRequest({
    webClientId,
    iosClientId,
    androidClientId,
    redirectUri: makeRedirectUri({ scheme: "sage" }),
  });
}

export async function completeGoogleSignIn(idToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
  return data;
}
