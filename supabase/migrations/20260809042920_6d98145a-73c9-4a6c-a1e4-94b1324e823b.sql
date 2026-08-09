CREATE OR REPLACE FUNCTION public.consume_stock_for_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE it RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id
      AND (o.user_id = auth.uid() OR public.can_manage_orders(auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  FOR it IN SELECT product_id, variant_id, quantity FROM public.order_items WHERE order_id = _order_id LOOP
    IF it.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
        SET stock = GREATEST(0, stock - it.quantity)
        WHERE id = it.variant_id;
    ELSIF it.product_id IS NOT NULL THEN
      UPDATE public.products
        SET stock = GREATEST(0, stock - it.quantity)
        WHERE id = it.product_id;
    END IF;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_stock_for_order(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_stock_for_order(uuid) TO authenticated;