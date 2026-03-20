-- 003_create_cash_ledger.sql
-- Cash ledger: every cash movement, append-only.
-- Never update or delete rows — only append.
-- running_balance gives instant balance lookups without summing the whole ledger.

CREATE TABLE IF NOT EXISTS cash_ledger (
  id               SERIAL PRIMARY KEY,
  account_id       INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  entry_type       TEXT NOT NULL
                     CHECK (entry_type IN (
                       'deposit', 'withdrawal', 'trade_settlement',
                       'dividend', 'fee', 'interest', 'adjustment'
                     )),
  amount           NUMERIC(16, 2) NOT NULL,          -- positive = credit, negative = debit
  running_balance  NUMERIC(16, 2) NOT NULL,          -- balance after this entry
  reference_id     INTEGER,                           -- nullable FK to the order/dividend that triggered it
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cash_ledger_account_id ON cash_ledger(account_id);
CREATE INDEX idx_cash_ledger_account_created ON cash_ledger(account_id, created_at DESC);
