import { spawn } from "node:child_process"
import type { GoalState } from "../domain/types.js"
import { proveRequirementsFromEvidence, recordCommandEvidence } from "../verification/evidence.js"

export const DEFAULT_CONFIGURED_CHECK_TIMEOUT_MS = 60 * 60_000

function configuredCheckTimeoutMs(explicit?: number): number {
  if (Number.isFinite(explicit) && Number(explicit) > 0) return Number(explicit)
  const env = Number(process.env.OPENCODE_GOAL_CHECK_TIMEOUT_MS)
  if (Number.isFinite(env) && env > 0) return env
  return DEFAULT_CONFIGURED_CHECK_TIMEOUT_MS
}

function run(command: string, cwd: string, timeoutMs: number): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, { cwd, shell: true, env: process.env, detached: process.platform !== "win32" })
    let output = ""
    const append = (chunk: Buffer | string) => { output = (output + String(chunk)).slice(-64_000) }
    child.stdout?.on("data", append)
    child.stderr?.on("data", append)
    let timedOut = false
    let escalation: ReturnType<typeof setTimeout> | undefined
    let deadline: ReturnType<typeof setTimeout> | undefined
    const killTree = (force: boolean) => {
      if (!child.pid) return
      if (process.platform === "win32") {
        const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", ...(force ? ["/F"] : [])], { stdio: "ignore" })
        killer.on("error", () => { child.kill(force ? "SIGKILL" : "SIGTERM") })
      } else {
        try { process.kill(-child.pid, force ? "SIGKILL" : "SIGTERM") } catch { child.kill(force ? "SIGKILL" : "SIGTERM") }
      }
    }
    const timer = setTimeout(() => {
      timedOut = true
      append("\nVerification command timed out.")
      killTree(false)
      escalation = setTimeout(() => killTree(true), 1_000)
      deadline = setTimeout(() => {
        child.stdout?.destroy(); child.stderr?.destroy(); child.unref()
        resolve({ code: 124, output })
      }, 2_000)
    }, timeoutMs)
    child.on("error", (error: Error) => {
      clearTimeout(timer)
      if (escalation) clearTimeout(escalation)
      if (deadline) clearTimeout(deadline)
      resolve({ code: 1, output: `${output}\n${error.message}` })
    })
    child.on("close", (code: number | null) => {
      clearTimeout(timer)
      if (escalation) clearTimeout(escalation)
      if (deadline) clearTimeout(deadline)
      resolve({ code: timedOut ? 124 : typeof code === "number" ? code : 1, output })
    })
  })
}

export async function runConfiguredChecks(goal: GoalState, cwd: string, options: { timeoutMs?: number } = {}): Promise<GoalState> {
  const timeoutMs = configuredCheckTimeoutMs(options.timeoutMs)
  let next = goal
  for (const requirement of next.requirements.filter((item) => item.verification === "command" && item.command)) {
    const result = await run(requirement.command!, cwd, timeoutMs)
    next = recordCommandEvidence(next, {
      command: requirement.command!,
      exitCode: result.code,
      output: result.output,
      requirementIDs: [requirement.id],
    })
    const evidence = next.evidence.at(-1)!
    if (result.code === 0) next = proveRequirementsFromEvidence(next, evidence.id)
    else {
      next = {
        ...next,
        requirements: next.requirements.map((item) => item.id === requirement.id ? { ...item, status: "failed" as const, updatedAt: Date.now() } : item),
      }
    }
  }
  return next
}
