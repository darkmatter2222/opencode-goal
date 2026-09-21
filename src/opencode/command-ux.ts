import type CorePlugin from "./plugin.js"
import { GOAL_COMMANDS, goalHelp } from "./command-help.js"
import { GoalStore } from "../persistence/store.js"
import { formatDetailedGoalStatus } from "./controls.js"
import { reconcilePersistentGoals } from "./supervisor.js"

type Input = Parameters<typeof CorePlugin>[0]
type Hooks = Awaited<ReturnType<typeof CorePlugin>>

export function installGoalCommandUX(input: Input, hooks: Hooks): void {
  const store = new GoalStore(input.directory)
  const command = hooks["command.execute.before"]
  const chat = hooks["chat.message"]
  const config = hooks.config
  const responses = new Map<string, string>()
  const ownedAliases = new Set<string>()
  hooks.config = async value => {
    await config?.(value)
    value.command ||= {}
    for (const [name, description] of GOAL_COMMANDS) {
      const alias = `goal-${name}`
      if (value.command[alias]) continue // Never seize an existing user command.
      value.command[alias] = { description, template: "$ARGUMENTS" }
      ownedAliases.add(alias)
    }
  }
  function reply(sessionID: string, output: any, text: string) {
    output.noReply = true
    output.parts.splice(0, output.parts.length, { type: "text", text })
    responses.set(sessionID, text)
  }
  hooks["command.execute.before"] = async (event: any, output: any) => {
    let args = String(event.arguments ?? "").trim()
    if (ownedAliases.has(event.command)) args = `${event.command.slice(5)} ${args}`.trim()
    else if (event.command !== "goal") { await command?.(event, output); return }
    let [action = "", ...rest] = args.split(/\s+/)
    try {
      const literalCreate = action === "new" && rest[0] === "--"
      if (!literalCreate && (!args || action === "help" || action === "--help" || action === "-h" || rest.includes("--help") || rest.includes("-h"))) {
        reply(event.sessionID, output, goalHelp(action === "help" ? rest[0] : action.startsWith("-") || !action ? undefined : action)); return
      }
      if (["edit", "new", "add", "restore"].includes(action) && !rest.length) {
        reply(event.sessionID, output, goalHelp(action)); return
      }
      if (["pause", "resume", "stop", "proof"].includes(action) && rest.length) { reply(event.sessionID, output, goalHelp(action)); return }
      if (literalCreate && rest.length === 1) { reply(event.sessionID, output, goalHelp("new")); return }
      if (action === "stop") args = ["clear", ...rest].join(" ")
      else if (action === "proof") args = ["audit", ...rest].join(" ")
      else if (["why", "attempts", "retry"].includes(action)) {
        if (rest.length) { reply(event.sessionID, output, goalHelp(action)); return }
        const goal = await store.load(event.sessionID)
        if (!goal) { reply(event.sessionID, output, "No goal exists. Start with /goal <objective>.\n" + goalHelp(action)); return }
        if (action === "retry") {
          if (goal.status !== "active") { reply(event.sessionID, output, `Goal is ${goal.status}. Use /goal resume if you intend to enable it.\n${formatDetailedGoalStatus(goal)}`); return }
          // Do not override persisted provider backoff or clear a running lease.
          await reconcilePersistentGoals(input, hooks, Date.now(), event.sessionID)
        }
        const latest = await store.load(event.sessionID)
        const history = action === "attempts" ? `\nRecent host observations:\n${goal.progressNotes.slice(-15).map(note => `- ${note.summary}${note.next ? ` Next: ${note.next}` : ""}`).join("\n") || "No observations yet."}` : ""
        reply(event.sessionID, output, `${formatDetailedGoalStatus(latest)}${history}\n${action === "retry" ? "Recovery reconciled. Existing work and provider deadlines were preserved. " : ""}Help: /goal help · Pause: /goal pause`); return
      } else if (!rest.length && ["stats", "paus", "resum", "hlep", "edti", "rety", "stpo"].includes(action)) {
        reply(event.sessionID, output, `Unrecognized action: ${action}. To use it as an objective: /goal-new -- ${action}\n${action === "stats" ? "Did you mean /goal status?\n" : ""}${goalHelp()}`); return
      }
      await command?.({ ...event, command: "goal", arguments: args }, output)
      if (action === "pause" || action === "stop") {
        const saved = await store.load(event.sessionID)
        if ((action === "pause" && saved?.status !== "paused") || (action === "stop" && saved)) {
          reply(event.sessionID, output, `${formatDetailedGoalStatus(saved)}\nThe requested control was not applied. Inspect /goal doctor.`)
          return
        }
        reply(event.sessionID, output, action === "pause" ? "Paused by you. No new Goal work will be scheduled. Work is preserved; running tools may still be cancelling.\nResume: /goal resume · Inspect: /goal status" : "Goal stopped and archived. Project files are preserved.\nHistory: /goal history · New goal: /goal-new <objective>")
      }
    } catch (error) {
      // Do not disguise storage/transport failures as accepted goals.
      reply(event.sessionID, output, `Goal command did not finish: ${error instanceof Error ? error.message : String(error)}\nInspect /goal status before retrying; any already-saved change remains authoritative.\n${goalHelp(GOAL_COMMANDS.some(item => item[0] === action) ? action : "new")}`)
    }
  }
  hooks["chat.message"] = async (event: any, output: any) => {
    const expected = responses.get(event.sessionID)
    responses.delete(event.sessionID)
    const text = (output?.parts ?? []).filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n")
    if (expected && text === expected) return
    await chat?.(event, output)
  }
}
