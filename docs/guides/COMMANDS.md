# Command reference

[Documentation home](../README.md) · [Troubleshooting](TROUBLESHOOTING.md)

## Learn without leaving OpenCode

`/goal` shows usage. `/goal help <command>` gives syntax, examples and action-specific cautions. Type `/goal-` to discover separately registered shortcuts. Existing user-defined commands are never overwritten; if a shortcut name is already taken, use `/goal <action>`.

`/goal-menu` is a capability-detected TUI picker. It inserts a command into the prompt instead of executing it. There is no claim of nested argument autocomplete on hosts that do not provide it.

<!-- command-catalog:start -->
| Command | Shortcut | Purpose |
|---|---|---|
| `/goal new <objective>` | `/goal-new` | Start a goal that stays in effect until verified |
| `/goal help [command]` | `/goal-help` | Show commands and examples; no model call |
| `/goal status` | `/goal-status` | Show state, requirements and next recovery |
| `/goal edit <revised objective>` | `/goal-edit` | Revise the objective; preserve unspecified constraints and checks |
| `/goal pause` | `/goal-pause` | Pause pursuit; preserve the goal and work |
| `/goal resume` | `/goal-resume` | Resume a saved goal; explicit limits still apply |
| `/goal stop` | `/goal-stop` | Cancel pursuit and archive the goal; preserve project files |
| `/goal retry` | `/goal-retry` | Reconcile recovery now without duplicating an active request |
| `/goal why` | `/goal-why` | Explain the current state and next automatic action |
| `/goal proof` | `/goal-proof` | Show requirement-by-requirement verification evidence |
| `/goal contract` | `/goal-contract` | Read the exact objective and constraints |
| `/goal attempts` | `/goal-attempts` | Show recent observed progress and failed approaches |
| `/goal queue` | `/goal-queue` | Inspect queued goals |
| `/goal add <objective>` | `/goal-add` | Queue another goal without replacing the current one |
| `/goal next` | `/goal-next` | Advance to the next eligible queued goal |
| `/goal history [goal-id]` | `/goal-history` | Inspect archived goals |
| `/goal restore <goal-id>` | `/goal-restore` | Restore an unfinished archived goal as paused |
| `/goal budget [--max-cost amount]` | `/goal-budget` | Show or change explicit resource limits; 0 means unlimited |
| `/goal list [goal-id]` | `/goal-list` | Inspect saved goals across project sessions |
| `/goal doctor` | `/goal-doctor` | Inspect storage integrity and recovery configuration |
<!-- command-catalog:end -->

## Start and specify proof

```text
/goal new Fix checkout retries --accept "Each request is charged at most once" --constraint "Keep the public API compatible" --check "npm test"
```

| Option | Meaning | Repeatable? |
|---|---|---|
| `--accept "criterion"` | Additional semantic acceptance requirement | Yes |
| `--acceptance`, `--success` | Aliases of `--accept` | Yes |
| `--constraint "boundary"` | Required scope/behavior boundary | Yes |
| `--constraints`, `--non-goal`, `--non-goals` | Aliases of `--constraint` | Yes |
| `--check "command"` | Host command that must exit successfully | Yes |
| `--file path` | Project file that must exist | Yes |
| `--contains "path::exact text"` | File content requirement | Yes |
| `--max-turns N` | Cumulative Goal-turn limit | No |
| `--max-tokens N` | Cumulative token limit, not the model context window | No |
| `--max-minutes N` | Cumulative observed assistant runtime limit | No |
| `--max-cost N` | Cumulative host-reported cost limit | No |

Limits default to zero, meaning unlimited. Turns/tokens must be nonnegative integers; minutes/cost can be nonnegative decimals. OpenCode's provider telemetry determines cost accuracy. Runtime is recorded assistant processing time, not a wall-clock expiry for the goal.

Quote values containing spaces. Inline options work for a normal single-line command. A meaningful multiline pasted specification is treated as literal objective text; an initial `edit` or `add` still selects that action. For a guaranteed literal objective, including command-like words or flags:

```text
/goal-new -- pause
/goal-new -- Document the application's --help output
```

Everything after that `--` is literal text; `--check` there would be part of the objective, not a verification command. A new goal cannot replace an unfinished current goal implicitly.

## Revise without losing requirements

```text
/goal edit Fix checkout retries and preserve timeout behavior
/goal contract
```

Editing increments the goal revision. Omitted acceptance criteria, checks, files and constraints remain. Supplying a nonempty group replaces that group. Prior evidence remains inspectable but must satisfy the new revision's verification rules. Persistence and provider cooldowns survive editing.

## Control pursuit

- **Pause:** preserves state and asks the host to abort Goal-owned work. Running tools can take time to cancel; this is not a rollback.
- **Resume:** enables a saved goal, respecting retry deadlines and budgets. An already-active goal does not start another request.
- **Retry:** reconciles this session if its saved wake is due. It does not shorten backoff, clear a live lease, interrupt work or resume a paused goal.
- **Stop:** alias of `/goal clear`; archives the current goal. Project files and queued goals remain.

The upstream natural-language resume tool remains available: the model interprets a foreground continuation request and queues activation for the idle boundary. A later explicit control invalidates that queued intent. Use `/goal resume` for a deterministic, directly expressed control action.

## Queue work

```text
/goal add Document the retry behavior --check "npm test"
/goal queue
/goal queue move abc123 1
/goal queue remove abc123
/goal queue clear
/goal next
```

Use a sufficiently long unique ID prefix shown by `/goal queue`; positions start at 1. Activation requires the current goal to be completed or absent and a permitted execution context. Queueing does not create concurrent live goals. `/goal next` does not discard unfinished work.

## History and project inspection

```text
/goal history
/goal history abc123
/goal restore abc123
/goal history prune --keep 20
/goal list
/goal list abc123
```

An unfinished archived goal restores as paused. A completed archive cannot be restored for continuation, and an unfinished current goal blocks restoration. History pruning permanently deletes older archive records; it does not delete project files. `/goal list` inspects goals across sessions in this project without adopting them.

## Evidence versus observations

`/goal proof` (legacy `/goal audit`) inspects existing evidence; it does not rerun verification or independently certify completion. The `opencode_goal_complete` tool runs completion checks. `/goal attempts` shows up to 15 recent checkpoint/progress notes from bounded history. Model-written notes and completed Todos are not proof.

## Budgets and legacy aliases

```text
/goal budget
/goal budget --max-turns 100 --max-cost 10
/goal budget --max-turns 0
```

Increasing or removing a reached budget can reactivate a budget-limited goal. Resume alone cannot evade an unchanged budget. Budget changes do not remove provider cooldowns.

Legacy `/goal clear`, `/goal audit`, `/goal status` and other nested forms remain supported. `/goal help`, read-only inspection and successful pause/stop responses normally request no model reply; this requires host support for `noReply`. Creation, editing and eligible resume commands can start model work.
