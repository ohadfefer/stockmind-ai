-- 010_create_watchlists.sql
-- Replaces old "watchlist" table. Now scoped to accounts with named lists.

CREATE TABLE IF NOT EXISTS watchlists (
  id          SERIAL PRIMARY KEY,
  account_id  INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,                -- e.g. "Tech Picks", "Earnings Watch"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watchlists_account_id ON watchlists(account_id);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id            SERIAL PRIMARY KEY,
  watchlist_id  INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT,
  UNIQUE (watchlist_id, symbol)
);

CREATE INDEX idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);
