# Subhan Care Clinic

A hospital management system built with React 18, TypeScript, Vite, and Supabase.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project's URL and anon/publishable key:
   ```
   cp .env.example .env
   ```
3. Run the app:
   ```
   npm run dev
   ```

## Environment variables

| Variable | Where used | Safe for client? |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend (Vite exposes all `VITE_`-prefixed vars to the browser) | Yes |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Yes — **only** because Row Level Security (RLS) is enabled on every table. If you ever add a table, you must enable RLS on it before deploying. |

This project has no backend server, so no server-only secrets (service role key, Stripe secret key, database URLs, JWT signing secrets, etc.) are needed or should ever be added to the frontend `.env`. If a backend/serverless function is added later, server-only secrets must live in that environment's own config (e.g. Vercel/Supabase Edge Function environment variables), never in this repo or in any `VITE_`-prefixed variable.

## ⚠️ Security notice — rotate before/at launch

- **Default admin credentials are seeded via SQL migration** (`supabase/migrations/20260714082350_seed_admin_user.sql` and later migrations touching the same account): `admin@subhancare.com` / `Admin@123`. This password is committed in plain text in the migration files and therefore also lives in this repo's **git history**. Treat it as compromised:
  - Log in once after deployment and immediately change the admin password from the Settings page, or
  - Delete/recreate the admin user with a strong, unique password before going live.
- If any other credential was ever hardcoded in a previous version of this codebase, assume it is compromised even after removal — it still exists in git history. Rotate it at the source (e.g. regenerate the key in the Supabase/Stripe/etc. dashboard) rather than relying on deleting it from the current code.
- Never commit `.env`. It's already listed in `.gitignore` — keep it that way.
