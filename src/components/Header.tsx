import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ShoppingBag, User2, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "Our Story" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const { count } = useCart();
  const { user, hasAnyRole } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link to="/" className="font-display text-2xl tracking-[0.18em] uppercase">
          SK&nbsp;Jewels
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
          {hasAnyRole && (
            <Link to="/admin" className="text-sm text-primary hover:underline">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Account">
            <Link to={user ? "/account" : "/auth"}>
              <User2 className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Cart" className="relative">
            <Link to="/cart">
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="py-2 text-sm text-muted-foreground"
            >
              {n.label}
            </Link>
          ))}
          {hasAnyRole && (
            <Link to="/admin" onClick={() => setOpen(false)} className="py-2 text-sm text-primary">
              Admin
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
