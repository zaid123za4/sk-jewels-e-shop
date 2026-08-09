import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RETURN_STATUSES } from "@/lib/shop";
import { Input } from "@/components/ui/input";

export function ReturnsTab() {
  const qc = useQueryClient();

  const { data: requests } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("return_requests")
        .select("*, orders(order_number, total, shipping_address)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function patch(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from("return_requests").update(values).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request updated");
    void qc.invalidateQueries({ queryKey: ["admin-returns"] });
  }

  if (!requests?.length) {
    return <p className="text-sm text-muted-foreground">No return or exchange requests yet.</p>;
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {requests.map((r) => {
        const order = r.orders as { order_number: string } | null;
        return (
          <li key={r.id} className="py-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p>
                  {order?.order_number} · <span className="capitalize">{r.request_type}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-IN")} · {r.reason}
                  {r.items ? ` — ${r.items}` : ""}
                </p>
                {r.details && <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>}
              </div>
              <select
                className="h-9 rounded-sm border border-input bg-background px-2 text-xs capitalize"
                value={r.status}
                onChange={(e) => patch(r.id, { status: e.target.value })}
              >
                {RETURN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <Input
              className="mt-3 h-9 rounded-sm"
              placeholder="Note for the customer…"
              defaultValue={r.staff_note ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (r.staff_note ?? "")) {
                  void patch(r.id, { staff_note: e.target.value || null });
                }
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}
