-- 015_create_portfolio_reviews.sql
-- Cached AI-generated portfolio reviews. One row per generation;
-- regenerate only when the portfolio changes or the cached row goes stale.

CREATE TABLE IF NOT EXISTS portfolio_reviews (
  id              SERIAL PRIMARY KEY,
  account_id      INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  portfolio_hash  TEXT NOT NULL,        -- sha256 of holdings + cash balance
  short_review    TEXT NOT NULL,        -- concise insight for portfolio tab card
  full_review     TEXT NOT NULL,        -- detailed analysis for analyze page
  model           TEXT NOT NULL,        -- model id used to generate the review
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolio_reviews_account_latest
  ON portfolio_reviews(account_id, created_at DESC);
CREATE INDEX idx_portfolio_reviews_hash
  ON portfolio_reviews(account_id, portfolio_hash);
