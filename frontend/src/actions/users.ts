export async function insertUser(fullName: string): Promise<void> {
  const res = await fetch("/api/auth/insert-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName }),
  })
  if (!res.ok) throw new Error("Failed to save user")
}
