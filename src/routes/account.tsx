import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your Account — SK Jewels" },
      { name: "description", content: "View your SK Jewels orders, saved addresses and account details." },
      { property: "og:title", content: "Your Account — SK Jewels" },
      { property: "og:description", content: "View your SK Jewels orders and saved addresses." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, loading, roles, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data: orders } = useQuery({
    enabled: !!user,
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,status,total,created_at,payment_method")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: addresses } = useQuery({
    enabled: !!user,
    queryKey: ["my-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function redeem() {
    const value = code.trim();
    if (!value) return;
    const { data, error } = await supabase.rpc("redeem_access_code", { _code: value });
    if (error || !data) {
      toast.error("That access code isn't valid.");
      return;
    }
    setCode("");
    await refreshRoles();
    toast.success(`Access granted: ${String(data).replace("_", " ")}`);
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-2 text-4xl">{user.email}</h1>
          {roles.length > 0 && (
            <p className="mt-2 text-xs text-primary">
              Staff access: {roles.map((r) => r.replace("_", " ")).join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-sm">
            <Link to="/returns">Returns</Link>
          </Button>
          {roles.length > 0 && (
            <Button asChild variant="outline" className="rounded-sm">
              <Link to="/admin">Admin panel</Link>
            </Button>
          )}

          <Button variant="ghost" className="rounded-sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>

      <section className="mt-12">
        <p className="eyebrow">Your orders</p>
        {orders && orders.length > 0 ? (
          <ul className="mt-5 divide-y divide-border border-y border-border">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 py-4 text-sm">
                <div>
                  <Link to="/order/$id" params={{ id: o.id }} className="hover:underline">
                    {o.order_number}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("en-IN")} ·{" "}
                    {o.payment_method === "cod" ? "COD" : "UPI"}
                  </p>
                </div>
                <div className="text-right">
                  <p>{formatINR(Number(o.total))}</p>
                  <p className="text-xs capitalize text-muted-foreground">{o.status}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
        )}
      </section>

      <section className="mt-12">
        <p className="eyebrow">Saved addresses</p>
        {addresses && addresses.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-sm border border-border p-4 text-sm">
                <p>{a.full_name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.state} {a.postal_code}
                  <br />
                  {a.phone}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Addresses you use at checkout will appear here.
          </p>
        )}
      </section>

      <section className="mt-12 rounded-sm border border-border bg-sand p-6">
        <p className="eyebrow">Have a staff access code?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Redeem it to unlock the admin panel with the permissions it grants.
        </p>
        <div className="mt-4 flex max-w-sm gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            className="rounded-sm"
          />
          <Button className="rounded-sm" onClick={redeem}>
            Redeem
          </Button>
        </div>
      </section>
    </div>
  );
}
