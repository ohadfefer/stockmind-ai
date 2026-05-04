"use client"

import { useEffect, useState } from "react"
import {
  hasPushSubscription,
  subscribePush,
  unsubscribePush,
} from "@/actions/push-subscription"

type NotificationStatus = "loading" | "unsupported" | "denied" | "prompt" | "subscribed"

export function useNotifications() {
  const [status, setStatus] = useState<NotificationStatus>("loading")

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported")
      return
    }

    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }

    if (Notification.permission === "default") {
      setStatus("prompt")
      return
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setStatus("prompt")
        return
      }

      const registered = await hasPushSubscription(sub.endpoint)
      if (registered === false) {
        try {
          await sub.unsubscribe()
        } catch {
          // best-effort cleanup
        }
        setStatus("prompt")
        return
      }

      // "unknown" (transient fetch/auth failure) preserves the local sub and shows subscribed;
      // re-verifies on next mount rather than destroying a possibly-valid subscription.
      setStatus("subscribed")
    })
  }, [])

  async function subscribe() {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setStatus("denied")
        return
      }

      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      await subscribePush(subscription)
      setStatus("subscribed")
    } catch {
      setStatus("denied")
    }
  }

  async function unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await unsubscribePush(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setStatus("prompt")
    } catch {
      // already unsubscribed
    }
  }

  return { status, subscribe, unsubscribe }
}
