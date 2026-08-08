import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeIndianRupee, Truck, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SK Jewels — Artificial Jewellery for Every Occasion" },
      {
        name: "description",
        content:
          "Handpicked chokers, jhumkas, bangles and bridal sets. Free shipping over ₹999, cash on delivery across India.",
      },
      { property: "og:title", content: "SK Jewels — Artificial Jewellery for Every Occasion" },
      {
        property: "og:description",
        content: "Handpicked chokers, jhumkas, bangles and bridal sets, delivered across India.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,images,stock,is_featured")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as ProductCardData[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name,slug").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="eyebrow">Artificial jewellery · India</p>
          <h1 className="mt-4 text-5xl leading-[1.05] md:text-6xl">
            Everyday shine,
            <br />
            heirloom feeling.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Chokers, jhumkas, bangles and complete bridal sets — handpicked by SK Jewels and
            delivered to your door with cash on delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-sm">
              <Link to="/shop">
                Shop the collection <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-sm">
              <Link to="/about">Our story</Link>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-sm bg-secondary shadow-[var(--shadow-lift)]">
          <img
            src={heroImg}
            alt="Model wearing a gold-tone choker and pearl jhumka earrings from SK Jewels"
            width={1408}
            height={1760}
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
      </section>

      <section className="border-y border-border bg-sand">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Free shipping over ₹999", copy: "Delivered in 3–7 days" },
            { icon: BadgeIndianRupee, title: "Cash on delivery", copy: "Or pay instantly by UPI" },
            { icon: Sparkles, title: "Anti-tarnish finish", copy: "Made to last season after season" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <f.icon className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {(categories?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14">
          <p className="eyebrow">Browse</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories!.map((c) => (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.slug }}
                className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Just in</p>
            <h2 className="mt-2 text-3xl">Featured pieces</h2>
          </div>
          <Link to="/shop" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {featured && featured.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-sm border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No products yet. Add your first pieces from the admin panel.
          </div>
        )}
      </section>
    </>
  );
}
