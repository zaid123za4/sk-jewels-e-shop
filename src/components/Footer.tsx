import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-display text-2xl uppercase tracking-[0.18em]">SK Jewels</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Handpicked artificial jewellery for everyday shine and once-in-a-lifetime days.
            Loved by thousands across India.
          </p>
          <a
            href="https://www.instagram.com/sk_jewels_18"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center gap-2 text-sm text-foreground hover:text-primary"
          >
            <Instagram className="size-4" />
            @sk_jewels_18
          </a>
        </div>

        <div>
          <p className="eyebrow">Shop</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                All jewellery
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-foreground">
                Your bag
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-foreground">
                Orders &amp; addresses
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Help</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                Our story
              </Link>
            </li>
            <li>
              <Link to="/returns" className="hover:text-foreground">
                Returns &amp; exchanges
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact us
              </Link>
            </li>

            <li>
              <Link to="/auth" className="hover:text-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SK Jewels. Cash on delivery &amp; UPI accepted across India.
      </div>
    </footer>
  );
}
