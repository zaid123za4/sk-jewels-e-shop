import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "Order Confirmation — SK Jewels" },
      { name: "description", content: "Your SK Jewels order details, items and delivery address." },
      { property: "og:title", content: "Order Confirmation — SK Jewels" },
      { property: "og:description", content: "Your SK Jewels order details and delivery status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!data)
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-3xl">Order not found</h1>
        <Button asChild className="mt-8 rounded-sm">
          <Link to="/account">Your orders</Link>
        </Button>
      </div>
    );

  const address = data.shipping_address as Record<string, string>;
  const items = (data.order_items ?? []) as {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-4xl">Thank you!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Order <span className="text-foreground">{data.order_number}</span> is confirmed. We'll be in
          touch on {address["phone"]} about delivery.
        </p>
      </div>

      <div className="mt-10 rounded-sm border border-border p-6">
        <p className="eyebrow">Items</p>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {i.name} × {i.quantity}
              </span>
              <span>{formatINR(Number(i.price) * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatINR(Number(data.subtotal))}</span>
          </div>
          {Number(data.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>− {formatINR(Number(data.discount))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{Number(data.shipping) === 0 ? "Free" : formatINR(Number(data.shipping))}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <span>Total</span>
            <span>{formatINR(Number(data.total))}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-border bg-sand p-6 text-sm">
        <p className="eyebrow">Delivering to</p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {address["full_name"]}
          <br />
          {address["line1"]}
          {address["line2"] ? `, ${address["line2"]}` : ""}
          <br />
          {address["city"]}, {address["state"]} {address["postal_code"]}
        </p>
        <p className="mt-4 text-xs">
          Payment: {data.payment_method === "cod" ? "Cash on delivery" : "UPI (manual)"} ·{" "}
          {data.payment_status}
        </p>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button asChild variant="outline" className="rounded-sm">
          <Link to="/account">View all orders</Link>
        </Button>
        <Button asChild className="rounded-sm">
          <Link to="/shop">Keep shopping</Link>
        </Button>
      </div>
    </div>
  );
}
