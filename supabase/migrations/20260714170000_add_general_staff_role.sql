-- Migration: Add 'general_staff' role support
-- Fixes two issues:
-- 1. The role CHECK constraint only allowed ('admin','doctor','receptionist') — 
--    'general_staff' was rejected, causing silent failures on update.
-- 2. Inventory RLS only allowed 'admin' to write — general_staff needs write access.

-- ===== 1. Fix the role CHECK constraint on staff_profiles =====
-- Drop the old constraint and recreate it with 'general_staff' included.
ALTER TABLE staff_profiles
  DROP CONSTRAINT IF EXISTS staff_profiles_role_check;

ALTER TABLE staff_profiles
  ADD CONSTRAINT staff_profiles_role_check
  CHECK (role IN ('admin', 'doctor', 'general_staff', 'patient', 'receptionist'));

-- ===== 2. Migrate any existing 'receptionist' rows to 'general_staff' =====
UPDATE staff_profiles
SET role = 'general_staff'
WHERE role = 'receptionist';

-- ===== 3. Update the trigger default from 'receptionist' to 'general_staff' =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_profiles (id, full_name, role, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'general_staff'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', NULL)
  );
  RETURN NEW;
END;
$$;

-- ===== 4. Allow general_staff to write to inventory_items =====
-- Drop old admin-only policies and replace with admin + general_staff policies.

DROP POLICY IF EXISTS "inv_admin_insert" ON inventory_items;
CREATE POLICY "inv_staff_insert" ON inventory_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid()
        AND sp.role IN ('admin', 'general_staff', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "inv_admin_update" ON inventory_items;
CREATE POLICY "inv_staff_update" ON inventory_items FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid()
        AND sp.role IN ('admin', 'general_staff', 'receptionist')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid()
        AND sp.role IN ('admin', 'general_staff', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "inv_admin_delete" ON inventory_items;
CREATE POLICY "inv_staff_delete" ON inventory_items FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid()
        AND sp.role IN ('admin', 'general_staff', 'receptionist')
    )
  );

-- ===== 5. Allow general_staff to update other users' profiles (needed for admin operations) =====
-- The staff_admin_update policy requires role='admin'. This is correct — general_staff
-- should NOT be able to update other users' profiles. Only their own (already covered by
-- staff_update_own policy). No change needed here.
