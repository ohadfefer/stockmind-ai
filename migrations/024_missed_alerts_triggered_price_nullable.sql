-- 024_missed_alerts_triggered_price_nullable.sql
-- Earnings alerts don't have a "price at trigger" — allow NULL.

ALTER TABLE missed_alerts ALTER COLUMN triggered_price DROP NOT NULL;
