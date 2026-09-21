import type CorePlugin from "./plugin.js"
import { scanRecoverableGoalStates } from "../persistence/diagnostics.js"
import { withDeadline, sdkResult } from "../runtime/deadline.js"

type Input = Parameters<typeof CorePlugin>[0]
type Hooks = Awaited<ReturnType<typeof CorePlugin>>
const instances = new Map<string, () => void>()

/** Host events are an optimization. Persisted obligations are reconciled independently. */
export async function reconcilePersistentGoals(input: Input, hooks: Hooks, now = Date.now(), sessionID?: string): Promise<void> {
  if (typeof input.client?.session?.status !== "function") return
  const raw: any = sdkResult(await withDeadline(input.client.session.status({ query: { directory: input.directory } }), 5_000, "Host status"))
  const statuses = raw?.data ?? raw
  if (!statuses || typeof statuses !== "object" || Array.isArray(statuses)) return
  const goals = await scanRecoverableGoalStates(input.directory)
  // Each goal settles independently; one callback cannot indefinitely block the scanner.
  await Promise.allSettled(goals.filter(goal => goal.persistent && goal.status === "active" && (!sessionID || goal.sessionID === sessionID)).map(async goal => {
    const status = statuses[goal.sessionID]?.type ?? "idle"
    if (status !== "idle") return
    if (Math.max(goal.nextWakeAt ?? 0, goal.infrastructureRecovery?.nextRetryAt ?? 0, goal.providerRetryAt ?? 0) > now) return
    await withDeadline(Promise.resolve(hooks.event?.({ event: { type: "session.idle", properties: {
      sessionID: goal.sessionID, __relentlessReconcile: true, __relentlessStatuses: statuses,
    } } })), 10_000, "Goal reconciliation")
  }))
}

export function installPersistentSupervisor(input: Input, hooks: Hooks): void {
  let closed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const close = () => { closed = true; if (timer) clearTimeout(timer) }
  const schedule = () => {
    if (closed) return
    timer = setTimeout(() => {
      void reconcilePersistentGoals(input, hooks).catch(() => undefined).finally(schedule)
    }, 5_000)
    ;(timer as any).unref?.()
  }
  const config = hooks.config
  let started = false
  hooks.config = async value => {
    await config?.(value)
    if (started) return
    started = true
    instances.get(input.directory)?.()
    instances.set(input.directory, close)
    schedule()
  }
  const event = hooks.event
  hooks.event = async value => {
    if (["server.instance.disposed", "server.disposed"].includes(String(value?.event?.type))) {
      close()
      if (instances.get(input.directory) === close) instances.delete(input.directory)
    }
    await event?.(value)
  }
}
