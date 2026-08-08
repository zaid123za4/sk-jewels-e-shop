REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.can_manage_catalog(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_catalog(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.can_manage_orders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_orders(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;