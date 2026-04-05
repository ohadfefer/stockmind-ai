-- 011_create_stock_alerts.sql
-- Stock alerts: notification triggers for price thresholds, earnings, and AI signals.

CREATE TYPE alert_condition AS ENUM ('price_above', 'price_below', 'earnings', 'ai_signal');
CREATE TYPE alert_status    AS ENUM ('active', 'triggered', 'cancelled');

CREATE TABLE IF NOT EXISTS stock_alerts (
  id            SERIAL PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL,
  condition     alert_condition NOT NULL,
  target_value  NUMERIC(16, 6),               -- null for non-price conditions (earnings, ai_signal)
  status        alert_status NOT NULL DEFAULT 'active',
  triggered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_alerts_account_id ON stock_alerts(account_id);
CREATE INDEX idx_stock_alerts_status     ON stock_alerts(status);
