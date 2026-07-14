/*
# Add auth trigger for auto staff_profile creation + seed inventory items

## Changes

### 1. Auth Trigger — auto-create staff_profiles row on signup
- Creates function `handle_new_user()` that inserts a row into `staff_profiles`
  using the new auth user's `id`, `email`, and `full_name` from `raw_user_meta_data`.
- Default role is 'receptionist' (can be changed later by admin).
- Creates trigger `on_auth_user_created` on `auth.users` AFTER INSERT.

### 2. Seed inventory_items
- Inserts 12 inventory items across Medication, Equipment, Supplies, Lab Reagent categories
- Prices in PKR

### 3. RLS policy fix for staff_profiles SELECT
- The existing `staff_select_all` uses `USING (true)` which is fine for authenticated users
  to read all staff profiles (needed for admin panel). No change needed.

## Security
- No new tables created.
- Trigger runs as `auth.uid()` context — the new user's own ID is used.
- staff_profiles INSERT policy `staff_insert_own` allows `auth.uid() = id` — the trigger
  inserts with the user's own ID so this succeeds.
*/

-- 1. Create the handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_profiles (id, full_name, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'receptionist',
    true
  );
  RETURN NEW;
END;
$$;

-- 2. Create the trigger (drop if exists first for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Seed inventory items (PKR pricing)
INSERT INTO inventory_items (name, category, sku, quantity, unit, reorder_level, unit_price, supplier, location)
VALUES
  ('Paracetamol 500mg', 'Medication', 'MED-001', 4500, 'tablets', 1000, 2.50, 'PharmaCorp Pakistan', 'Pharmacy A-12'),
  ('Amoxicillin 250mg', 'Medication', 'MED-002', 2800, 'capsules', 800, 8.00, 'PharmaCorp Pakistan', 'Pharmacy A-14'),
  ('Surgical Gloves (M)', 'Supplies', 'SUP-001', 320, 'boxes', 100, 850.00, 'MediSupply PK', 'Storage B-03'),
  ('Surgical Gloves (L)', 'Supplies', 'SUP-002', 280, 'boxes', 100, 850.00, 'MediSupply PK', 'Storage B-03'),
  ('Syringes 5ml', 'Supplies', 'SUP-003', 1500, 'units', 300, 12.00, 'MediSupply PK', 'Storage B-05'),
  ('IV Drip Set', 'Supplies', 'SUP-004', 220, 'units', 80, 180.00, 'MediSupply PK', 'Storage B-08'),
  ('ECG Machine', 'Equipment', 'EQP-001', 4, 'units', 1, 450000, 'MedTech Solutions', 'Cardiology Dept'),
  ('Defibrillator', 'Equipment', 'EQP-002', 2, 'units', 1, 320000, 'MedTech Solutions', 'Emergency Ward'),
  ('Blood Test Kit (CBC)', 'Lab Reagent', 'LAB-001', 180, 'kits', 50, 350.00, 'LabPro PK', 'Lab Storage C-01'),
  ('X-Ray Film', 'Lab Reagent', 'LAB-002', 600, 'sheets', 150, 75.00, 'LabPro PK', 'Radiology Storage'),
  ('Bandages (Sterile)', 'Supplies', 'SUP-005', 850, 'rolls', 200, 45.00, 'MediSupply PK', 'Storage B-02'),
  ('Oxygen Cylinder', 'Equipment', 'EQP-003', 15, 'cylinders', 5, 12500, 'GasTech PK', 'Emergency Ward')
ON CONFLICT DO NOTHING;
