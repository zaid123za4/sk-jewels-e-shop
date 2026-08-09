import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatINR, RETURN_REASONS } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReturnsSearch = { order?: string | undefined };

export const Route = createFileRoute("/returns")({
  validateSearch: (search: Record<string, unknown>): ReturnsSearch => ({
    order: typeof search["order"] === "string" ? search["order"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Returns & Exchanges — SK Jewels" },
      {
        name: "description",
        content:
          "SK Jewels returns and exchange policy — raise a return or exchange request for any order within 7 days of delivery.",
      },
      { property: "og:title", content: "Returns & Exchanges — SK Jewels" },
      {
        property: "og:description",
        content: "Raise a return or exchange request for your SK Jewels order within 7 days.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const { order: presetOrder } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<"return" | "exchange">("return");
  const [itemsText, setItemsText] = useState("");
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: orders } = useQuery({
    enabled: !!user,
    queryKey: ["returnable-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,total,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: requests } = useQuery({
    enabled: !!user,
    queryKey: ["my-returns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("return_requests")
        .select("*, orders(order_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (orderId || !orders?.length) return;
    const preset = presetOrder ? orders.find((o) => o.order_number === presetOrder) : null;
    setOrderId((preset ?? orders[0])!.id);
  }, [orders, presetOrder, orderId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/returns" } });
      return;
    }
    if (!orderId) {
      toast.error("Select the order you want to return");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("return_requests").insert({
      order_id: orderId,
      user_id: user.id,
      request_type: type,
      items: itemsText || null,
      reason,
      details: details || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request received — we'll get back to you within 24 hours");
    setItemsText("");
    setDetails("");
    void qc.invalidateQueries({ queryKey: ["my-returns"] });
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <p className="eyebrow">Support</p>
      <h1 className="mt-2 text-4xl">Returns &amp; exchanges</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        We want you to love what you wear. If something isn't right, you can request a return or an
        exchange within 7 days of delivery.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { t: "7-day window", c: "Raise the request within 7 days of delivery." },
          { t: "Unworn & original packing", c: "Tags, pouch and invoice should be intact." },
          { t: "Refund or exchange", c: "Refund to UPI/bank in 5–7 days, or swap the piece." },
        ].map((b) => (
          <div key={b.t} className="rounded-sm border border-border bg-sand p-5">
            <p className="text-sm">{b.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{b.c}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Please note: earrings are only returnable if they arrive damaged or faulty (hygiene reasons),
        and customised pieces cannot be returned. Reverse pickup is free for damaged or wrong items;
        otherwise a ₹69 pickup fee is deducted from the refund.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl">Raise a request</h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className="mt-5 rounded-sm border border-border bg-sand p-6">
            <p className="text-sm text-muted-foreground">
              Sign in to raise a return or exchange for one of your orders.
            </p>
            <Button asChild className="mt-4 rounded-sm">
              <Link to="/auth" search={{ redirect: "/returns" }}>
                Sign in
              </Link>
            </Button>
          </div>
        ) : orders && orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            You don't have any orders yet.{" "}
            <Link to="/shop" className="underline">
              Browse jewellery
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-5 rounded-sm border border-border p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Order</Label>
                <select
                  className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                >
                  {orders?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} · {formatINR(Number(o.total))} ·{" "}
                      {new Date(o.created_at).toLocaleDateString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Request type</Label>
                <select
                  className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as "return" | "exchange")}
                >
                  <option value="return">Return &amp; refund</option>
                  <option value="exchange">Exchange for another size/colour</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Reason</Label>
                <select
                  className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Which item(s)? Include size/colour
                </Label>
                <Textarea
                  className="rounded-sm"
                  placeholder="e.g. Rose Gold Jhumka (Medium · Rose gold) × 1"
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Anything else? (optional)</Label>
                <Textarea
                  className="rounded-sm"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={busy} className="rounded-sm">
              {busy ? "Sending…" : "Submit request"}
            </Button>
          </form>
        )}
      </section>

      {user && requests && requests.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl">Your requests</h2>
          <ul className="mt-5 divide-y divide-border border-y border-border">
            {requests.map((r) => (
              <li key={r.id} className="py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p>
                    {(r.orders as { order_number: string } | null)?.order_number} ·{" "}
                    <span className="capitalize">{r.request_type}</span>
                  </p>
                  <span className="rounded-full border border-border px-3 py-1 text-xs capitalize">
                    {String(r.status).replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.reason}
                  {r.items ? ` — ${r.items}` : ""}
                </p>
                {r.staff_note && (
                  <p className="mt-1 text-xs text-primary">SK Jewels: {r.staff_note}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
