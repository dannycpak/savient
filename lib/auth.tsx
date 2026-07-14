import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { configurePurchases } from "@/lib/purchases";

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({
  session: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

async function assertActiveAccount(session: Session | null): Promise<Session | null> {
  if (!session?.user) return null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("deleted_at")
    .eq("id", session.user.id)
    .maybeSingle();
  if (prof?.deleted_at) {
    await supabase.auth.signOut({ scope: "global" });
    return null;
  }
  return session;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const active = await assertActiveAccount(data.session);
      setSession(active);
      setLoading(false);
      if (active?.user) configurePurchases(active.user.id).catch(() => {});
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      (async () => {
        const active = await assertActiveAccount(s);
        setSession(active);
        if (active?.user) configurePurchases(active.user.id).catch(() => {});
      })();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>
  );
}
