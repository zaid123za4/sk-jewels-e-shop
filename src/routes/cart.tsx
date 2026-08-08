import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatINR, imageUrl } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — SK Jewels" },
      { name: "description", content: "Review the jewellery in your SK Jewels shopping bag before checkout." },
      { property: "og:title", content: "Your Bag — SK Jewels" },
      { property: "og:description", content: "Review your SK Jewels shopping bag." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h1 className="text-3xl">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Find something you'll wear again and again.
        </p>
        <Button asChild className="mt-8 rounded-sm">
          <Link to="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl">Your bag</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-border border-y border-border">
          {items.map((it) => (
            <li key={it.id} className="flex gap-4 py-5">
              <Link
                to="/product/$slug"
                params={{ slug: it.slug }}
                className="size-24 shrink-0 overflow-hidden rounded-sm bg-secondary"
              >
                {imageUrl(it.image) && (
                  <img src={imageUrl(it.image)!} alt={it.name} className="size-full object-cover" />
                )}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <Link to="/product/$slug" params={{ slug: it.slug }} className="text-sm">
                    {it.name}
                  </Link>
                  <span className="text-sm">{formatINR(it.price * it.qty)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-sm border border-border">
                    <button className="px-2.5 py-1.5" onClick={() => setQty(it.id, it.qty - 1)}>
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs">{it.qty}</span>
                    <button className="px-2.5 py-1.5" onClick={() => setQty(it.id, it.qty + 1)}>
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(it.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-sm border border-border bg-sand p-6">
          <p className="eyebrow">Summary</p>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{subtotal >= 999 ? "Free" : formatINR(69)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base">
            <span>Total</span>
            <span>{formatINR(subtotal + (subtotal >= 999 ? 0 : 69))}</span>
          </div>
          <Button asChild size="lg" className="mt-6 w-full rounded-sm">
            <Link to="/checkout">Checkout</Link>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Coupon codes can be applied at checkout.
          </p>
        </aside>
      </div>
    </div>
  );
}
