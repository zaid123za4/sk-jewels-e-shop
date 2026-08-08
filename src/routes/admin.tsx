import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatINR, imageUrl, slugify, ORDER_STATUSES } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SK Jewels" },
      { name: "description", content: "Staff dashboard for SK Jewels: products, orders, coupons and access codes." },
      { property: "og:title", content: "Admin — SK Jewels" },
      { property: "og:description", content: "Staff dashboard for SK Jewels." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Tab = "products" | "orders" | "coupons" | "access";

function Admin() {
  const { user, loading, isAdmin, canManageCatalog, canManageOrders, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin" }, replace: true });
  }, [loading, user, navigate]);

  if (loading) return <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return null;

  if (!hasAnyRole) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-3xl">No staff access</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Redeem an access code on your account page to unlock this dashboard.
        </p>
        <Button asChild className="mt-8 rounded-sm">
          <Link to="/account">Go to account</Link>
        </Button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; visible: boolean }[] = [
    { key: "products", label: "Products", visible: canManageCatalog },
    { key: "orders", label: "Orders", visible: canManageOrders },
    { key: "coupons", label: "Coupons", visible: isAdmin },
    { key: "access", label: "Access codes", visible: isAdmin },
  ];
  const visible = tabs.filter((t) => t.visible);
  const current = visible.some((t) => t.key === tab) ? tab : visible[0]?.key;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 text-4xl">Admin</h1>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
        {visible.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm ${current === t.key ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {current === "products" && <ProductsTab />}
        {current === "orders" && <OrdersTab />}
        {current === "coupons" && <CouponsTab />}
        {current === "access" && <AccessTab />}
      </div>
    </div>
  );
}

/* ---------------- Products ---------------- */

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  price: "",
  compare_at_price: "",
  stock: "0",
  category_id: "",
  is_active: true,
  is_featured: false,
  images: [] as string[],
};

function ProductsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) throw error;
        paths.push(path);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...paths] }));
      toast.success("Photos uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: slugify(form.name) || crypto.randomUUID().slice(0, 8),
      description: form.description || null,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock: Number(form.stock),
      category_id: form.category_id || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      images: form.images,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing)
      : await supabase.from("products").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Product updated" : "Product added");
    setForm({ ...EMPTY_PRODUCT });
    setEditing(null);
    void qc.invalidateQueries();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted");
    void qc.invalidateQueries();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
      <form onSubmit={save} className="h-fit space-y-4 rounded-sm border border-border bg-sand p-6">
        <p className="eyebrow">{editing ? "Edit product" : "Add product"}</p>

        <Text label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            className="rounded-sm bg-background"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Text label="Price (₹)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
          <Text
            label="MRP (₹)"
            type="number"
            value={form.compare_at_price}
            onChange={(v) => setForm({ ...form, compare_at_price: v })}
          />
          <Text label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <select
              className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">None</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Photos</Label>
          <div className="flex flex-wrap gap-2">
            {form.images.map((img) => (
              <div key={img} className="relative size-16 overflow-hidden rounded-sm border border-border">
                <img src={imageUrl(img) ?? undefined} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, images: form.images.filter((i) => i !== img) })}
                  className="absolute right-0 top-0 bg-background/90 p-0.5"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-2 size-4" />
            {uploading ? "Uploading…" : "Upload photos"}
          </Button>
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Visible in shop
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured
          </label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1 rounded-sm">
            {editing ? "Save changes" : "Add product"}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-sm"
              onClick={() => {
                setEditing(null);
                setForm({ ...EMPTY_PRODUCT });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div>
        <p className="eyebrow">Catalogue ({products?.length ?? 0})</p>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {products?.map((p) => (
            <li key={p.id} className="flex items-center gap-4 py-3 text-sm">
              <div className="size-12 shrink-0 overflow-hidden rounded-sm bg-secondary">
                {imageUrl((p.images as string[])?.[0]) && (
                  <img src={imageUrl((p.images as string[])[0])!} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p>{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatINR(Number(p.price))} · stock {p.stock} · {p.is_active ? "live" : "hidden"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(p.id);
                  setForm({
                    name: p.name,
                    description: p.description ?? "",
                    price: String(p.price),
                    compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "",
                    stock: String(p.stock),
                    category_id: p.category_id ?? "",
                    is_active: p.is_active,
                    is_featured: p.is_featured,
                    images: (p.images as string[]) ?? [],
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Orders ---------------- */

function OrdersTab() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Order updated");
    void qc.invalidateQueries();
  }

  const revenue = (orders ?? []).reduce((n, o) => n + Number(o.total), 0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={String(orders?.length ?? 0)} />
        <Stat label="Revenue" value={formatINR(revenue)} />
        <Stat
          label="Pending"
          value={String((orders ?? []).filter((o) => o.status === "pending").length)}
        />
      </div>

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {orders?.map((o) => {
          const addr = o.shipping_address as Record<string, string>;
          return (
            <li key={o.id} className="py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p>
                    {o.order_number} · {formatINR(Number(o.total))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {addr["full_name"]} · {addr["phone"]} · {addr["city"]}, {addr["state"]}{" "}
                    {addr["postal_code"]} · {o.payment_method === "cod" ? "COD" : "UPI"}
                  </p>
                </div>
                <select
                  className="h-9 rounded-sm border border-input bg-background px-2 text-xs capitalize"
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {(o.order_items as { name: string; quantity: number }[])
                  .map((i) => `${i.name} × ${i.quantity}`)
                  .join(", ")}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Coupons ---------------- */

function CouponsTab() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("");
  const [min, setMin] = useState("0");

  const { data: coupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      discount_type: type,
      discount_value: Number(value),
      min_order_amount: Number(min || 0),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Coupon created");
    setCode("");
    setValue("");
    void qc.invalidateQueries();
  }

  async function toggle(id: string, is_active: boolean) {
    await supabase.from("coupons").update({ is_active }).eq("id", id);
    void qc.invalidateQueries();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
      <form onSubmit={create} className="h-fit space-y-4 rounded-sm border border-border bg-sand p-6">
        <p className="eyebrow">New coupon</p>
        <Text label="Code" value={code} onChange={setCode} required />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <select
            className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="percent">Percent off</option>
            <option value="fixed">Flat ₹ off</option>
          </select>
        </div>
        <Text label="Value" type="number" value={value} onChange={setValue} required />
        <Text label="Minimum order (₹)" type="number" value={min} onChange={setMin} />
        <Button type="submit" className="w-full rounded-sm">
          Create coupon
        </Button>
      </form>

      <ul className="divide-y divide-border border-y border-border">
        {coupons?.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-4 py-3 text-sm">
            <div>
              <p className="tracking-widest">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                {c.discount_type === "percent"
                  ? `${Number(c.discount_value)}% off`
                  : `${formatINR(Number(c.discount_value))} off`}{" "}
                · min {formatINR(Number(c.min_order_amount))} · used {c.used_count}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggle(c.id, !c.is_active)}>
              {c.is_active ? "Disable" : "Enable"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Access codes ---------------- */

function AccessTab() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [role, setRole] = useState("product_manager");
  const [maxUses, setMaxUses] = useState("1");

  const { data: codes } = useQuery({
    queryKey: ["admin-access-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("access_codes").insert({
      code: code.trim().toUpperCase(),
      role: role as "admin" | "product_manager" | "order_manager",
      max_uses: Number(maxUses || 1),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Access code created");
    setCode("");
    void qc.invalidateQueries();
  }

  async function toggle(id: string, is_active: boolean) {
    await supabase.from("access_codes").update({ is_active }).eq("id", id);
    void qc.invalidateQueries();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
      <form onSubmit={create} className="h-fit space-y-4 rounded-sm border border-border bg-sand p-6">
        <p className="eyebrow">Grant access</p>
        <p className="text-xs text-muted-foreground">
          Share a code with a teammate. They sign in, redeem it on their account page and get exactly
          these permissions.
        </p>
        <Text label="Code" value={code} onChange={setCode} required />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Permission</Label>
          <select
            className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="product_manager">Products only</option>
            <option value="order_manager">Orders only</option>
            <option value="admin">Full admin</option>
          </select>
        </div>
        <Text label="Max uses" type="number" value={maxUses} onChange={setMaxUses} />
        <Button type="submit" className="w-full rounded-sm">
          Create code
        </Button>
      </form>

      <ul className="divide-y divide-border border-y border-border">
        {codes?.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-4 py-3 text-sm">
            <div>
              <p className="tracking-widest">{c.code}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {String(c.role).replace("_", " ")} · used {c.used_count}/{c.max_uses}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggle(c.id, !c.is_active)}>
              {c.is_active ? "Revoke" : "Enable"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- shared ---------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-sand p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        className="rounded-sm bg-background"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
