-- 020_add_transfers_account_initiated_idx.sql
-- Supports the 72h transfer cooldown lookup: most recent non-failed transfer
-- per account, ordered by initiated_at DESC.

CREATE INDEX IF NOT EXISTS idx_transfers_account_initiated
  ON transfers(account_id, initiated_at DESC);
