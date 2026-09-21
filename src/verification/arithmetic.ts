import { randomUUID } from "node:crypto"
import type { GoalState } from "../domain/types.js"

/** Deliberately small, exact integer oracle. No eval, code, floats or redefined operators. */
export function integerEquation(text: string): { left: bigint; right: bigint; passed: boolean } | null {
  const match = text.trim().match(/^(?:make\s+)?(-?\d{1,100})\s*([+*-])\s*(-?\d{1,100})\s*(?:={1,3}|equals?|equal)\s*(-?\d{1,100})[.!]?$/i)
  if (!match) return null
  const a = BigInt(match[1]!), b = BigInt(match[3]!), right = BigInt(match[4]!)
  const left = match[2] === "+" ? a + b : match[2] === "-" ? a - b : a * b
  return { left, right, passed: left === right }
}

export function verifyArithmeticObjective(goal: GoalState): GoalState {
  const result = integerEquation(goal.objective)
  if (!result) return goal
  const objective = goal.requirements.find(item => item.source === "objective")
  if (!objective) return goal
  const id = randomUUID(), now = Date.now()
  return { ...goal, evidence: [...goal.evidence, {
    id, kind: "runtime", trust: "host", source: "relentless:integer-oracle", passed: result.passed,
    summary: `Standard integer arithmetic: actual ${result.left}; required ${result.right}.`,
    createdAt: now, goalRevision: goal.revision, requirementIDs: [objective.id],
  }], requirements: goal.requirements.map(item => item.id === objective.id ? {
    ...item, status: result.passed ? "proven" : "failed", evidenceIDs: [id], updatedAt: now,
  } : item) }
}
