/*
# Create blood_bank_stock table

## Overview
Adds a `blood_bank_stock` table so staff can track how many units of each blood
type are currently available. Powers the new "Blood Bank" tab in the general
staff (receptionist) portal, alongside Inventory.

## New Tables

1. **blood_bank_stock** — Available blood units by type
   - `id` (uuid, PK)
   - `blood_type` (text, unique) — e.g. A+, O-, AB+
   - `units_available` (int) — current stock of units
   - `reorder_level` (int) — minimum units before a low-stock warning
   - `location` (text, nullable) — storage location / fridge reference
   - `updated_at` (timestamptz) — last time stock was updated
   - `created_at` (timestamptz)

## Security
- RLS enabled.
- Any authenticated user can read stock levels.
- Admins and receptionists (general staff) can update stock levels.
- Only admins can insert or delete blood type rows.

## Notes
Seeds the standard 8 blood types with a starting stock of 0 units so the page
has rows to render immediately after migration.
*/

CREATE TABLE IF NOT EXISTS blood_bank_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_type text UNIQUE NOT NULL,
  units_available int NOT NULL DEFAULT 0,
  reorder_level int NOT NULL DEFAULT 5,
  location text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blood_bank_type ON blood_bank_stock(blood_type);

ALTER TABLE blood_bank_stock ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read blood bank stock
DROP POLICY IF EXISTS "blood_bank_select" ON blood_bank_stock;
CREATE POLICY "blood_bank_select" ON blood_bank_stock FOR SELECT
  TO authenticated USING (true);

-- Admins and receptionists (general staff) can update stock levels
DROP POLICY IF EXISTS "blood_bank_staff_update" ON blood_bank_stock;
CREATE POLICY "blood_bank_staff_update" ON blood_bank_stock FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role IN ('admin', 'receptionist'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role IN ('admin', 'receptionist'))
  );

-- Only admins can add or remove blood type rows
DROP POLICY IF EXISTS "blood_bank_admin_insert" ON blood_bank_stock;
CREATE POLICY "blood_bank_admin_insert" ON blood_bank_stock FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  );

DROP POLICY IF EXISTS "blood_bank_admin_delete" ON blood_bank_stock;
CREATE POLICY "blood_bank_admin_delete" ON blood_bank_stock FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.id = auth.uid() AND sp.role = 'admin')
  );

-- ===== SEED: standard blood types =====
INSERT INTO blood_bank_stock (blood_type, units_available, reorder_level)
VALUES
  ('A+', 0, 5), ('A-', 0, 5),
  ('B+', 0, 5), ('B-', 0, 5),
  ('AB+', 0, 5), ('AB-', 0, 5),
  ('O+', 0, 5), ('O-', 0, 5)
ON CONFLICT (blood_type) DO NOTHING;
