export interface SubmitTransferParams {
  direction: "deposit" | "withdrawal"
  amount: number
  method: "bank_transfer" | "wire" | "internal"
  description?: string
}

export async function submitTransfer(params: SubmitTransferParams): Promise<{ transferId: number }> {
  const res = await fetch("/api/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error("Failed to submit transfer")
  return res.json()
}
