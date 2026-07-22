-- Migration: Add delete_user_account RPC and RLS policy for self-deletion

-- 1. Allow authenticated users to delete their own staff_profiles row
DROP POLICY IF EXISTS "staff_delete_own" ON public.staff_profiles;
CREATE POLICY "staff_delete_own" ON public.staff_profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- 2. Create SECURITY DEFINER function to delete user from auth.users and all cascading tables
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_doc_id uuid;
  v_pat_id uuid;
BEGIN
  -- Security check: caller can delete their own account, or an admin can delete any account
  IF auth.uid() <> p_user_id AND NOT EXISTS (
    SELECT 1 FROM public.staff_profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete this account';
  END IF;

  -- Get linked doctor and patient IDs
  SELECT doctor_id, patient_id INTO v_doc_id, v_pat_id
  FROM public.staff_profiles
  WHERE id = p_user_id;

  -- Delete targeted notifications
  DELETE FROM public.notifications WHERE target_user_id = p_user_id;

  -- Delete linked doctor profile if present
  IF v_doc_id IS NOT NULL THEN
    DELETE FROM public.doctors WHERE id = v_doc_id;
  END IF;

  -- Delete linked patient profile if present
  IF v_pat_id IS NOT NULL THEN
    DELETE FROM public.patients WHERE id = v_pat_id;
  END IF;

  -- Delete staff_profiles record explicitly
  DELETE FROM public.staff_profiles WHERE id = p_user_id;

  -- Delete from auth.users (destroys login credentials completely)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: mark profile inactive so login is blocked if auth.users delete fails
    UPDATE public.staff_profiles SET active = false WHERE id = p_user_id;
    RETURN false;
END;
$$;
