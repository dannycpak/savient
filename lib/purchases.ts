// RevenueCat wrapper — the ONLY file that touches react-native-purchases.
// Digital goods (Sage+ subscription, Visual Check credit packs) flow through here.
// Server truth (profiles.plan, credit balance) is written by the revenuecat-webhook;
// the client uses CustomerInfo only for immediate UI feedback after purchase.
import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { IAP } from "@/constants/copy";

export const ENTITLEMENT_PLUS = IAP.entitlementPlus;

export async function configurePurchases(supabaseUserId: string) {
  const apiKey =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;
  if (!apiKey || apiKey.includes("xxx")) return;
  // app_user_id = Supabase auth uid → webhook events map 1:1 to profiles.id.
  Purchases.configure({ apiKey, appUserID: supabaseUserId });
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchase(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function hasPlus(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo();
  return ENTITLEMENT_PLUS in info.entitlements.active;
}

export async function restore() {
  return Purchases.restorePurchases();
}
