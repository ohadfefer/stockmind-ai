-- 028_trade_input_constraints.sql
-- Quantity sign constraints on the trade tables.
--
-- The routes now validate quantity, but validation lives in code that a future
-- route, script or backfill can forget to call. A CHECK is a property of the
-- data, so it holds regardless of who is writing — the same reasoning behind
-- uq_cash_ledger_ref in migration 027.
--
-- Why it matters: recordTradeSettlement derives the cash amount as
-- -(quantity * price + costs) for a buy. A negative quantity flips that sign
-- and credits the account instead of debiting it, so an unguarded quantity is
-- an arbitrary balance-inflation primitive.
--
-- positions.quantity is >= 0 rather than > 0: a fully closed position keeps its
-- row at zero so realized_pnl and the cost basis survive for reporting.
--
-- DROP ... IF EXISTS first because Postgres has no ADD CONSTRAINT IF NOT EXISTS.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_quantity_positive;
ALTER TABLE orders ADD  CONSTRAINT orders_quantity_positive
  CHECK (quantity > 0);

ALTER TABLE executions DROP CONSTRAINT IF EXISTS executions_quantity_positive;
ALTER TABLE executions ADD  CONSTRAINT executions_quantity_positive
  CHECK (quantity > 0);

ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_quantity_non_negative;
ALTER TABLE positions ADD  CONSTRAINT positions_quantity_non_negative
  CHECK (quantity >= 0);
