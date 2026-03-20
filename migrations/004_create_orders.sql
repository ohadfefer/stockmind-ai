-- 004_create_orders.sql
-- Trade instructions. Tracks the intent to trade.
-- Doesn't move money — that happens in executions and cash_ledger.

CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  account_id         INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol             TEXT NOT NULL,
  side               TEXT NOT NULL
                       CHECK (side IN ('buy', 'sell')),
  order_type         TEXT NOT NULL
                       CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  quantity           NUMERIC(16, 6) NOT NULL,
  limit_price        NUMERIC(16, 2),
  stop_price         NUMERIC(16, 2),
  time_in_force      TEXT NOT NULL DEFAULT 'day'
                       CHECK (time_in_force IN ('day', 'gtc', 'ioc')),
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN (
                         'pending', 'filled', 'partially_filled',
                         'cancelled', 'rejected'
                       )),
  filled_quantity    NUMERIC(16, 6) NOT NULL DEFAULT 0,
  average_fill_price NUMERIC(16, 2),
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  filled_at          TIMESTAMPTZ,
  cancelled_at       TIMESTAMPTZ
);

CREATE INDEX idx_orders_account_id ON orders(account_id);
CREATE INDEX idx_orders_account_status ON orders(account_id, status);
CREATE INDEX idx_orders_symbol ON orders(symbol);
