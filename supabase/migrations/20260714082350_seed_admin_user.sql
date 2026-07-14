/*
# Seed initial admin user in Supabase Auth

Creates the initial admin user in auth.users with email/password auth.
The trigger on auth.users will automatically create a staff_profile row.
We then promote that profile to role='admin'.

Admin credentials:
- Email: admin@subhancare.com
- Password: Admin@123
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if admin already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@subhancare.com';

  IF v_user_id IS NULL THEN
    -- Insert the admin user into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      email_confirmed_at,
      encrypted_password,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@subhancare.com',
      now(),
      crypt('Admin@123', gen_salt('bf')),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Administrator","role":"admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;

    -- Insert into auth.identities (required for Supabase auth to work)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@subhancare.com', 'full_name', 'System Administrator'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- Promote the staff_profile to admin role (trigger should have created it)
  UPDATE staff_profiles
  SET role = 'admin', full_name = 'System Administrator'
  WHERE id = v_user_id;

  -- If trigger didn't fire (edge case), create the profile manually
  IF NOT FOUND AND v_user_id IS NOT NULL THEN
    INSERT INTO staff_profiles (id, full_name, role, avatar)
    VALUES (v_user_id, 'System Administrator', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@subhancare.com')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'System Administrator';
  END IF;
END $$;
