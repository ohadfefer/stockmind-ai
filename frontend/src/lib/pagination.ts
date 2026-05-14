export const NEWS_PAGE_SIZE = 5

export function parsePage(input: string | undefined): number {
  const n = Number.parseInt(input ?? "1", 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

export function paginate<T>(items: T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  const safePage = Math.min(page, totalPages)
  return {
    page: safePage,
    totalPages,
    items: items.slice((safePage - 1) * size, safePage * size),
  }
}

export function buildPageHref(
  base: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v)
  }
  sp.set("page", String(page))
  return `${base}?${sp.toString()}`
}
