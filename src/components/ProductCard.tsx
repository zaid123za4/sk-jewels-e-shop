import { Link } from "@tanstack/react-router";
import { formatINR, imageUrl } from "@/lib/shop";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const img = imageUrl(product.images?.[0]);
  const off =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : null;

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {off && (
          <span className="absolute left-3 top-3 bg-foreground px-2 py-1 text-[10px] tracking-widest text-background">
            {off}% OFF
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-background/90 py-2 text-center text-[11px] tracking-widest uppercase">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium leading-snug">{product.name}</h3>
        <p className="flex items-baseline gap-2 text-sm">
          <span>{formatINR(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatINR(product.compare_at_price)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
