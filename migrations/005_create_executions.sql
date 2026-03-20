-- 005_create_executions.sql
-- Executions (fills): what actually traded at what price.
-- One order can have multiple executions (partial fills).
-- This is the audit trail for all trades.

CREATE TABLE IF NOT EXISTS executions (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  account_id   INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  side         TEXT NOT NULL
                 CHECK (side IN ('buy', 'sell')),
  quantity     NUMERIC(16, 6) NOT NULL,
  price        NUMERIC(16, 2) NOT NULL,
  commission   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fees         NUMERIC(10, 2) NOT NULL DEFAULT 0,
  executed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_order_id ON executions(order_id);
CREATE INDEX idx_executions_account_id ON executions(account_id);
CREATE INDEX idx_executions_symbol ON executions(symbol);
