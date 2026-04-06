export async function subscribePush(subscription: PushSubscription) {
  const key = subscription.getKey("p256dh")
  const auth = subscription.getKey("auth")
  if (!key || !auth) throw new Error("Missing subscription keys")

  const res = await fetch("/api/push-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    }),
  })
  if (!res.ok) throw new Error("Failed to save push subscription")
}

export async function unsubscribePush(endpoint: string) {
  const res = await fetch("/api/push-subscription", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  })
  if (!res.ok) throw new Error("Failed to delete push subscription")
}
