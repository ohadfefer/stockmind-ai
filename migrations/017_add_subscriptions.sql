-- 017_add_subscriptions.sql
-- User-scoped subscriptions: an upgraded user gets the plan applied to all
-- of their accounts. `users.subscription_plan` is a denormalized cache of
-- the current tier (cheap to read on the hot path); the `subscriptions`
-- table is the audit trail of billing state synced from Stripe webhooks.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_plan  TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- One Stripe Customer per user. Partial index so rows without a customer
-- yet (i.e. never checked out) don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       SERIAL PRIMARY KEY,
  user_id                  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe identifiers (Stripe is source of truth; mirrored here for queries)
  stripe_customer_id       TEXT NOT NULL,
  stripe_subscription_id   TEXT,                 -- null for one_off purchases
  stripe_price_id          TEXT NOT NULL,
  stripe_product_id        TEXT,

  -- Plan shape
  plan                     TEXT NOT NULL,        -- e.g. 'pro'
  type                     TEXT NOT NULL
                             CHECK (type IN ('one_off', 'recurring')),
  pricing_model            TEXT NOT NULL
                             CHECK (pricing_model IN ('flat_rate', 'per_unit', 'tiered', 'usage_based')),
  billing_interval         TEXT
                             CHECK (billing_interval IN ('day', 'week', 'month', 'year')),
  unit_amount              INTEGER,              -- cents; nullable for usage_based
  currency                 TEXT NOT NULL DEFAULT 'USD',

  -- Lifecycle (mirrors Stripe subscription.status)
  status                   TEXT NOT NULL
                             CHECK (status IN (
                               'active', 'trialing', 'past_due',
                               'canceled', 'incomplete', 'incomplete_expired',
                               'unpaid', 'paused'
                             )),
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at              TIMESTAMPTZ,
  trial_end                TIMESTAMPTZ,

  -- Provenance
  checkout_session_id      TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
  ON subscriptions(stripe_customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id
  ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- At most one "live" subscription per user. Drop this if you ever want
-- users to stack plans concurrently.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active
  ON subscriptions(user_id)
  WHERE status IN ('active', 'trialing', 'past_due');
