-- 026_add_users_is_demo.sql
-- Flags the shared demo account behind the public "Try the demo" login.
-- "Demo-ness" is enforced by the app (seeding + nightly reset), not by Auth0 —
-- the demo user is an ordinary Database-connection user in Auth0.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
