-- 002_create_accounts.sql
-- Brokerage accounts: one user can have multiple (e.g. "growth", "dividends")

CREATE TABLE IF NOT EXISTS accounts (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number  TEXT NOT NULL UNIQUE,        -- human-readable, e.g. "SIM-00042"
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'closed')),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
