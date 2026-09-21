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
  ["list", "Inspect saved goals across project sessions", "[goal-id]", ""],
  ["doctor", "Inspect storage integrity and recovery configuration", "", ""],
] as const

const DETAILS: Record<string, string> = {
  new: 'Options: --accept "criterion", --constraint "boundary", --check "command", --file path, --contains "path::text". Repeat options to declare multiple requirements.\nLimits: --max-turns N, --max-tokens N, --max-minutes N, --max-cost N; 0 means unlimited.\nLiteral text: /goal-new -- pause (everything after -- is objective text, not flags).',
  edit: 'Omitted checks, files, acceptance criteria and constraints are preserved. Supplied groups replace that group. Prior proof must be reverified for the new revision. Provider cooldowns survive editing.',
  resume: 'An already-active goal does not start another request. Resume preserves saved retry deadlines and explicit resource limits. Missing credentials still require your action.',
  retry: 'Rechecks this session only when its saved wake is due. It does not enable paused goals, interrupt busy work, reset leases, or shorten provider cooldowns.',
  stop: 'Alias of /goal clear. Archives the current goal. It does not undo edits, kill every descendant tool process, or clear your queued goals. Inspect /goal queue separately.',
  queue: 'Manage: /goal queue remove <id> · /goal queue move <id> <position> · /goal queue clear. Positions start at 1. Next goal starts only when the current goal is completed or absent.',
  history: 'Inspect: /goal history <id>. Prune: /goal history prune --keep N (permanently removes older archive records; N must be positive).',
  budget: 'Options: --max-turns N · --max-tokens N · --max-minutes N · --max-cost N. Zero means unlimited. Changing a reached limit can reactivate a budget-limited goal.',
  proof: 'Alias of /goal audit. Inspection does not certify completion or rerun checks. The completion tool runs host verification and semantic review.',
  attempts: 'Shows up to 15 recent checkpoint/progress notes. Notes are observations, not completion evidence or a permanent attempt journal.',
  doctor: 'Read-only storage diagnosis. Back up state before manual repair; never delete state just to make an integrity error disappear.',
}

export function goalHelp(topic?: string): string {
  const command = GOAL_COMMANDS.find(item => item[0] === topic)
  if (command) {
    const [name, description, args, example] = command
    return `${description}.\nUsage: /goal ${name}${args ? ` ${args}` : ""}\nExample: /goal ${name}${example ? ` ${example}` : ""}\nShortcut: /goal-${name}${DETAILS[name] ? `\n\n${DETAILS[name]}` : ""}\nHelp: /goal help · Status: /goal status${name === "pause" ? " · Resume: /goal resume" : ""}`
  }
  return `OpenCode Relentless — keep working, prove the finish.\n${topic ? `Unknown command: ${topic}.\n` : ""}Start: /goal <objective> or /goal-new -- <literal objective>\n\n${GOAL_COMMANDS.map(([name, description, args]) => `/goal ${name}${args ? ` ${args}` : ""} — ${description}`).join("\n")}\n\nType /goal- to discover shortcuts. Use /goal help <command> for an example.\nPersistent goals retry automatically. Explicit pause/stop and permissions remain authoritative.\nPersistence scope: this OpenCode host; use the Relentless runner to keep a headless host alive.`
}
