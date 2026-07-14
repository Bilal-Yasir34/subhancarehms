/*
# Create Hospital Management System (HMS) schema

## Overview
This migration creates the complete database schema for the Subhan Care Clinic Hospital Management System.
The application uses a mock authentication flow (not Supabase Auth sessions), so all tables
are single-tenant: the anon-key frontend can read and write all data. Policies use
`TO anon, authenticated` so the anon client can operate freely.

## New Tables

1. **departments** — Hospital departments (Cardiology, Neurology, etc.)
   - `id` (uuid, PK)
   - `name` (text, unique) — department name
   - `icon` (text) — Lucide icon name for UI
   - `color` (text) — hex color for UI accents
   - `head_doctor_name` (text) — department head
   - `beds` (int) — total bed count
   - `occupied` (int) — occupied bed count

2. **doctors** — Medical professionals
   - `id` (uuid, PK)
   - `first_name`, `last_name` (text)
   - `avatar` (text) — avatar URL
   - `specialty` (text) — e.g. "Cardiologist"
   - `department` (text) — department name
   - `qualification` (text) — e.g. "MD, FACP"
   - `experience_years` (int)
   - `rating` (numeric) — 0-5
   - `phone`, `email` (text)
   - `status` (text) — available | busy | off-duty | on-leave
   - `room` (text)
   - `fee` (numeric) — consultation fee
   - `schedule` (jsonb) — weekly schedule array
   - `patients_treated` (int)
   - `created_at` (timestamptz)

3. **patients** — Registered patients
   - `id` (uuid, PK)
   - `mrn` (text, unique) — medical record number
   - `first_name`, `last_name` (text)
   - `avatar` (text)
   - `date_of_birth` (date)
   - `gender` (text) — male | female | other
   - `blood_type` (text)
   - `phone`, `email`, `address`, `city` (text)
   - `status` (text) — admitted | outpatient | discharged | emergency
   - `department` (text)
   - `admitted_on` (timestamptz, nullable)
   - `emergency_contact` (jsonb) — { name, relation, phone }
   - `insurance` (jsonb) — { provider, policy_number, valid_till }
   - `allergies` (text[]) — array of allergy names
   - `created_at` (timestamptz)

4. **medical_records** — Patient medical history
   - `id` (uuid, PK)
   - `patient_id` (uuid, FK → patients.id ON DELETE CASCADE)
   - `date` (timestamptz)
   - `diagnosis` (text)
   - `treatment` (text)
   - `doctor_name` (text)
   - `notes` (text, nullable)

5. **appointments** — Patient appointments with doctors
   - `id` (uuid, PK)
   - `patient_id` (uuid, FK → patients.id)
   - `patient_name` (text) — denormalized for list display
   - `patient_avatar` (text)
   - `doctor_id` (uuid, FK → doctors.id)
   - `doctor_name` (text) — denormalized
   - `department` (text)
   - `date` (timestamptz)
   - `time` (text) — e.g. "09:30"
   - `duration_min` (int)
   - `status` (text) — scheduled | completed | cancelled | no-show | in-progress
   - `type` (text) — consultation | follow-up | emergency | surgery | checkup
   - `reason` (text)
   - `room` (text)
   - `created_at` (timestamptz)

6. **invoices** — Billing invoices
   - `id` (uuid, PK)
   - `invoice_number` (text, unique)
   - `patient_id` (uuid, FK → patients.id)
   - `patient_name` (text)
   - `patient_avatar` (text)
   - `date` (timestamptz)
   - `due_date` (timestamptz)
   - `items` (jsonb) — array of { id, description, category, quantity, unit_price }
   - `subtotal` (numeric)
   - `tax_rate` (int)
   - `tax` (numeric)
   - `discount` (numeric)
   - `total` (numeric)
   - `amount_paid` (numeric)
   - `status` (text) — paid | pending | overdue | partially-paid
   - `payment_method` (text, nullable)
   - `notes` (text, nullable)
   - `created_at` (timestamptz)

7. **activities** — Activity timeline entries for dashboard
   - `id` (uuid, PK)
   - `type` (text) — appointment | admission | discharge | payment | doctor | lab
   - `title` (text)
   - `description` (text)
   - `time` (timestamptz)
   - `user_name` (text)
   - `user_avatar` (text)

8. **notifications** — System notifications
   - `id` (uuid, PK)
   - `title` (text)
   - `message` (text)
   - `time` (timestamptz)
   - `read` (boolean, default false)
   - `type` (text) — info | success | warning | error

## Security
- RLS enabled on ALL tables.
- All policies use `TO anon, authenticated` because the app uses mock auth (no Supabase sessions).
- Full CRUD access for both anon and authenticated roles — the data is intentionally shared.

## Important Notes
1. All tables use `gen_random_uuid()` for primary keys.
2. Foreign keys use `ON DELETE CASCADE` for medical_records (child of patients).
3. JSONB columns store structured data (schedule, emergency_contact, insurance, items, allergies).
4. Denormalized name/avatar fields on appointments and invoices for efficient list queries without joins.
5. Indexes added on frequently-queried columns (status, department, patient_id, doctor_id).
*/

-- ===== DEPARTMENTS =====
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'Activity',
  color text NOT NULL DEFAULT '#2563eb',
  head_doctor_name text NOT NULL DEFAULT '—',
  beds int NOT NULL DEFAULT 0,
  occupied int NOT NULL DEFAULT 0
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_departments" ON departments;
CREATE POLICY "anon_select_departments" ON departments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
CREATE POLICY "anon_insert_departments" ON departments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_departments" ON departments;
CREATE POLICY "anon_update_departments" ON departments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_departments" ON departments;
CREATE POLICY "anon_delete_departments" ON departments FOR DELETE
  TO anon, authenticated USING (true);

-- ===== DOCTORS =====
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  avatar text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT 'General Physician',
  department text NOT NULL DEFAULT 'General Medicine',
  qualification text NOT NULL DEFAULT 'MD',
  experience_years int NOT NULL DEFAULT 1,
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'available',
  room text NOT NULL DEFAULT 'A-100',
  fee numeric(10,2) NOT NULL DEFAULT 100,
  schedule jsonb NOT NULL DEFAULT '[]',
  patients_treated int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_doctors" ON doctors;
CREATE POLICY "anon_select_doctors" ON doctors FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_doctors" ON doctors;
CREATE POLICY "anon_insert_doctors" ON doctors FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_doctors" ON doctors;
CREATE POLICY "anon_update_doctors" ON doctors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_doctors" ON doctors;
CREATE POLICY "anon_delete_doctors" ON doctors FOR DELETE
  TO anon, authenticated USING (true);

-- ===== PATIENTS =====
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  avatar text NOT NULL DEFAULT '',
  date_of_birth date NOT NULL DEFAULT '1990-01-01',
  gender text NOT NULL DEFAULT 'male',
  blood_type text NOT NULL DEFAULT 'O+',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'outpatient',
  department text NOT NULL DEFAULT 'General Medicine',
  admitted_on timestamptz,
  emergency_contact jsonb NOT NULL DEFAULT '{"name":"","relation":"","phone":""}',
  insurance jsonb NOT NULL DEFAULT '{"provider":"","policy_number":"","valid_till":""}',
  allergies text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_department ON patients(department);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_patients" ON patients;
CREATE POLICY "anon_select_patients" ON patients FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_patients" ON patients;
CREATE POLICY "anon_insert_patients" ON patients FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_patients" ON patients;
CREATE POLICY "anon_update_patients" ON patients FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_patients" ON patients;
CREATE POLICY "anon_delete_patients" ON patients FOR DELETE
  TO anon, authenticated USING (true);

-- ===== MEDICAL RECORDS =====
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  diagnosis text NOT NULL,
  treatment text NOT NULL,
  doctor_name text NOT NULL,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_medical_records" ON medical_records;
CREATE POLICY "anon_select_medical_records" ON medical_records FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_medical_records" ON medical_records;
CREATE POLICY "anon_insert_medical_records" ON medical_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_medical_records" ON medical_records;
CREATE POLICY "anon_update_medical_records" ON medical_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_medical_records" ON medical_records;
CREATE POLICY "anon_delete_medical_records" ON medical_records FOR DELETE
  TO anon, authenticated USING (true);

-- ===== APPOINTMENTS =====
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_avatar text NOT NULL DEFAULT '',
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  department text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  time text NOT NULL DEFAULT '09:00',
  duration_min int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled',
  type text NOT NULL DEFAULT 'consultation',
  reason text NOT NULL DEFAULT '',
  room text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE
  TO anon, authenticated USING (true);

-- ===== INVOICES =====
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_avatar text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL DEFAULT now(),
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate int NOT NULL DEFAULT 8,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE
  TO anon, authenticated USING (true);

-- ===== ACTIVITIES =====
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'appointment',
  title text NOT NULL,
  description text NOT NULL,
  time timestamptz NOT NULL DEFAULT now(),
  user_name text NOT NULL DEFAULT 'System',
  user_avatar text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_activities_time ON activities(time DESC);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_activities" ON activities;
CREATE POLICY "anon_select_activities" ON activities FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activities" ON activities;
CREATE POLICY "anon_insert_activities" ON activities FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activities" ON activities;
CREATE POLICY "anon_update_activities" ON activities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activities" ON activities;
CREATE POLICY "anon_delete_activities" ON activities FOR DELETE
  TO anon, authenticated USING (true);

-- ===== NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  time timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false,
  type text NOT NULL DEFAULT 'info'
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE
  TO anon, authenticated USING (true);
