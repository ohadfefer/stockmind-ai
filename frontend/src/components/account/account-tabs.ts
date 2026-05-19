// Shared, framework-agnostic source of truth for the account tab set so the
// server loader, the page, the tab bar, and the content switch all agree on
// the same keys without an unchecked `as AccountTab` cast.
export const ACCOUNT_TAB_KEYS = [
  "balances",
  "history",
  "performance",
  "transfer",
] as const

export type AccountTab = (typeof ACCOUNT_TAB_KEYS)[number]

export function parseAccountTab(raw: string | null | undefined): AccountTab {
  return (ACCOUNT_TAB_KEYS as readonly string[]).includes(raw ?? "")
    ? (raw as AccountTab)
    : "balances"
}
