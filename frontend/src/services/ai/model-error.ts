import { APICallError } from "ai"

/**
 * Reduces a model error to the fields that are safe to log.
 *
 * `APICallError` carries `requestBodyValues` — the entire payload sent to the
 * provider. For a conversation turn that is the system prompt, the user's
 * portfolio snapshot (cash balance, every holding with shares, value, weight
 * and P&L) and the last ten messages of chat history. `console.error(msg, err)`
 * inspects an error's own enumerable properties, so handing the raw object to
 * a logger writes all of it to CloudWatch verbatim.
 *
 * Same rule as `redactPath` in `lib/http/with-auth.ts`, one layer down: nothing
 * reaches a log until something has decided it is safe to be there. `url` and
 * `responseBody` are dropped as well — neither identifies a failure that
 * `name`, `message` and `statusCode` don't already.
 */

/**
 * Provider messages are short, but a validation error can quote the input back.
 * A length cap bounds that without needing to know which errors do it.
 */
const MAX_LOGGABLE_MESSAGE = 500

export interface LoggableModelError {
  name: string
  message: string
  statusCode?: number
  isRetryable?: boolean
}

export function toLoggableModelError(error: unknown): LoggableModelError {
  if (APICallError.isInstance(error)) {
    return {
      name: error.name,
      message: truncate(error.message),
      statusCode: error.statusCode,
      isRetryable: error.isRetryable,
    }
  }
  if (error instanceof Error) {
    return { name: error.name, message: truncate(error.message) }
  }
  return { name: "UnknownError", message: truncate(String(error)) }
}

function truncate(message: string): string {
  return message.length > MAX_LOGGABLE_MESSAGE
    ? `${message.slice(0, MAX_LOGGABLE_MESSAGE)}…`
    : message
}
