/*
# Fix admin credentials and rebrand leftover "Meridian" seed data

## Why
The initial seed migration created the admin account as `admin@meridian.med`
(leftover from an earlier project name), not `admin@subhancare.com`. This
migration:

1. Renames the existing admin login to `admin@subhancare.com` with password
   `Admin@123`, and makes sure the email is confirmed and the profile role
   is 'admin'. If no admin account exists yet at all, it creates one fresh.
2. Updates seeded doctor contact emails from `@meridian.med` to
   `@subhancare.com` for consistency.

## Admin credentials after this migration
- Email: admin@subhancare.com
- Password: Admin@123

This migration is idempotent and safe to run multiple times.
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find the existing admin account, whether seeded under the old
  -- meridian.med address or already renamed to subhancare.com
  SELECT id INTO v_user_id FROM auth.users
  WHERE email IN ('admin@meridian.med', 'admin@subhancare.com')
  ORDER BY (email = 'admin@subhancare.com') DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    -- No admin account exists at all — create one from scratch
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, email_confirmed_at,
      encrypted_password, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
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
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO v_user_id;

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@subhancare.com', 'full_name', 'System Administrator'),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  ELSE
    -- Admin account already exists — fix its email, password, and confirmation status
    UPDATE auth.users
    SET
      email = 'admin@subhancare.com',
      encrypted_password = crypt('Admin@123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      email_change = '',
      email_change_token_new = '',
      confirmation_token = '',
      recovery_token = '',
      updated_at = now()
    WHERE id = v_user_id;

    UPDATE auth.identities
    SET
      identity_data = jsonb_set(identity_data, '{email}', '"admin@subhancare.com"'),
      provider_id = v_user_id::text,
      updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  -- Make sure the profile exists and is promoted to admin
  UPDATE staff_profiles
  SET role = 'admin', full_name = 'System Administrator', active = true
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO staff_profiles (id, full_name, role, avatar, active)
    VALUES (v_user_id, 'System Administrator', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@subhancare.com', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'System Administrator', active = true;
  END IF;
END $$;

-- Rebrand seeded doctor contact emails
UPDATE doctors
SET email = replace(email, '@meridian.med', '@subhancare.com')
WHERE email LIKE '%@meridian.med';
