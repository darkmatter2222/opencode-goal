/** Bound an SDK wait without assuming a timed-out request was not accepted. */
export async function withDeadline<T>(operation: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout; outcome must be reconciled before retry`)), ms)
      ;(timer as any).unref?.()
    })])
  } finally { if (timer) clearTimeout(timer) }
}

export function sdkResult<T>(value: T): T {
  if (value && typeof value === "object" && "error" in value && value.error) {
    const error = new Error(`SDK request failed: ${JSON.stringify(value.error)}`)
    Object.assign(error, { cause: value.error, response: (value as any).response })
    throw error
  }
  return value
}
