CREATE POLICY "product images read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY "product images insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.can_manage_catalog(auth.uid()));
CREATE POLICY "product images update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.can_manage_catalog(auth.uid()));
CREATE POLICY "product images delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.can_manage_catalog(auth.uid()));