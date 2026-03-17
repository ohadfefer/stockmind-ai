-- 001_create_users.sql
-- Baseline: already exists in production

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  auth0_id      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
