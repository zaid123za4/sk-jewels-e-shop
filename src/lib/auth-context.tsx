import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "product_manager" | "order_manager";

type AuthValue = {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  canManageCatalog: boolean;
  canManageOrders: boolean;
  hasAnyRole: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRoles(userId: string | undefined) {
    if (!userId) {
      setRoles([]);
      return;
    }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setTimeout(() => void loadRoles(session?.user?.id), 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      await loadRoles(data.session?.user?.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(() => {
    const isAdmin = roles.includes("admin");
    return {
      user,
      roles,
      loading,
      isAdmin,
      canManageCatalog: isAdmin || roles.includes("product_manager"),
      canManageOrders: isAdmin || roles.includes("order_manager"),
      hasAnyRole: roles.length > 0,
      refreshRoles: () => loadRoles(user?.id),
      signOut: async () => {
        await supabase.auth.signOut();
        setRoles([]);
      },
    };
  }, [user, roles, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
