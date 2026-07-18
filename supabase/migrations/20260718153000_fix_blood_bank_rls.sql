-- Migration: Fix blood bank stock update RLS policy and default sign up role trigger

-- 1. Drop existing update policy
DROP POLICY IF EXISTS "blood_bank_staff_update" ON blood_bank_stock;

-- 2. Re-create update policy to include general_staff
CREATE POLICY "blood_bank_staff_update" ON blood_bank_stock FOR UPDATE
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

-- 3. Fix the public.handle_new_user() trigger default role to be 'general_staff'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_profiles (id, full_name, role, avatar, temp_code, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'general_staff'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', NULL),
    public.generate_unique_temp_code(),
    NEW.email
  );
  RETURN NEW;
END;
$$;
