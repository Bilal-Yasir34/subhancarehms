-- Alter staff_profiles constraint to allow 'patient' role
ALTER TABLE staff_profiles DROP CONSTRAINT IF EXISTS staff_profiles_role_check;
ALTER TABLE staff_profiles ADD CONSTRAINT staff_profiles_role_check CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient'));

-- Add patient_id to staff_profiles to link portal users with patients
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES patients(id) ON DELETE SET NULL;
