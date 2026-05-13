export async function deleteConversation(conversationId: number): Promise<void> {
  const res = await fetch("/api/conversation", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  })
  if (!res.ok) throw new Error("Failed to delete conversation")
}

export async function renameConversation(
  conversationId: number,
  title: string,
): Promise<void> {
  const res = await fetch("/api/conversation", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, title }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Failed to rename conversation")
  }
}

export async function setConversationPinned(
  conversationId: number,
  pinned: boolean,
): Promise<void> {
  const res = await fetch("/api/conversation", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, pinned }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Failed to update pin")
  }
}
