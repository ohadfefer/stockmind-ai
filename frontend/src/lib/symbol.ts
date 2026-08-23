/**
 * One ticker validator for every route that accepts a symbol.
 *
 * Must start with a letter and run at most ten characters: that covers US
 * listings including class suffixes (BRK.B), and a leading digit or dot is far
 * more likely to be a traversal probe than a real ticker. Foreign numeric
 * symbols (7203.T) are out — they always have been on the watchlist and order
 * paths, and alerts now agree with them.
 *
 * `services/conversation/conversation-page-data.ts` keeps its own identical
 * copy on purpose: there the pattern gates a prompt auto-send, so it is an
 * injection guard rather than input validation and the two must stay free to
 * diverge.
 */
export const SYMBOL_RE = /^[A-Z][A-Z0-9.-]{0,9}$/

/** Narrows unknown request input to something safely uppercased into a ticker. */
export function isValidSymbol(value: unknown): value is string {
  return typeof value === "string" && SYMBOL_RE.test(value.toUpperCase())
}
