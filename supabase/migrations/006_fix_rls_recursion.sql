-- Fix: RLS infinite recursion on profiles table
-- The profiles_admin_select policy was querying profiles to check admin role,
-- which re-triggered the same policy, causing a 500 / stack depth error.
-- Solution: SECURITY DEFINER function that bypasses RLS when checking admin status.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Re-create all policies that referenced profiles for admin check

-- profiles: any user reads their own row; admin reads all
DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

-- profiles: user updates own row; admin updates any
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin());

-- profiles: only admin can delete
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE
  USING (is_admin());

-- site_config: only admin can update
DROP POLICY IF EXISTS "site_config_update" ON site_config;
CREATE POLICY "site_config_update" ON site_config FOR UPDATE
  USING (is_admin());

-- properties: admin has full access
DROP POLICY IF EXISTS "properties_admin" ON properties;
CREATE POLICY "properties_admin" ON properties FOR ALL
  USING (is_admin());
