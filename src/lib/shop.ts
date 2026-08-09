export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Turns a stored image reference into a displayable URL. */
export function imageUrl(ref: string | null | undefined): string | null {
  if (!ref) return null;
  if (ref.startsWith("http://") || ref.startsWith("https://")) return ref;
  return `/api/public/img/${ref.replace(/^\/+/, "")}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 69;

export type Variant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price_delta: number;
  stock: number;
  is_active: boolean;
};

export function variantLabel(v: { size?: string | null; color?: string | null }): string {
  return [v.size, v.color].filter(Boolean).join(" · ");
}

export const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "in_transit",
  "refunded",
  "exchanged",
  "closed",
] as const;

export const RETURN_REASONS = [
  "Damaged or broken on arrival",
  "Wrong item received",
  "Size or colour doesn't suit",
  "Not as described",
  "Changed my mind",
  "Other",
] as const;

