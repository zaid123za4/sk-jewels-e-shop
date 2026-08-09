CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text,
  color text,
  sku text,
  price_delta numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_id_idx ON public.product_variants(product_id);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants public read" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "variants managed" ON public.product_variants FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid())) WITH CHECK (public.can_manage_catalog(auth.uid()));
CREATE TRIGGER product_variants_updated BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.order_items
  ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN variant_label text;

CREATE TABLE public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL DEFAULT 'return',
  items text,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'requested',
  staff_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX return_requests_order_id_idx ON public.return_requests(order_id);
GRANT SELECT, INSERT ON public.return_requests TO authenticated;
GRANT UPDATE ON public.return_requests TO authenticated;
GRANT ALL ON public.return_requests TO service_role;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "returns own insert" ON public.return_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "returns own or staff read" ON public.return_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.can_manage_orders(auth.uid()));
CREATE POLICY "returns staff update" ON public.return_requests FOR UPDATE TO authenticated
  USING (public.can_manage_orders(auth.uid())) WITH CHECK (public.can_manage_orders(auth.uid()));
CREATE TRIGGER return_requests_updated BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();