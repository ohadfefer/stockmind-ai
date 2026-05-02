import { getDb } from "@/lib/db"
import type { ModelMessage } from "ai"
import { recordAiUsage } from "@/services/ai/budget-service"
import type { NormalizedUsage } from "@/services/ai/xai-cost"

export interface ConversationListItem {
  id: number
  title: string
  updatedAt: Date
  preview: string | null
  messageCount: number
}

export type ConversationRole = "user" | "assistant"

export interface ConversationMessage {
  id: number
  role: ConversationRole
  content: string
  createdAt: Date
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

export async function getConversationOwner(
  conversationId: number,
): Promise<{ accountId: number } | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT account_id FROM conversations WHERE id = ${conversationId} LIMIT 1
  `
  const r = rows[0]
  if (!r) return null
  return { accountId: r.account_id as number }
}

// History list: most-recent-first, with a snippet from the first user message
// so rows still look meaningful when the title is still the default.
export async function listConversationsForAccount(
  accountId: number,
  limit = 50,
): Promise<ConversationListItem[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT
      c.id,
      c.title,
      c.updated_at,
      (
        SELECT m.content
        FROM conversation_messages m
        WHERE m.conversation_id = c.id AND m.role = 'user'
        ORDER BY m.created_at ASC, m.id ASC
        LIMIT 1
      ) AS preview,
      (
        SELECT COUNT(*)
        FROM conversation_messages m
        WHERE m.conversation_id = c.id
      ) AS message_count
    FROM conversations c
    WHERE c.account_id = ${accountId}
      AND EXISTS (
        SELECT 1 FROM conversation_messages m WHERE m.conversation_id = c.id
      )
    ORDER BY c.updated_at DESC
    LIMIT ${limit}
  `
  return rows.map((r) => ({
    id: r.id as number,
    title: r.title as string,
    updatedAt: new Date(r.updated_at),
    preview: (r.preview as string | null) ?? null,
    messageCount: Number(r.message_count ?? 0),
  }))
}

export async function setConversationTitle(
  conversationId: number,
  title: string,
): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE conversations
    SET title = ${title}
    WHERE id = ${conversationId}
  `
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
