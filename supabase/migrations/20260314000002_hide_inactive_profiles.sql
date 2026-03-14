-- Hide deactivated profiles from public queries.
--
-- Uses a security definer function to check admin status
-- (same pattern as is_group_member/is_group_admin) to avoid
-- infinite recursion when the policy queries the profiles table itself.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Replace the open "anyone can read all profiles" policy with one
-- that hides inactive accounts. Active profiles remain public;
-- a user can always read their own row; admins can read everyone.
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

CREATE POLICY "Active profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (
    is_active = true
    OR id = auth.uid()
    OR is_admin()
  );
