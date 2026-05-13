-- 025_add_conversations_pinned_at.sql
-- Adds a "pin to top" affordance to the conversation history.
--
-- pinned_at is the time the user pinned the row (NULL = unpinned). Using a
-- timestamp rather than a boolean lets the history list order by
--   (pinned_at DESC NULLS LAST, updated_at DESC)
-- so a freshly-pinned row floats to the very top of the pinned section,
-- and unpinning is a single UPDATE ... SET pinned_at = NULL.

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ NULL;

-- Backing index for the history-list sort. The previous
-- idx_conversations_account_latest is kept since other call sites still
-- look up "most recent by account" without caring about pin status.
CREATE INDEX IF NOT EXISTS idx_conversations_account_pin_latest
  ON conversations(account_id, pinned_at DESC NULLS LAST, updated_at DESC);
