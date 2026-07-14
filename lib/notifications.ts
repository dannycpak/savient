import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request permissions and return Expo push token. */
export async function registerForPushNotifications() {
  if (Platform.OS === "web") return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

/** Request permission, get token, persist via RPC for order/rating pushes. */
export async function registerAndSavePushToken() {
  const token = await registerForPushNotifications();
  if (!token) return null;
  await supabase.rpc("upsert_push_token", {
    p_token: token,
    p_platform: Platform.OS,
  });
  return token;
}
