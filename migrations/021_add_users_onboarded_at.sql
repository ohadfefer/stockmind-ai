-- 021_add_users_onboarded_at.sql
-- Tracks completion of the onboarding wizard so the proxy can route
-- partially-signed-up users back to /onboarding.

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
