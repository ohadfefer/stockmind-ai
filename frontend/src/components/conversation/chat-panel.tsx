"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarkdownMessage } from "@/components/ai/markdown-message"
import { cn } from "@/lib/utils"
import type { ConversationMessage } from "@/services/ai/conversation-service"

interface ChatPanelProps {
  conversationId: number | null
  initialMessages: ConversationMessage[]
}

type DisplayMessage = {
  role: "user" | "assistant"
  content: string
  // local-only id; used as React key while streaming
  key: string
}

interface BudgetError {
  kind: "budget"
  spent: number
  budget: number
}
interface GenericError {
  kind: "generic"
  message: string
}
type ChatError = BudgetError | GenericError

const SEED_PROMPTS = [
  "What is the biggest concentration risk in my portfolio?",
  "Explain how P/E ratio works for a beginner.",
  "Compare AAPL and MSFT as long-term holdings.",
]

export function ChatPanel({ conversationId, initialMessages }: ChatPanelProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    initialMessages.map((m) => ({
      role: m.role,
      content: m.content,
      key: `seed-${m.id}`,
    })),
  )
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<ChatError | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  // Mirror the prop in local state so reset() can flip the active id
  // synchronously, before the RSC navigation finishes propagating new props.
  // Without this, a fast send right after "New chat" lands in the old thread.
  const [activeConversationId, setActiveConversationId] = useState<number | null>(
    conversationId,
  )
  // Track prop changes from RSC navigation (e.g. clicking a different
  // conversation in /conversation/history) so the input id stays in sync.
  useEffect(() => {
    setActiveConversationId(conversationId)
  }, [conversationId])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  // Auto-scroll only when the user is already pinned to (or near) the bottom.
  // If they've scrolled up to read history mid-stream, don't yank them down.
  const pinnedToBottomRef = useRef(true)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    pinnedToBottomRef.current = distance < 80
  }

  useEffect(() => {
    if (!pinnedToBottomRef.current) return
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isStreaming])

  async function send(content: string) {
    if (!content.trim() || isStreaming || isResetting) return
    setError(null)
    setInput("")
    const userKey = `u-${Date.now()}`
    const assistantKey = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { role: "user", content, key: userKey },
      { role: "assistant", content: "", key: assistantKey },
    ])
    // The user just sent something; force-scroll on the next paint
    // even if they had scrolled up to read older messages.
    pinnedToBottomRef.current = true
    setIsStreaming(true)

    try {
      const res = await fetch("/api/conversation/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          activeConversationId != null
            ? { content, conversationId: activeConversationId }
            : { content },
        ),
      })

      if (res.status === 402) {
        const data = (await res.json()) as { spent: number; budget: number }
        setError({ kind: "budget", spent: data.spent, budget: data.budget })
        // Drop the optimistically-added pair by key, so we don't accidentally
        // remove later messages if state has changed underneath us.
        setMessages((prev) =>
          prev.filter((m) => m.key !== userKey && m.key !== assistantKey),
        )
        return
      }
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "")
        setError({
          kind: "generic",
          message: text || "Something went wrong. Please try again.",
        })
        setMessages((prev) =>
          prev.filter((m) => m.key !== userKey && m.key !== assistantKey),
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last && last.key === assistantKey) {
            next[next.length - 1] = { ...last, content: acc }
          }
          return next
        })
      }
    } catch (err) {
      console.error(err)
      setError({
        kind: "generic",
        message: "Network error. Please try again.",
      })
      setMessages((prev) =>
        prev.filter((m) => m.key !== userKey && m.key !== assistantKey),
      )
    } finally {
      setIsStreaming(false)
    }
  }

  async function reset() {
    if (isResetting || isStreaming) return
    setIsResetting(true)
    try {
      const res = await fetch("/api/conversation", { method: "POST" })
      if (!res.ok) throw new Error("reset failed")
      const data = (await res.json().catch(() => ({}))) as {
        conversationId?: number
      }
      setMessages([])
      setError(null)
      // Flip the active id locally before navigating so a send fired between
      // here and the RSC commit still hits the new thread.
      if (typeof data.conversationId === "number") {
        setActiveConversationId(data.conversationId)
        router.replace(`/conversation?id=${data.conversationId}`)
      }
    } catch (err) {
      console.error(err)
      setError({ kind: "generic", message: "Could not start a new chat." })
    } finally {
      setIsResetting(false)
    }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">AI Advisor</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          disabled={isResetting || isStreaming || messages.length === 0}
        >
          <RefreshCw className={cn("size-4", isResetting && "animate-spin")} />
          New chat
        </Button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4"
      >
        {messages.length === 0 ? (
          <EmptyState
            onPick={(p) => void send(p)}
            disabled={isStreaming || isResetting}
          />
        ) : (
          <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6">
            {messages.map((m) => (
              <MessageBubble key={m.key} message={m} />
            ))}
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-2 animate-pulse rounded-full bg-primary" />
                Thinking…
              </div>
            )}
          </div>
        )}
      </div>

      {error?.kind === "budget" && <BudgetCard error={error} />}
      {error?.kind === "generic" && (
        <div className="mx-auto mb-3 w-full max-w-[880px] rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-[880px] items-end gap-2 pt-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          placeholder="Ask about stocks, ETFs, your portfolio…"
          rows={2}
          disabled={isStreaming || isResetting || error?.kind === "budget"}
          className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-60"
        />
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user"
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-primary/10 px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap text-foreground">
          {message.content}
        </div>
      </div>
    )
  }
  return (
    <MarkdownMessage
      content={message.content || " "}
      className="text-base"
    />
  )
}

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void
  disabled: boolean
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 pt-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
        <Sparkles className="size-6 text-primary" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          Chat about stocks
        </h2>
        <p className="text-sm text-muted-foreground">
          Ask about a ticker, your holdings, or an investing concept. The
          assistant only answers stock-related questions.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {SEED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            disabled={disabled}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function BudgetCard({ error }: { error: BudgetError }) {
  return (
    <div className="mx-auto mb-3 flex w-full max-w-3xl flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          You&apos;ve reached your AI usage limit
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Spent ${error.spent.toFixed(5)} of ${error.budget.toFixed(3)}. Upgrade
        to Pro for a much larger allowance.
      </p>
      <Button asChild size="sm" className="mt-1 self-start">
        <Link href="/settings/payments">Upgrade to Pro</Link>
      </Button>
    </div>
  )
}
