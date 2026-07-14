-- Migration: Rename 'receptionist' role to 'general_staff' in staff_profiles
-- This updates any existing staff_profiles rows that have role = 'receptionist'
-- so they can continue to log in under the new role name.

UPDATE staff_profiles
SET role = 'general_staff'
WHERE role = 'receptionist';
