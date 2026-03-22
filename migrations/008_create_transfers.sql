-- 008_create_transfers.sql
-- Transfers: deposits and withdrawals.
-- On completion, a corresponding row is added to cash_ledger.

CREATE TABLE IF NOT EXISTS transfers (
  id              SERIAL PRIMARY KEY,
  account_id      INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  direction       TEXT NOT NULL CHECK (direction IN ('deposit', 'withdrawal')),
  amount          NUMERIC(16, 2) NOT NULL CHECK (amount > 0),
  method          TEXT NOT NULL DEFAULT 'bank_transfer'
                    CHECK (method IN ('bank_transfer', 'wire', 'internal')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  description     TEXT,
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_transfers_account_id ON transfers(account_id);
CREATE INDEX idx_transfers_status ON transfers(status);
