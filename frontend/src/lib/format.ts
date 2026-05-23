const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function formatDate(iso: string) {
  const d = new Date(iso)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function formatMoney(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Format a nullable monetary amount as "$1,234.56", or an em-dash when absent.
 * Accepts numbers or numeric strings (Neon returns `numeric` columns as strings).
 */
export function formatMoneyOrDash(value: number | string | null | undefined) {
  return value == null ? "—" : `$${formatMoney(Number(value))}`
}

export function formatPrice(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}
