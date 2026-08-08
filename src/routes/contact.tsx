import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact SK Jewels — Orders, Sizing & Bridal Sets" },
      {
        name: "description",
        content:
          "Reach SK Jewels on Instagram or WhatsApp for order help, styling advice and custom bridal jewellery sets.",
      },
      { property: "og:title", content: "Contact SK Jewels" },
      { property: "og:description", content: "Order help, styling advice and custom bridal sets." },
    ],
  }),
  component: Contact,
});

const CHANNELS = [
  {
    icon: Instagram,
    title: "Instagram",
    copy: "Fastest replies, daily new drops",
    action: "@sk_jewels_18",
    href: "https://www.instagram.com/sk_jewels_18",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    copy: "Order updates & custom requests",
    action: "Message us",
    href: "https://wa.me/",
  },
  {
    icon: Mail,
    title: "Email",
    copy: "For bulk and bridal enquiries",
    action: "hello@skjewels.in",
    href: "mailto:hello@skjewels.in",
  },
];

function Contact() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 text-5xl leading-tight">We're happy to help.</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Questions about an order, sizing, or putting together a bridal set? Reach us on any of these
        and we'll get back within a day.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((c) => (
          <a
            key={c.title}
            href={c.href}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-sm border border-border p-6 transition-colors hover:border-primary"
          >
            <c.icon className="size-5 text-primary" />
            <p className="mt-4 text-sm font-medium">{c.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.copy}</p>
            <p className="mt-4 text-xs text-primary">{c.action}</p>
          </a>
        ))}
      </div>

      <div className="mt-12 rounded-sm border border-border bg-sand p-6 text-sm">
        <p className="eyebrow">Shipping &amp; returns</p>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>Orders are dispatched within 24–48 hours, delivered in 3–7 days.</li>
          <li>Free shipping on orders above ₹999; ₹69 flat below that.</li>
          <li>Cash on delivery available pan-India, or pay by UPI.</li>
          <li>Damaged in transit? Send us an unboxing video within 48 hours for a free replacement.</li>
        </ul>
      </div>
    </div>
  );
}
