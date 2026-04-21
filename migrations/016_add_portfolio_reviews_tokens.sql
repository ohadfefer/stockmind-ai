-- 016_add_portfolio_reviews_tokens.sql
-- Track xAI token usage and USD cost per generated portfolio review
-- so we can monitor per-account LLM spend.

ALTER TABLE portfolio_reviews
  ADD COLUMN IF NOT EXISTS prompt_tokens     INTEGER,
  ADD COLUMN IF NOT EXISTS completion_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS total_tokens      INTEGER,
  ADD COLUMN IF NOT EXISTS cost_usd          NUMERIC(12, 8);
