import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — SK Jewels" },
      { name: "description", content: "Enter your delivery address and place your SK Jewels order with COD or UPI." },
      { property: "og:title", content: "Checkout — SK Jewels" },
      { property: "og:description", content: "Place your SK Jewels order with cash on delivery or UPI." },
    ],
  }),
  component: Checkout,
});

type Form = {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
};

const EMPTY: Form = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
};

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<Form>(EMPTY);
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"cod" | "upi">("cod");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/checkout" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          line1: data.line1 ?? "",
          line2: data.line2 ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          postal_code: data.postal_code ?? "",
        });
      }
    })();
  }, [user]);

  const shipping = subtotal >= 999 ? 0 : 69;
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  async function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await supabase.rpc("validate_coupon", {
      _code: code,
      _subtotal: subtotal,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) {
      setApplied(null);
      toast.error("That coupon isn't valid for this order");
      return;
    }
    setApplied({ code: row.code, discount: Number(row.discount) });
    toast.success(`Coupon applied — ${formatINR(Number(row.discount))} off`);
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user || items.length === 0) return;
    setSubmitting(true);
    try {
      const order_number = `SK${Date.now().toString().slice(-8)}`;
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          order_number,
          user_id: user.id,
          status: "pending",
          payment_method: payment,
          payment_status: "pending",
          subtotal,
          discount,
          shipping,
          total,
          coupon_code: applied?.code ?? null,
          shipping_address: form,
          notes: notes || null,
        })
        .select("id, order_number")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          variant_id: i.variantId,
          variant_label: i.variantLabel,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
      );
      if (itemsError) throw itemsError;

      // Inventory is decremented server-side for the exact variant bought.
      await supabase.rpc("consume_stock_for_order", { _order_id: order.id });




      if (saveAddress) {
        await supabase.from("addresses").insert({ ...form, user_id: user.id, country: "India" });
      }

      clear();
      navigate({ to: "/order/$id", params: { id: order.id } });
    } catch (err) {
      console.error(err);
      toast.error("We couldn't place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h1 className="text-3xl">Nothing to check out</h1>
        <Button asChild className="mt-8 rounded-sm">
          <Link to="/shop">Browse jewellery</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-10 grid gap-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section>
            <p className="eyebrow">Delivery address</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div className="sm:col-span-2">
                <Field label="Address line 1" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Address line 2 (optional)"
                  required={false}
                  value={form.line2}
                  onChange={(v) => setForm({ ...form, line2: v })}
                />
              </div>
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              <Field label="PIN code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} />
            </div>
            <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              Save this address for next time
            </label>
          </section>

          <section>
            <p className="eyebrow">Payment method</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { key: "cod" as const, title: "Cash on delivery", copy: "Pay the courier when it arrives" },
                { key: "upi" as const, title: "UPI (manual)", copy: "We'll send a UPI ID to pay" },
              ].map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => setPayment(p.key)}
                  className={`rounded-sm border p-4 text-left ${payment === p.key ? "border-primary bg-sand" : "border-border"}`}
                >
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.copy}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="eyebrow">Order notes</p>
            <Textarea
              className="mt-4 rounded-sm"
              placeholder="Anything we should know about the delivery?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        <aside className="h-fit rounded-sm border border-border bg-sand p-6">
          <p className="eyebrow">Order summary</p>
          <ul className="mt-5 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.name} × {i.quantity}
                </span>
                <span>{formatINR(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex gap-2 border-t border-border pt-5">
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon code"
              className="rounded-sm uppercase"
            />
            <Button type="button" variant="outline" className="rounded-sm" onClick={applyCoupon}>
              Apply
            </Button>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            {discount > 0 && <Row label={`Discount (${applied?.code})`} value={`− ${formatINR(discount)}`} />}
            <Row label="Shipping" value={shipping === 0 ? "Free" : formatINR(shipping)} />
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>

          <Button type="submit" size="lg" disabled={submitting} className="mt-6 w-full rounded-sm">
            {submitting ? "Placing order…" : "Place order"}
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        className="rounded-sm"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
