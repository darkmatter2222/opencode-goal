/** Provider deadlines are a lower bound, never shortened by local backoff. */
export function retryAfterDeadline(error: any, now = Date.now()): number | undefined {
  const headers = error?.response?.headers ?? error?.data?.responseHeaders ?? error?.cause?.data?.responseHeaders ?? error?.headers
  const raw = typeof headers?.get === "function" ? headers.get("retry-after") : headers?.["retry-after"] ?? headers?.["Retry-After"]
  if (raw === undefined || raw === null) return undefined
  const value = String(raw).trim()
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    const deadline = now + Number(value) * 1000
    return Number.isFinite(deadline) ? deadline : undefined
  }
  const deadline = Date.parse(value)
  return Number.isFinite(deadline) && deadline > now ? deadline : undefined
}
