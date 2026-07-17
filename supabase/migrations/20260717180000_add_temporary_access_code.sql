-- 1. Alter staff_profiles to add email and temp_code columns if they do not exist
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS temp_code text;

-- 2. Define function to generate unique random 4-digit code
CREATE OR REPLACE FUNCTION public.generate_unique_temp_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := lpad(floor(random() * 10000)::text, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.staff_profiles WHERE temp_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 3. Populate existing staff_profiles with email from auth.users
UPDATE public.staff_profiles sp
SET email = u.email
FROM auth.users u
WHERE sp.id = u.id AND sp.email IS NULL;

-- 4. Populate existing staff_profiles with unique code
UPDATE public.staff_profiles
SET temp_code = public.generate_unique_temp_code()
WHERE temp_code IS NULL;

-- 5. Drop constraint if exists first, then add it safely
ALTER TABLE public.staff_profiles DROP CONSTRAINT IF EXISTS staff_profiles_temp_code_key;
ALTER TABLE public.staff_profiles ADD CONSTRAINT staff_profiles_temp_code_key UNIQUE (temp_code);

-- 6. Update auth trigger handle_new_user to assign email and unique code
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', NULL),
    public.generate_unique_temp_code(),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- 7. Create RPC function to reset password using temporary code
CREATE OR REPLACE FUNCTION public.reset_password_with_temp_code(
  p_email text,
  p_temp_code text,
  p_new_password text
)
RETURNS boolean
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verify matching active user
  SELECT id INTO v_user_id
  FROM public.staff_profiles
  WHERE email = p_email AND temp_code = p_temp_code AND active = true;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Update password in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_user_id;

  -- Regenerate unique code
  UPDATE public.staff_profiles
  SET temp_code = public.generate_unique_temp_code()
  WHERE id = v_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 8. Create RPC function to verify temporary code
CREATE OR REPLACE FUNCTION public.verify_temp_code(
  p_email text,
  p_temp_code text
)
RETURNS boolean
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.staff_profiles 
    WHERE email = p_email AND temp_code = p_temp_code AND active = true
  );
END;
$$ LANGUAGE plpgsql;
