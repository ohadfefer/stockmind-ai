import { apiFetch, apiSend } from "@/actions/http"

export async function startSubscriptionCheckout(): Promise<{ url: string }> {
  return apiFetch<{ url: string }>("/api/stripe/checkout", { method: "POST" })
}

/** 204 on success, including when the cancellation was already scheduled. */
export async function cancelSubscriptionAtPeriodEnd(): Promise<void> {
  await apiSend("/api/stripe/cancel", { method: "POST" })
}
