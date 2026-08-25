/**
 * Size-bounded replacement for `request.json()`.
 *
 * `request.json()` buffers and parses the whole body before any handler code
 * runs, so a per-field length check — `content` at 4000 characters, say — never
 * limits what was already read into memory. Next caps Server Action payloads
 * and proxy-read bodies, but neither applies to a route handler calling
 * `request.json()` directly, and the ALB in front of this app sets no request
 * body limit either. That leaves a handful of concurrent large POSTs able to
 * exhaust the task's memory.
 *
 * Counting bytes as they arrive is what makes the cap real. A Content-Length
 * check is one line and looks equivalent, but the header is client-supplied and
 * simply absent under chunked transfer-encoding, so it stops accidents rather
 * than anyone deliberate.
 */

/**
 * Thrown past the cap and caught by `guard` in with-auth.ts, which is the one
 * place in the app that converts a thrown thing into problem+json. Declared
 * here rather than in problem.ts so the dependency runs one way: with-auth
 * imports this module, this module imports nothing from with-auth.
 */
export class PayloadTooLargeError extends Error {
  readonly limit: number
  constructor(limit: number) {
    super(`Request body exceeded ${limit} bytes`)
    this.name = "PayloadTooLargeError"
    this.limit = limit
  }
}

/**
 * 64 KiB. The largest legitimate body on any route using this is a 4000-character
 * message, which is 16 KB even if every character needs four UTF-8 bytes — so the
 * cap sits well clear of real traffic, and an oversized-but-plausible paste still
 * gets the field-level 400 that names the actual rule rather than a blunt 413.
 */
export const MAX_JSON_BODY_BYTES = 64 * 1024

/**
 * Reads and parses a JSON body, aborting past `limit` bytes.
 *
 * Returns null for an absent or malformed body — the same contract as
 * `request.json().catch(() => null)`, so callers keep validating the parsed
 * shape exactly as they did. Oversized bodies throw instead: `guard` in
 * with-auth.ts turns that into a 413, which keeps the size rule out of every
 * handler the way the session and onboarding rules already are.
 */
export async function readJsonBody<T>(
  request: Request,
  limit: number = MAX_JSON_BODY_BYTES,
): Promise<T | null> {
  if (!request.body) return null

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let text = ""
  let bytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    bytes += value.byteLength
    if (bytes > limit) {
      // Drop the rest of the body rather than draining it to completion just
      // to discard it — reading on would spend the memory this cap exists to
      // protect.
      await reader.cancel()
      throw new PayloadTooLargeError(limit)
    }

    // Decode incrementally so a multi-byte character split across two chunks
    // still reassembles; the trailing call flushes any partial sequence.
    text += decoder.decode(value, { stream: true })
  }
  text += decoder.decode()

  try {
    return JSON.parse(text) as T
  } catch {
    // Covers an empty body too: JSON.parse("") throws. Malformed input reads
    // as absent, which every caller's field validation already answers with
    // its own 400 naming the field that is missing.
    return null
  }
}
