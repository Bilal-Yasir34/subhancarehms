/*
# Update RLS policies for authenticated-only access

## Overview
Switches all existing tables from anon+authenticated policies to authenticated-only,
since the app now uses Supabase Auth. Only logged-in users can access hospital data.

## Changes
- Drops all existing anon policies on: departments, doctors, patients, medical_records,
  appointments, invoices, activities, notifications
- Creates new authenticated-only CRUD policies on each table
- Any authenticated staff member can read/write all hospital operational data
  (fine-grained role checks are enforced in the frontend)
*/

-- ===== DEPARTMENTS =====
DROP POLICY IF EXISTS "anon_select_departments" ON departments;
DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
DROP POLICY IF EXISTS "anon_update_departments" ON departments;
DROP POLICY IF EXISTS "anon_delete_departments" ON departments;

CREATE POLICY "auth_select_departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_departments" ON departments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_departments" ON departments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_departments" ON departments FOR DELETE TO authenticated USING (true);

-- ===== DOCTORS =====
DROP POLICY IF EXISTS "anon_select_doctors" ON doctors;
DROP POLICY IF EXISTS "anon_insert_doctors" ON doctors;
DROP POLICY IF EXISTS "anon_update_doctors" ON doctors;
DROP POLICY IF EXISTS "anon_delete_doctors" ON doctors;

CREATE POLICY "auth_select_doctors" ON doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_doctors" ON doctors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_doctors" ON doctors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_doctors" ON doctors FOR DELETE TO authenticated USING (true);

-- ===== PATIENTS =====
DROP POLICY IF EXISTS "anon_select_patients" ON patients;
DROP POLICY IF EXISTS "anon_insert_patients" ON patients;
DROP POLICY IF EXISTS "anon_update_patients" ON patients;
DROP POLICY IF EXISTS "anon_delete_patients" ON patients;

CREATE POLICY "auth_select_patients" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_patients" ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_patients" ON patients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_patients" ON patients FOR DELETE TO authenticated USING (true);

-- ===== MEDICAL RECORDS =====
DROP POLICY IF EXISTS "anon_select_medical_records" ON medical_records;
DROP POLICY IF EXISTS "anon_insert_medical_records" ON medical_records;
DROP POLICY IF EXISTS "anon_update_medical_records" ON medical_records;
DROP POLICY IF EXISTS "anon_delete_medical_records" ON medical_records;

CREATE POLICY "auth_select_medical_records" ON medical_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_medical_records" ON medical_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_medical_records" ON medical_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_medical_records" ON medical_records FOR DELETE TO authenticated USING (true);

-- ===== APPOINTMENTS =====
DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;

CREATE POLICY "auth_select_appointments" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_appointments" ON appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_appointments" ON appointments FOR DELETE TO authenticated USING (true);

-- ===== INVOICES =====
DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;

CREATE POLICY "auth_select_invoices" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_invoices" ON invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_invoices" ON invoices FOR DELETE TO authenticated USING (true);

-- ===== ACTIVITIES =====
DROP POLICY IF EXISTS "anon_select_activities" ON activities;
DROP POLICY IF EXISTS "anon_insert_activities" ON activities;
DROP POLICY IF EXISTS "anon_update_activities" ON activities;
DROP POLICY IF EXISTS "anon_delete_activities" ON activities;

CREATE POLICY "auth_select_activities" ON activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_activities" ON activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_activities" ON activities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_activities" ON activities FOR DELETE TO authenticated USING (true);

-- ===== NOTIFICATIONS =====
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;

CREATE POLICY "auth_select_notifications" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_notifications" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_notifications" ON notifications FOR DELETE TO authenticated USING (true);
