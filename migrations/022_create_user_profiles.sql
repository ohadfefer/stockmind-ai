-- 022_create_user_profiles.sql
-- Stores answers from the onboarding wizard (experience, motivation,
-- interests, investing style, engagement cadence). One row per user.

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id              INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  experience_level     TEXT NOT NULL CHECK (experience_level IN ('beginner','novice','experienced','expert')),
  motivation           TEXT NOT NULL CHECK (motivation IN ('wealth_builder','income_seeker','growth_opportunist','conscious_investor','stability_maximizer')),
  interests            TEXT[] NOT NULL DEFAULT '{}',
  investor_style       TEXT NOT NULL CHECK (investor_style IN ('passive','hybrid','active')),
  engagement_cadence   TEXT NOT NULL CHECK (engagement_cadence IN ('daily','weekly','major_events')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
