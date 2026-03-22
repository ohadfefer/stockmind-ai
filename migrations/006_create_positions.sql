-- 006_create_positions.sql
-- Positions: current holdings, materialized from executions.
-- Could be reconstructed from executions, but keeping it materialized makes reads fast.
-- Updated transactionally whenever an execution settles.

CREATE TABLE IF NOT EXISTS positions (
  id                  SERIAL PRIMARY KEY,
  account_id          INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol              TEXT NOT NULL,
  quantity            NUMERIC(16, 6) NOT NULL DEFAULT 0,
  average_cost_basis  NUMERIC(16, 6) NOT NULL DEFAULT 0,
  realized_pnl        NUMERIC(16, 2) NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, symbol)
);

CREATE INDEX idx_positions_account_id ON positions(account_id);
