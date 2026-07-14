/*
# Create staff_profiles table for role-based access control

## Overview
This migration creates a `staff_profiles` table that links to Supabase Auth's `auth.users`
table. Each staff member (admin, doctor, receptionist) has a profile with their role,
display name, phone, and optional link to a doctor record (for doctor-role users).

## New Tables

1. **staff_profiles** — User role and profile data
   - `id` (uuid, PK, references auth.users.id ON DELETE CASCADE)
   - `full_name` (text) — display name
   - `role` (text) — admin | doctor | receptionist
   - `phone` (text, nullable)
   - `avatar` (text, nullable) — avatar URL
   - `doctor_id` (uuid, nullable, FK → doctors.id) — links a doctor-role user to their doctor record
   - `department` (text, nullable) — department for the staff member
   - `active` (boolean, default true) — can be deactivated by admin
   - `created_at` (timestamptz)

2. **inventory_items** — Hospital inventory/supplies
   - `id` (uuid, PK)
   - `name` (text) — item name
   - `category` (text) — e.g. Medication, Equipment, Supplies
   - `sku` (text, unique) — stock keeping unit
   - `quantity` (int) — current stock
   - `unit` (text) — e.g. boxes, bottles, units
   - `reorder_level` (int) — minimum stock before reorder alert
   - `unit_price` (numeric) — cost per unit (PKR)
   - `supplier` (text, nullable)
   - `expiry_date` (date, nullable) — for medications
   - `location` (text, nullable) — storage location
   - `created_at` (timestamptz)

## Security
- RLS enabled on both tables.
- staff_profiles: `TO authenticated` — any logged-in user can read profiles (needed for doctor selection etc.),
  but only admins can insert/update/delete. Self-update allowed for own profile.
- inventory_items: `TO authenticated` — any logged-in user can read; only admins can write.

## Important Notes
1. staff_profiles.id = auth.users.id (1:1 relationship)
2. A trigger function `handle_new_user` automatically creates a staff_profile when a new auth user signs up
   with role defaulting to 'receptionist'. Admin can then upgrade the role.
3. The admin user will be created via auth.signUp in the application, then manually promoted to admin role.
4. inventory_items uses PKR pricing (unit_price in rupees).
*/

-- ===== STAFF PROFILES =====
CREATE TABLE IF NOT EXISTS staff_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'doctor', 'receptionist')),
  phone text,
  avatar text,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  department text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles(role);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read profiles
DROP POLICY IF EXISTS "staff_select_all" ON staff_profiles;
CREATE POLICY "staff_select_all" ON staff_profiles FOR SELECT
  TO authenticated USING (true);

-- Users can insert their own profile (trigger does this, but allow it)
DROP POLICY IF EXISTS "staff_insert_own" ON staff_profiles;
CREATE POLICY "staff_insert_own" ON staff_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Users can update their own profile (name, phone, avatar)
DROP POLICY IF EXISTS "staff_update_own" ON staff_profiles;
CREATE POLICY "staff_update_own" ON staff_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins can insert/update/delete any profile
DROP POLICY IF EXISTS "staff_admin_insert" ON staff_profiles;
CREATE POLICY "staff_admin_insert" ON staff_profiles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  );

DROP POLICY IF EXISTS "staff_admin_update" ON staff_profiles;
CREATE POLICY "staff_admin_update" ON staff_profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  );

DROP POLICY IF EXISTS "staff_admin_delete" ON staff_profiles;
CREATE POLICY "staff_admin_delete" ON staff_profiles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  );

-- ===== INVENTORY ITEMS =====
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Supplies',
  sku text UNIQUE NOT NULL,
  quantity int NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'units',
  reorder_level int NOT NULL DEFAULT 10,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  supplier text,
  expiry_date date,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_items(name);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read inventory
DROP POLICY IF EXISTS "inv_select" ON inventory_items;
CREATE POLICY "inv_select" ON inventory_items FOR SELECT
  TO authenticated USING (true);

-- Only admins can insert/update/delete inventory
DROP POLICY IF EXISTS "inv_admin_insert" ON inventory_items;
CREATE POLICY "inv_admin_insert" ON inventory_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  );

DROP POLICY IF EXISTS "inv_admin_update" ON inventory_items;
CREATE POLICY "inv_admin_update" ON inventory_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  );

DROP POLICY IF EXISTS "inv_admin_delete" ON inventory_items;
CREATE POLICY "inv_admin_delete" ON inventory_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  );

-- ===== TRIGGER: Auto-create staff_profile on signup =====
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', NULL)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
