import { supabase } from "@/lib/supabase";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function invoke<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new ApiError(401, "Not signed in");

  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const res = await fetch(`${base}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (json as { error?: string }).error ?? res.statusText, json);
  }
  return json as T;
}

export type VisualCheckResult = {
  id: string;
  result: {
    candidates: { species: string; confidence: number; notes: string }[];
    observations: string;
    red_flags: string[];
    price_range?: { low_cents: number; high_cents: number; currency: string } | null;
  };
};

export const api = {
  visualCheck: (imagePath: string) =>
    invoke<VisualCheckResult>("visual-check", { image_path: imagePath }),
  createOrder: (listingId: string) =>
    invoke<{ client_secret: string; order_id: string }>("create-order", {
      listing_id: listingId,
    }),
  confirmDelivery: (orderId: string) =>
    invoke<{ ok: boolean }>("confirm-delivery", { order_id: orderId }),
  createConnectAccount: (businessName?: string) =>
    invoke<{
      seller_id: string;
      onboarding_url: string;
      connect_onboarding_status: string;
    }>("create-connect-account", businessName ? { business_name: businessName } : {}),
  addTracking: (orderId: string, trackingNumber: string) =>
    invoke<{ ok: boolean; status: string }>("add-tracking", {
      order_id: orderId,
      tracking_number: trackingNumber,
    }),
};
