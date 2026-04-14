export function getClientIp(request: Request): string | null {
  const headers = request.headers
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || null
}
