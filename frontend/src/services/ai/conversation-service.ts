import { getDb } from "@/lib/db"
import type { ModelMessage } from "ai"
import { recordAiUsage } from "@/services/ai/budget-service"
import type { NormalizedUsage } from "@/services/ai/xai-cost"

export interface ConversationRow {
  id: number
  accountId: number
  createdAt: Date
  updatedAt: Date
}

export type ConversationRole = "user" | "assistant"

export interface ConversationMessage {
  id: number
  role: ConversationRole
  content: string
  createdAt: Date
}

export async function getLatestActiveConversation(
  accountId: number,
): Promise<ConversationRow | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, account_id, created_at, updated_at
    FROM conversations
    WHERE account_id = ${accountId}
    ORDER BY updated_at DESC
    LIMIT 1
  `
  const r = rows[0]
  if (!r) return null
  return {
    id: r.id,
    accountId: r.account_id,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  }
}

export async function conversationHasMessages(
  conversationId: number,
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    SELECT 1 AS one FROM conversation_messages
    WHERE conversation_id = ${conversationId}
    LIMIT 1
  `
  return rows.length > 0
}

export async function createConversation(
  accountId: number,
): Promise<{ id: number }> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO conversations (account_id)
    VALUES (${accountId})
    RETURNING id
  `
  return { id: rows[0].id as number }
}

export async function getOrCreateActiveConversation(
  accountId: number,
): Promise<{ id: number }> {
  const existing = await getLatestActiveConversation(accountId)
  if (existing) return { id: existing.id }
  return createConversation(accountId)
}

// Returns the most recent `limit` messages in chronological order.
// Bounded so a long-running thread doesn't ship the entire history into
// the RSC payload on every page load.
export async function getMessages(
  conversationId: number,
  limit = 100,
): Promise<ConversationMessage[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, role, content, created_at
    FROM (
      SELECT id, role, content, created_at
      FROM conversation_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit}
    ) t
    ORDER BY t.created_at ASC, t.id ASC
  `
  return rows.map((r) => ({
    id: r.id as number,
    role: r.role as ConversationRole,
    content: r.content as string,
    createdAt: new Date(r.created_at),
  }))
}

// Loads the recent message tail in the shape the AI SDK expects.
// `limit` bounds how many turns we re-send → bounds prompt cost.
export async function loadModelMessages(
  conversationId: number,
  limit = 10,
): Promise<ModelMessage[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT role, content
    FROM (
      SELECT role, content, created_at, id
      FROM conversation_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit}
    ) t
    ORDER BY t.created_at ASC, t.id ASC
  `
  return rows.map((r) => ({
    role: r.role as ConversationRole,
    content: r.content as string,
  }))
}

export async function appendUserMessage(
  conversationId: number,
  content: string,
): Promise<{ id: number }> {
  const sql = getDb()
  const rows = await sql`
    WITH inserted AS (
      INSERT INTO conversation_messages (conversation_id, role, content)
      VALUES (${conversationId}, 'user', ${content})
      RETURNING id
    ), bumped AS (
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = ${conversationId}
    )
    SELECT id FROM inserted
  `
  return { id: rows[0].id as number }
}

export interface PersistAssistantMessageParams {
  userId: number
  conversationId: number
  content: string
  model: string
  usage: NormalizedUsage | null
}

// Writes the assistant turn, bumps the conversation's updated_at, and
// records the ledger row. The ledger insert can run after the message
// insert; if it fails the message survives and we log the discrepancy.
export async function persistAssistantMessage(
  params: PersistAssistantMessageParams,
): Promise<{ messageId: number }> {
  const sql = getDb()
  const u = params.usage
  const rows = await sql`
    WITH inserted AS (
      INSERT INTO conversation_messages (
        conversation_id, role, content, model,
        prompt_tokens, completion_tokens, cached_input_tokens, total_tokens, cost_usd
      )
      VALUES (
        ${params.conversationId}, 'assistant', ${params.content}, ${params.model},
        ${u?.promptTokens ?? null}, ${u?.completionTokens ?? null},
        ${u?.cachedInputTokens ?? null}, ${u?.totalTokens ?? null}, ${u?.costUsd ?? null}
      )
      RETURNING id
    ), bumped AS (
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = ${params.conversationId}
    )
    SELECT id FROM inserted
  `
  const messageId = rows[0].id as number

  if (u) {
    try {
      await recordAiUsage({
        userId: params.userId,
        feature: "conversation",
        model: params.model,
        promptTokens: u.promptTokens,
        completionTokens: u.completionTokens,
        cachedInputTokens: u.cachedInputTokens,
        totalTokens: u.totalTokens,
        costUsd: u.costUsd,
        sourceTable: "conversation_messages",
        sourceId: messageId,
      })
    } catch (err) {
      console.error("ai_usage_ledger insert failed:", err)
    }
  }

  return { messageId }
}
