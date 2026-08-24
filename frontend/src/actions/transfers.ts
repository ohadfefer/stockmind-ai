import { ApiError, apiFetch, json } from "@/actions/http"
import type { Transfer } from "@/services/transfer-service"

export interface SubmitTransferParams {
  direction: "deposit" | "withdrawal"
  amount: number
  method: "bank_transfer" | "wire" | "internal"
  description?: string
}

export interface TransferCooldown {
  lastInitiatedAt: string | null
  nextAllowedAt: string | null
  remainingMs: number
}

/**
 * The 429 carries nextAllowedAt and remainingMs as problem+json extension
 * members, which reach the caller as untyped values on ApiError.extra. This
 * class does that cast once, here, so the component gets a typed field instead
 * of asserting on a Record<string, unknown> at the point of use.
 */
export class TransferCooldownError extends Error {
  nextAllowedAt: string | null
  remainingMs: number
  constructor(nextAllowedAt: string | null, remainingMs: number) {
    super("Transfer cooldown active")
    this.name = "TransferCooldownError"
    this.nextAllowedAt = nextAllowedAt
    this.remainingMs = remainingMs
  }
}

/**
 * Resolves as soon as the transfer is accepted (202), not when it settles —
 * the returned id is what fetchTransfer polls until the status leaves
 * "pending".
 */
export async function submitTransfer(
  params: SubmitTransferParams,
): Promise<{ id: number; status: string }> {
  try {
    return await apiFetch<{ id: number; status: string }>("/api/transfers", {
      method: "POST",
      ...json(params),
    })
  } catch (err) {
    if (err instanceof ApiError && err.code === "transfer_cooldown_active") {
      const { nextAllowedAt, remainingMs } = err.extra
      throw new TransferCooldownError(
        typeof nextAllowedAt === "string" ? nextAllowedAt : null,
        Number(remainingMs ?? 0),
      )
    }
    throw err
  }
}

/**
 * Polled in a loop while a transfer settles, so it must not navigate on an
 * expired session: the caller is a timer, and bouncing to login mid-transfer
 * would drop the "processing" dialog out from under the user. The ApiError
 * still throws and the poll swallows it until its deadline.
 */
export function fetchTransfer(transferId: number): Promise<Transfer> {
  return apiFetch<Transfer>(`/api/transfers/${transferId}`, {
    cache: "no-store",
    redirectOnAuthFailure: false,
  })
}

export function fetchTransferCooldown(): Promise<TransferCooldown> {
  return apiFetch<TransferCooldown>("/api/transfers/cooldown", {
    cache: "no-store",
    redirectOnAuthFailure: false,
  })
}
