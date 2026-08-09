import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, type Variant } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VariantsPanel({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [sku, setSku] = useState("");
  const [delta, setDelta] = useState("0");
  const [stock, setStock] = useState("0");

  const { data: variants } = useQuery({
    queryKey: ["admin-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id,product_id,size,color,sku,price_delta,stock,is_active")
        .eq("product_id", productId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Variant[];
    },
  });

  async function addVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!size.trim() && !color.trim()) {
      toast.error("Add a size or a colour");
      return;
    }
    const { error } = await supabase.from("product_variants").insert({
      product_id: productId,
      size: size.trim() || null,
      color: color.trim() || null,
      sku: sku.trim() || null,
      price_delta: Number(delta || 0),
      stock: Number(stock || 0),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSize("");
    setColor("");
    setSku("");
    setDelta("0");
    setStock("0");
    void qc.invalidateQueries({ queryKey: ["admin-variants", productId] });
    toast.success("Option added");
  }

  async function update(id: string, patch: Partial<Variant>) {
    const { error } = await supabase.from("product_variants").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["admin-variants", productId] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["admin-variants", productId] });
  }

  return (
    <div className="rounded-sm border border-border p-5">
      <p className="eyebrow">Options &amp; inventory</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Add sizes and colours with their own stock. Leave empty to sell the product without options.
      </p>

      <ul className="mt-4 divide-y divide-border">
        {variants?.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="min-w-32 flex-1">
              {[v.size, v.color].filter(Boolean).join(" · ") || "—"}
              {Number(v.price_delta) !== 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {Number(v.price_delta) > 0 ? "+" : "−"}
                  {formatINR(Math.abs(Number(v.price_delta)))}
                </span>
              )}
            </span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Stock
              <Input
                type="number"
                className="h-8 w-20 rounded-sm"
                defaultValue={String(v.stock)}
                onBlur={(e) => {
                  const next = Number(e.target.value);
                  if (next !== v.stock) void update(v.id, { stock: next });
                }}
              />
            </label>
            <Button variant="ghost" size="sm" onClick={() => update(v.id, { is_active: !v.is_active })}>
              {v.is_active ? "Hide" : "Show"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove(v.id)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={addVariant} className="mt-4 grid gap-3 sm:grid-cols-5">
        <Small label="Size" value={size} onChange={setSize} />
        <Small label="Colour" value={color} onChange={setColor} />
        <Small label="SKU" value={sku} onChange={setSku} />
        <Small label="± Price" value={delta} onChange={setDelta} type="number" />
        <Small label="Stock" value={stock} onChange={setStock} type="number" />
        <div className="sm:col-span-5">
          <Button type="submit" variant="outline" className="rounded-sm">
            Add option
          </Button>
        </div>
      </form>
    </div>
  );
}

function Small({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        className="h-9 rounded-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
