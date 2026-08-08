import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

type ShopSearch = { category?: string; q?: string; sort?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Jewellery — SK Jewels" },
      {
        name: "description",
        content:
          "Browse every SK Jewels piece: necklaces, earrings, bangles, rings and bridal sets with cash on delivery in India.",
      },
      { property: "og:title", content: "Shop All Jewellery — SK Jewels" },
      { property: "og:description", content: "Browse every SK Jewels piece, delivered across India." },
    ],
  }),
  component: Shop,
});

const SORTS = [
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
];

function Shop() {
  const { category, q, sort } = Route.useSearch();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name,slug").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category, q, sort],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,images,stock,category_id,categories(slug)")
        .eq("is_active", true);

      if (q) query = query.ilike("name", `%${q}%`);
      if (sort === "price-asc") query = query.order("price", { ascending: true });
      else if (sort === "price-desc") query = query.order("price", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as unknown as (ProductCardData & {
        categories: { slug: string } | null;
      })[];
      return category ? rows.filter((r) => r.categories?.slug === category) : rows;
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="eyebrow">Collection</p>
      <h1 className="mt-2 text-4xl">
        {categories?.find((c) => c.slug === category)?.name ?? "All jewellery"}
      </h1>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-border pb-5">
        <Link
          to="/shop"
          search={(prev) => ({ ...prev, category: undefined })}
          className={`rounded-full border px-4 py-1.5 text-sm ${!category ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          All
        </Link>
        {categories?.map((c) => (
          <Link
            key={c.id}
            to="/shop"
            search={(prev) => ({ ...prev, category: c.slug })}
            className={`rounded-full border px-4 py-1.5 text-sm ${category === c.slug ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {c.name}
          </Link>
        ))}
        <div className="ml-auto flex gap-2">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              to="/shop"
              search={(prev) => ({ ...prev, sort: s.key })}
              className={`text-xs ${(sort ?? "new") === s.key ? "text-foreground underline" : "text-muted-foreground hover:text-foreground"}`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">Loading pieces…</div>
      ) : products && products.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-sm border border-dashed border-border p-14 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </div>
      )}
    </div>
  );
}
