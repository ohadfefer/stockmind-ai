-- 018_create_conversations.sql
-- Stock-chat threads + per-user AI usage ledger.
--
-- conversations / conversation_messages: append-only chat history.
-- ai_usage_ledger: single source of truth for per-user AI spend across
-- ALL features (portfolio reviews + conversation), so the same hard cap
-- ($0.002 free / $0.10 pro lifetime) is enforced consistently.

CREATE TABLE IF NOT EXISTS conversations (
  id          SERIAL PRIMARY KEY,
  account_id  INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New chat',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_account_latest
  ON conversations(account_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id                  SERIAL PRIMARY KEY,
  conversation_id     INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content             TEXT NOT NULL,
  model               TEXT,                  -- null on user rows
  prompt_tokens       INTEGER,
  completion_tokens   INTEGER,
  cached_input_tokens INTEGER,
  total_tokens        INTEGER,
  cost_usd            NUMERIC(12, 8),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread
  ON conversation_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS ai_usage_ledger (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature             TEXT NOT NULL CHECK (feature IN ('portfolio_review', 'conversation')),
  model               TEXT NOT NULL,
  prompt_tokens       INTEGER,
  completion_tokens   INTEGER,
  cached_input_tokens INTEGER,
  total_tokens        INTEGER,
  cost_usd            NUMERIC(12, 8) NOT NULL,
  source_table        TEXT,                  -- e.g. 'conversation_messages', 'portfolio_reviews'
  source_id           INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hot-path index: budget guard reads SUM(cost_usd) WHERE user_id = $1.
CREATE INDEX IF NOT EXISTS idx_ai_usage_ledger_user
  ON ai_usage_ledger(user_id, created_at DESC);

-- Idempotency guard: a single (source_table, source_id) row should never
-- produce more than one ledger entry, even if the writer retries.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ai_usage_source
  ON ai_usage_ledger(source_table, source_id)
  WHERE source_table IS NOT NULL AND source_id IS NOT NULL;
