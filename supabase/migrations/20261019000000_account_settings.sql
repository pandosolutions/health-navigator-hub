-- =========================================================================
-- Account settings: name, password and deleting the account.
--
--   profiles.full_name          the user's name (filled from Google on sign-up)
--   my_account_has_password()   false for Google-only accounts ("Set password")
--   delete_my_account()         deletes the caller's sign-in; their profile,
--                               roles, health data and saved items go with it
--                               (ON DELETE CASCADE)
-- =========================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT CHECK (char_length(full_name) <= 120);

-- Existing accounts: the name Google gave us, if any.
UPDATE public.profiles p
SET full_name = nullif(btrim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), '')
FROM auth.users u
WHERE u.id = p.id AND p.full_name IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    nullif(btrim(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), '')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.my_account_has_password()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT u.encrypted_password IS NOT NULL AND u.encrypted_password <> ''
     FROM auth.users u WHERE u.id = auth.uid()),
    false)
$$;
REVOKE EXECUTE ON FUNCTION public.my_account_has_password() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_account_has_password() TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

SELECT 'Account settings ready' AS result;
