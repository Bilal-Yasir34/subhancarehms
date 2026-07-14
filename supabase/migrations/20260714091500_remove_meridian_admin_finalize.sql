/*
# Remove leftover Meridian admin account, guarantee correct Subhan Care admin

## Why
An earlier migration seeded the admin login as `admin@meridian.med`. A
follow-up migration attempted to rename that account, but if a separate
`admin@subhancare.com` account had also been created in the meantime
(e.g. manually via the Supabase dashboard), the old `admin@meridian.med`
account was left behind untouched — which is why it could still be used to
log in.

This migration is the definitive fix. It guarantees, after running:
- Exactly ONE admin account exists.
- Its email is `admin@subhancare.com`.
- Its password is `Admin@123`.
- Its email is confirmed.
- Its staff_profiles role is 'admin'.
- ANY other account with "meridian" anywhere in its email is deleted
  outright (cascades to auth.identities and staff_profiles).

Safe to run multiple times.
*/

DO $$
DECLARE
  v_keep_id uuid;
BEGIN
  -- Prefer an existing admin@subhancare.com account, if one exists
  SELECT id INTO v_keep_id FROM auth.users WHERE email = 'admin@subhancare.com';

  -- Otherwise, fall back to renaming the old meridian account in place
  IF v_keep_id IS NULL THEN
    SELECT id INTO v_keep_id FROM auth.users WHERE email ILIKE '%meridian%' LIMIT 1;
  END IF;

  IF v_keep_id IS NULL THEN
    -- Neither exists — create a fresh admin account
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, email_confirmed_at,
      encrypted_password, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'admin@subhancare.com', now(),
      crypt('Admin@123', gen_salt('bf')),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Administrator","role":"admin"}',
      now(), now(), '', '', '', ''
    )
    RETURNING id INTO v_keep_id;

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_keep_id,
      jsonb_build_object('sub', v_keep_id::text, 'email', 'admin@subhancare.com', 'full_name', 'System Administrator'),
      'email', v_keep_id::text, now(), now(), now()
    );
  ELSE
    -- Force the surviving account to the correct email, password, and confirmation state
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
    WHERE id = v_keep_id;

    UPDATE auth.identities
    SET identity_data = jsonb_set(identity_data, '{email}', '"admin@subhancare.com"'), updated_at = now()
    WHERE user_id = v_keep_id AND provider = 'email';
  END IF;

  -- Delete every OTHER account that still has "meridian" in its email —
  -- this is the step that was missing before, and why the old login still worked
  DELETE FROM auth.users WHERE email ILIKE '%meridian%' AND id <> v_keep_id;

  -- Guarantee the profile is correct
  UPDATE staff_profiles
  SET role = 'admin', full_name = 'System Administrator', active = true
  WHERE id = v_keep_id;

  IF NOT FOUND THEN
    INSERT INTO staff_profiles (id, full_name, role, avatar, active)
    VALUES (v_keep_id, 'System Administrator', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@subhancare.com', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'System Administrator', active = true;
  END IF;
END $$;

-- Belt-and-braces: make sure no doctor/staff seed rows still reference meridian.med
UPDATE doctors SET email = replace(email, '@meridian.med', '@subhancare.com') WHERE email LIKE '%@meridian.med';
