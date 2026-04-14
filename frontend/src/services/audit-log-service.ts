import { getDb } from "@/lib/db"

export type AuditAction =
  | "login"
  | "auto_login"
  | "logout"
  | "signup"
  | "order_placed"
  | "order_cancelled"
  | "order_executed"
  | "deposit_initiated"
  | "deposit_completed"
  | "withdrawal_initiated"
  | "withdrawal_completed"
  | "settings_changed"

export interface LogAuditParams {
  userId: number
  accountId?: number | null
  action: AuditAction
  details?: Record<string, unknown> | null
  ipAddress?: string | null
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  const sql = getDb()
  try {
    await sql`
      INSERT INTO audit_log (user_id, account_id, action, details, ip_address)
      VALUES (
        ${params.userId},
        ${params.accountId ?? null},
        ${params.action},
        ${params.details ? JSON.stringify(params.details) : null},
        ${params.ipAddress ?? null}
      )
    `
  } catch (error) {
    console.error("Failed to write audit_log:", error)
  }
}
