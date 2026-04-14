-- 014_create_audit_log.sql
-- System-wide activity trail. Append-only — never update or delete rows.

CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id  INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  action      TEXT NOT NULL
                CHECK (action IN (
                  'login', 'auto_login', 'logout', 'signup',
                  'order_placed', 'order_cancelled', 'order_executed',
                  'deposit_initiated', 'deposit_completed',
                  'withdrawal_initiated', 'withdrawal_completed',
                  'settings_changed'
                )),
  details     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id    ON audit_log(user_id);
CREATE INDEX idx_audit_log_account_id ON audit_log(account_id);
CREATE INDEX idx_audit_log_action     ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
