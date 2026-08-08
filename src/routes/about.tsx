import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — SK Jewels" },
      {
        name: "description",
        content:
          "SK Jewels curates affordable, anti-tarnish artificial jewellery for Indian women — from everyday studs to full bridal sets.",
      },
      { property: "og:title", content: "Our Story — SK Jewels" },
      { property: "og:description", content: "How SK Jewels curates affordable artificial jewellery." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="eyebrow">Our story</p>
      <h1 className="mt-3 text-5xl leading-tight">Jewellery that keeps up with you.</h1>

      <div className="mt-10 overflow-hidden rounded-sm">
        <img
          src={heroImg}
          alt="SK Jewels gold-tone choker and jhumka set"
          loading="lazy"
          width={1408}
          height={1760}
          className="aspect-[16/9] w-full object-cover"
        />
      </div>

      <div className="mt-10 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          SK Jewels started as a small Instagram page sharing everyday jewellery styling. What began
          with a handful of jhumkas has grown into a curated collection worn by thousands of women
          across India.
        </p>
        <p>
          Every piece is chosen by hand. We look for weight that feels real, plating that survives
          real life, and finishes that photograph as beautifully as they wear. If it doesn't pass our
          own daily-wear test, it doesn't make it to the shop.
        </p>
        <p>
          We keep prices honest, ship pan-India, and offer cash on delivery because trust matters
          more than a fast sale. Questions, styling help, custom bridal sets — we're one message away.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { n: "5,000+", l: "Orders delivered" },
          { n: "24 hrs", l: "Average reply time" },
          { n: "Pan-India", l: "Shipping & COD" },
        ].map((s) => (
          <div key={s.l} className="rounded-sm border border-border bg-sand p-6 text-center">
            <p className="font-display text-3xl">{s.n}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex gap-3">
        <Button asChild className="rounded-sm">
          <Link to="/shop">Shop the collection</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-sm">
          <Link to="/contact">Talk to us</Link>
        </Button>
      </div>
    </div>
  );
}
