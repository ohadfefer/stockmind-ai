-- 019_create_portfolio_daily_value.sql
-- Daily portfolio rollup: one row per account per day.
-- Denormalized from position_history (holdings) + cash_ledger (cash) for fast
-- chart, heatmap and KPI reads. Written by the end-of-day snapshot job in
-- the same transaction as position_history rows.
--
-- total_value = holdings market value + cash. Use net_cash_flow to back out
-- deposits/withdrawals when computing return %.

CREATE TABLE IF NOT EXISTS portfolio_daily_value (
  account_id    INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  market_value  NUMERIC(16, 2) NOT NULL,
  cost_basis    NUMERIC(16, 2) NOT NULL,
  cash_balance  NUMERIC(16, 2) NOT NULL,
  net_cash_flow NUMERIC(16, 2) NOT NULL DEFAULT 0,
  total_value   NUMERIC(16, 2) GENERATED ALWAYS AS (market_value + cash_balance) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, date)
);
