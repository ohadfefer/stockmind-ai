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

export async function submitTransfer(params: SubmitTransferParams): Promise<{ transferId: number }> {
  const res = await fetch("/api/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}))
    throw new TransferCooldownError(body.nextAllowedAt ?? null, Number(body.remainingMs ?? 0))
  }
  if (!res.ok) throw new Error("Failed to submit transfer")
  return res.json()
}

export async function fetchTransferCooldown(): Promise<TransferCooldown> {
  const res = await fetch("/api/transfers/cooldown", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch transfer cooldown")
  return res.json()
}
