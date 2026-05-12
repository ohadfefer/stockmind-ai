-- 023_add_stock_alerts_earnings_date.sql
-- Adds earnings_date to stock_alerts and a partial index for the daily earnings checker.

ALTER TABLE stock_alerts ADD COLUMN IF NOT EXISTS earnings_date DATE;

CREATE INDEX IF NOT EXISTS idx_stock_alerts_earnings_due
  ON stock_alerts(earnings_date)
  WHERE condition = 'earnings' AND status = 'active';
