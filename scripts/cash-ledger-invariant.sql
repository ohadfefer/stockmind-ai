-- Definition of correctness for cash_ledger.
--
-- The table is append-only and `amount` is the source of truth; `running_balance`
-- is a denormalization that must equal the previous row's balance plus this
-- row's amount, per account, in id order.
--
-- Zero rows returned = the invariant holds. Any row returned is a ledger whose
-- balance column disagrees with its own amounts.
--
-- Run before a backfill (expect rows), after a backfill (expect zero), and
-- after any concurrency test (expect zero).

SELECT * FROM (
  SELECT
    account_id,
    id,
    amount,
    running_balance,
    COALESCE(LAG(running_balance) OVER w, 0) AS prev_balance,
    running_balance - COALESCE(LAG(running_balance) OVER w, 0) AS implied_amount
  FROM cash_ledger
  WINDOW w AS (PARTITION BY account_id ORDER BY id)
) t
WHERE implied_amount IS DISTINCT FROM amount
ORDER BY account_id, id;
