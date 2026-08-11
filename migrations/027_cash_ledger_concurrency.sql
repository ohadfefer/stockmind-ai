-- 027_cash_ledger_concurrency.sql
-- Makes concurrent appends to cash_ledger safe.
--
-- 1. (account_id, id DESC) serves the tail read that derives running_balance.
--    This is not only about speed. SSI predicate (SIREAD) lock granularity
--    follows the access path: a tight index scan keeps the lock scoped to one
--    account's tail, while a sequential scan escalates toward page or relation
--    level — at which point appends on unrelated accounts start aborting each
--    other with 40001.
--
-- 2. The partial unique index makes a retried append idempotent: at most one
--    ledger row per (account, entry type, source event). Serializable stops
--    concurrent writers from corrupting the balance; it does nothing about a
--    client that retries after a committed write whose response was lost.
--    entry_type belongs in the key because reference_id points at a different
--    table per type — executions for trade_settlement, transfers for
--    deposit/withdrawal — and those id spaces overlap.
--    The WHERE clause leaves rows with no reference (fees, adjustments)
--    unconstrained.

CREATE INDEX IF NOT EXISTS idx_cash_ledger_account_id_desc
  ON cash_ledger (account_id, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_ledger_ref
  ON cash_ledger (account_id, entry_type, reference_id)
  WHERE reference_id IS NOT NULL;
