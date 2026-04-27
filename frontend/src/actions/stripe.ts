export async function startSubscriptionCheckout(): Promise<{ url: string }> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `Checkout request failed (${res.status})`)
  }
  return res.json()
}

export async function startCustomerPortal(): Promise<{ url: string }> {
  const res = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `Portal request failed (${res.status})`)
  }
  return res.json()
}

export async function cancelSubscriptionAtPeriodEnd(): Promise<void> {
  const res = await fetch("/api/stripe/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `Cancel request failed (${res.status})`)
  }
}
