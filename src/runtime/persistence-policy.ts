import type { GoalState, GoalInfrastructureRecoveryKind } from "../domain/types.js"
import { enterInfrastructureRecovery } from "./infrastructure-recovery.js"

/** Failure observations cannot revoke a persistent goal's run instruction. */
export function recoverPersistentGoal(goal: GoalState, reason: string, now = Date.now(), kind: GoalInfrastructureRecoveryKind = "continuation_dispatch", notBefore?: number): GoalState {
  if (!goal.persistent || goal.status !== "active") return goal
  const next = enterInfrastructureRecovery(goal, { kind, reason, now })
  if (notBefore && next.infrastructureRecovery && notBefore > next.infrastructureRecovery.nextRetryAt) {
    next.infrastructureRecovery.nextRetryAt = notBefore
    next.nextWakeAt = notBefore
  }
  return next
}
