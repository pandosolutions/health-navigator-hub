
-- Replace overly-permissive mailing list insert policy
DROP POLICY IF EXISTS "Anyone subscribes" ON public.mailing_list;
CREATE POLICY "Anyone subscribes" ON public.mailing_list
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(trim(email)) BETWEEN 3 AND 254 AND email LIKE '%_@_%.__%');

-- Lock down trigger-only functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_health_data_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
