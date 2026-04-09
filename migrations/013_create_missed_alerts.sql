-- 013_create_missed_alerts.sql
-- Stores triggered alerts the user hasn't seen yet (dismissed on read).

CREATE TABLE IF NOT EXISTS missed_alerts (
  id              SERIAL PRIMARY KEY,
  account_id      INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol          TEXT NOT NULL,
  condition       alert_condition NOT NULL,
  target_value    NUMERIC(16, 6),
  triggered_price NUMERIC(16, 6) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_missed_alerts_account_id ON missed_alerts(account_id);
