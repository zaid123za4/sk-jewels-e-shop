import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, imageUrl, variantLabel, type Variant } from "@/lib/shop";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({
    meta: [
      { title: "Jewellery Detail — SK Jewels" },
      { name: "description", content: "Product details, pricing and delivery information from SK Jewels." },
      { property: "og:title", content: "Jewellery Detail — SK Jewels" },
      { property: "og:description", content: "Product details and pricing from SK Jewels." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name,slug)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const productId = product?.["id"] as string | undefined;

  const { data: variants } = useQuery({
    enabled: !!productId,
    queryKey: ["variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id,product_id,size,color,sku,price_delta,stock,is_active")
        .eq("product_id", productId!)
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Variant[];
    },
  });

  const options = variants ?? [];
  const sizes = Array.from(new Set(options.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(options.map((v) => v.color).filter(Boolean))) as string[];

  const selectedVariant =
    options.length === 0
      ? null
      : (options.find(
          (v) => (v.size ?? null) === (size ?? null) && (v.color ?? null) === (color ?? null),
        ) ?? null);

  function stockFor(part: { size?: string | null; color?: string | null }) {
    return options
      .filter(
        (v) =>
          (part.size === undefined || (v.size ?? null) === part.size) &&
          (part.color === undefined || (v.color ?? null) === part.color),
      )
      .reduce((n, v) => n + v.stock, 0);
  }

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!product) return null;

  const images: string[] = (product["images"] as string[]) ?? [];
  const basePrice = product["price"] as number;
  const hasVariants = options.length > 0;
  const price = basePrice + Number(selectedVariant?.price_delta ?? 0);
  const stock = hasVariants
    ? (selectedVariant?.stock ?? stockFor({}))
    : (product["stock"] as number);
  const needsChoice =
    hasVariants && ((sizes.length > 0 && !size) || (colors.length > 0 && !color) || !selectedVariant);


  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span>{product["name"] as string}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-sm bg-secondary">
            {images[active] ? (
              <img
                src={imageUrl(images[active]) ?? undefined}
                alt={product["name"] as string}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActive(i)}
                  className={`size-20 overflow-hidden rounded-sm border ${i === active ? "border-primary" : "border-border"}`}
                >
                  <img src={imageUrl(img) ?? undefined} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product["categories"] && (
            <p className="eyebrow">{(product["categories"] as { name: string }).name}</p>
          )}
          <h1 className="mt-3 text-4xl leading-tight">{product["name"] as string}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl">{formatINR(price)}</span>
            {(product["compare_at_price"] as number | null) && (
              <span className="text-sm text-muted-foreground line-through">
                {formatINR(product["compare_at_price"] as number)}
              </span>
            )}
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {(product["description"] as string) || "A handpicked SK Jewels piece."}
          </p>

          {sizes.length > 0 && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Size</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const soldOut = stockFor({ size: s }) <= 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setSize(s)}
                      className={`rounded-sm border px-4 py-2 text-sm ${size === s ? "border-primary text-primary" : "border-border"} ${soldOut ? "cursor-not-allowed text-muted-foreground line-through opacity-60" : ""}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Colour</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((c) => {
                  const soldOut = stockFor({ color: c }) <= 0;
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setColor(c)}
                      className={`rounded-sm border px-4 py-2 text-sm ${color === c ? "border-primary text-primary" : "border-border"} ${soldOut ? "cursor-not-allowed text-muted-foreground line-through opacity-60" : ""}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-sm border border-border">
              <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                className="px-3 py-2"
                onClick={() => setQty((q) => Math.min(stock || 99, q + 1))}
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1 rounded-sm"
              disabled={stock <= 0 || needsChoice}
              onClick={() => {
                const label = selectedVariant ? variantLabel(selectedVariant) : null;
                add(
                  {
                    id: selectedVariant?.id ?? (product["id"] as string),
                    productId: product["id"] as string,
                    variantId: selectedVariant?.id ?? null,
                    variantLabel: label || null,
                    name: product["name"] as string,
                    slug: product["slug"] as string,
                    price,
                    image: images[0] ?? null,
                    stock,
                  },
                  qty,
                );
                toast.success("Added to your bag");
              }}
            >
              <ShoppingBag className="mr-2 size-4" />
              {stock <= 0 ? "Sold out" : needsChoice ? "Select an option" : "Add to bag"}
            </Button>
          </div>

          <ul className="mt-8 space-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
            <li>Free shipping on orders over ₹999</li>
            <li>Cash on delivery or UPI available</li>
            <li>
              {stock > 0
                ? `${stock} in stock${selectedVariant ? ` for ${variantLabel(selectedVariant)}` : ""}`
                : "Currently unavailable"}
            </li>
            <li>
              7-day returns &amp; exchanges —{" "}
              <Link to="/returns" className="underline">
                see policy
              </Link>
            </li>
          </ul>

        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
