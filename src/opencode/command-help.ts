/** One catalog drives discoverability, help, aliases and the native picker. */
export const GOAL_COMMANDS = [
  ["new", "Start a goal that stays in effect until verified", "<objective>", "Fix checkout retries --check \"npm test\""],
  ["help", "Show commands and examples; no model call", "[command]", "edit"],
  ["status", "Show state, requirements and next recovery", "", ""],
  ["edit", "Revise the objective; preserve unspecified constraints and checks", "<revised objective>", "Fix checkout retries and preserve timeout behavior"],
  ["pause", "Pause pursuit; preserve the goal and work", "", ""],
  ["resume", "Resume a saved goal; explicit limits still apply", "", ""],
  ["stop", "Cancel pursuit and archive the goal; preserve project files", "", ""],
  ["retry", "Reconcile recovery now without duplicating an active request", "", ""],
  ["why", "Explain the current state and next automatic action", "", ""],
  ["proof", "Show requirement-by-requirement verification evidence", "", ""],
  ["contract", "Read the exact objective and constraints", "", ""],
  ["attempts", "Show recent observed progress and failed approaches", "", ""],
  ["queue", "Inspect queued goals", "", ""],
  ["add", "Queue another goal without replacing the current one", "<objective>", "Document the retry behavior"],
  ["next", "Advance to the next eligible queued goal", "", ""],
  ["history", "Inspect archived goals", "[goal-id]", ""],
  ["restore", "Restore an unfinished archived goal as paused", "<goal-id>", "abc123"],
  ["budget", "Show or change explicit resource limits; 0 means unlimited", "[--max-cost amount]", "--max-turns 0"],
  ["doctor", "Inspect storage integrity and recovery configuration", "", ""],
] as const

export function goalHelp(topic?: string): string {
  const command = GOAL_COMMANDS.find(item => item[0] === topic)
  if (command) {
    const [name, description, args, example] = command
    return `${description}.\nUsage: /goal ${name}${args ? ` ${args}` : ""}\nExample: /goal ${name}${example ? ` ${example}` : ""}\nShortcut: /goal-${name}\nHelp: /goal help · Status: /goal status${name === "pause" ? " · Resume: /goal resume" : ""}`
  }
  return `OpenCode Relentless — keep working, prove the finish.\n${topic ? `Unknown command: ${topic}.\n` : ""}Start: /goal <objective> or /goal-new -- <literal objective>\n\n${GOAL_COMMANDS.map(([name, description, args]) => `/goal ${name}${args ? ` ${args}` : ""} — ${description}`).join("\n")}\n\nType /goal- to discover shortcuts. Use /goal help <command> for an example.\nPersistent goals retry automatically. Explicit pause/stop and permissions remain authoritative.\nPersistence scope: this OpenCode host; use the Relentless runner to keep a headless host alive.`
}
