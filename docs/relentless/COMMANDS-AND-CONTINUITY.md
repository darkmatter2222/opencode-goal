# Relentless: discoverable commands and the continuity contract

Planning extension, 2026-09-20. No implementation changes. This document refines DESIGN.md using Ryan's requirement that developers learn the product inside OpenCode and that an enabled goal survive every recoverable interruption without being abandoned.

## 1. The promise shown to the developer

After a goal is durably accepted, display:

> Goal is in effect. Relentless will keep pursuing it until its requirements are verified or you explicitly pause or stop it. Connection failures will trigger automatic recovery.

Show the goal ID, the actual persistence scope, and the next action beside this receipt. **Do not display “accepted” before the contract, enabled instruction, and first wake obligation have committed.** If the write fails, show “Goal was not saved; work has not started,” retain the entered text, and offer retry.

There are two separately named capabilities:

- **Session persistence:** recovery while the OpenCode host is running; durable resumption after it restarts.
- **Background persistence:** an installed supervisor keeps executing/reconnecting when the TUI exits and restarts automatically according to its OS service configuration.

The second is necessary for the requested cross-process promise. Present the active capability clearly; never imply that an in-process plugin can execute after its process exits. No software can run without power or produce an unavailable provider's response. The unconditional product rule is that these circumstances do not cancel the goal, mark it done, change its meaning, or discard the obligation to resume.

An impossible goal remains enabled and unverified indefinitely. An outage or no-progress streak is an observation, never authority to stop. User pause, explicit cancellation, user-selected resource limits, and access permissions remain authoritative. There is no hidden maximum lifetime retry count.

## 2. Commands are the documentation

Every action needs five things generated from one command schema: short description, syntax, copyable example, effect on goal state, and relevant next action. Use the same schema for slash aliases, parser validation, menus, help, headless output and reference docs. Documentation cannot drift away from implementation.

### Command catalog

All entries below are proposed. Preserve existing working subcommands as compatibility aliases. Top-level aliases exist because the reviewed host does not complete nested arguments after whitespace.

| Familiar form | Discoverable alias | In-product explanation / example |
|---|---|---|
| `/goal` | `/goal-menu` for native picker | Show current goal and available actions. Never create an empty goal. |
| `/goal <objective>` | `/goal-new <objective>` | Start a persistent goal. Example: `/goal Fix checkout retries without duplicate charges`. |
| `/goal help` | `/goal-help` | List actions with descriptions and examples. `/goal help edit` explains one action. |
| `/goal status` | `/goal-status` | Show goal, verification gaps, current activity and next scheduled action. |
| `/goal edit` | `/goal-edit` | Open the contract editor or show usage. Changes are a new revision, not retroactive success. |
| `/goal pause` | `/goal-pause` | Stop scheduling new work until you resume; preserve work and goal. |
| `/goal resume` | `/goal-resume` | Re-enable a goal paused by you. Never reinterpret its success criteria. |
| `/goal stop` | `/goal-stop` | Cancel pursuit, preserve files and history, fence late workers. |
| `/goal retry` | `/goal-retry` | Request recovery now; first reconcile any request already in flight. |
| `/goal why` | `/goal-why` | Explain the current wait/recovery, last observed failure and next action. |
| `/goal proof` | `/goal-proof` | Show each criterion and the authoritative evidence still needed. |
| `/goal verify` | `/goal-verify` | Request an audit of a stable candidate; does not declare success or race active edits. |
| `/goal contract` | `/goal-contract` | Read the exact objective, constraints, criteria and active revision. |
| `/goal attempts` | `/goal-attempts` | Inspect attempted strategies and actual results, including failed recovery. |
| `/goal queue` | `/goal-queue` | Inspect and manage upcoming goals without accidentally replacing the current one. |
| `/goal history` | `/goal-history` | View verified, cancelled and previous goal revisions. |
| `/goal doctor` | `/goal-doctor` | Check loaded plugin, supervisor, provider, verifier and pending wake health. |
| `/goal export` | `/goal-export` | Export a redacted diagnostic/replay bundle with preview of included data. |
| `/goal settings` | `/goal-settings` | Explain persistence, configured models, retry cadence and optional resource limits. |

Additional existing operations—budget, add, next, restore and queue editing—remain available under Help and the More menu. Do not flood the first menu with every advanced operation. Search across all actions; order common actions first and filter them by state. “Lots of commands” should mean discoverable capabilities, not a wall of unexplained verbs.

### Example: missing edit arguments

`/goal edit` should show a form or concise help, not throw:

> Edit the goal contract. Your work is preserved. Changed requirements must be verified again.
>
> Usage: `/goal edit <revised objective>`
>
> Example: `/goal edit Fix checkout retries and preserve existing timeout behavior`
>
> Current revision: 2. Preview changes before applying.

Only explicit contract editing changes meaning. Ordinary conversation, model-authored plans and Todo updates do not. Keep the original text and a revision diff. Do not silently drop existing constraints/checks when only the objective changes. A full replacement is an explicit separate operation. In a form, save is the deliberate apply action; a textual edit first stages a diff and provides an explicit apply action tied to its draft ID.

### Example: successful pause

> Paused by you. The goal and current work are saved.
>
> Resume: `/goal resume` · Inspect: `/goal status`
>
> Current tool: cancellation requested; waiting for termination acknowledgement.

A pause acknowledgement must distinguish “no new work will start” from “all running work has stopped.” Some tools cannot be instantly interrupted. Do not claim quiescence while they still run. Stop fences future goal-owned mutations and late verification results; it does not delete the user's files.

### Example: invalid syntax

`/goal stats` should show “Did you mean `/goal status`?” with its description. Do not execute a fuzzy match or create a goal accidentally. Literal objectives that begin with reserved words use `/goal-new -- <text>` or the form. A bare unknown one-word argument displays help and a literal-create option; longer text remains eligible as a natural objective, with an explicit saved-contract receipt. Unbalanced quotes and malformed numeric values identify the offending input and preserve it for correction.

`/goal help`, `--help`, `-h` and help on every action must be non-mutating. Examples are suggestions to insert, never commands executed merely by opening help. Multiline pasted objectives remain intact; advanced options use form fields or a structured contract rather than fragile inline flags.

### First use, without README dependence

After installation, expose a compact “Goal is ready” entry in the command palette. The first start offers useful verification examples detected from the project, explains the active persistence scope, and shows the explicit pause/stop controls. Advanced knobs stay collapsed. After acceptance, emit the saved-contract receipt and a short tip: “Use `/goal why` to see what happens next.” Avoid repeated onboarding text on every attempt.

Teach at the point of need: a stale proof explains how to reverify; an unavailable provider explains automatic retries; an invalid command shows relevant syntax; an existing goal explains queue versus edit. Help and user controls must work while the provider is offline, without an LLM call.

## 3. Native TUI feasibility and one important integration risk

The reviewed host snapshot exposes command registration, selection/prompt dialogs, routes and sidebar slots. A native action picker is feasible; the earlier visual is a design concept, not an implemented pixel-identical native widget.

However, native TUI slash selection dispatches a command immediately, whereas server-defined slash commands insert command text for argument entry. Registering two `/goal` entries can create duplicate suggestions or swallow `/goal <objective>`.

Implementation must prove that these paths coexist:

1. Typing `/goal Fix the bug` submits the objective unchanged.
2. Enter on bare `/goal` displays useful actions and never calls a provider.
3. Selecting the native menu action opens a dialog without submitting accidental goal text.
4. Existing `/goal pause`, pasted objectives, Escape and Tab retain predictable behavior.

Conservative first implementation: retain the server-owned `/goal` command, register a separate native `/goal-menu` action and palette entry, and use a textual menu for bare `/goal` where no supported UI handoff is available. Upgrade bare `/goal` to the native picker only after a capability-specific bridge passes the tests. Do not monkeypatch private host internals or promise nested inline completion that the host API does not expose.

Use top-level server-command aliases for argument-taking actions. Native local controls can handle no-argument menu operations. Avoid duplicate names between registration surfaces. All mutations pass through the supervisor's typed operations, not direct TUI file edits.

Pinned host sources: [TUI API](https://github.com/anomalyco/opencode/blob/d870e22c70f27103016dcd479edcfebf86136d93/packages/plugin/src/tui.ts), [slash registration](https://github.com/anomalyco/opencode/blob/d870e22c70f27103016dcd479edcfebf86136d93/packages/tui/src/keymap.tsx), [autocomplete](https://github.com/anomalyco/opencode/blob/d870e22c70f27103016dcd479edcfebf86136d93/packages/tui/src/component/prompt/autocomplete.tsx), [prompt submission](https://github.com/anomalyco/opencode/blob/d870e22c70f27103016dcd479edcfebf86136d93/packages/tui/src/component/prompt/index.tsx).

## 4. Retry is a protocol, not another continue prompt

### What upstream already does

The fork already has exponential infrastructure retry: base 15 seconds, capped at five minutes, with persisted recovery metadata. It classifies several transient network/provider errors and has a recovery poller. We should retain useful parts, not claim retry is absent.

The gaps include exception-only transport observation, unchecked resolved SDK errors, ambiguous request acceptance, lost wake delivery, stale busy states, startup recovery failures and separate automatic-pause policies. A stronger backoff formula alone cannot fix them.

Sources: [runtime retry policy](https://github.com/darkmatter2222/opencode-goal/blob/586e7ce3cf3a9105c7389310cc929ec1ed5e2bad/src/runtime/infrastructure-recovery.ts), [transport and timer integration](https://github.com/darkmatter2222/opencode-goal/blob/586e7ce3cf3a9105c7389310cc929ec1ed5e2bad/src/opencode/infrastructure-recovery.ts).

### Proposed default transport retry policy

Base intervals: **15s, 30s, 60s, 120s, 240s, then 300s repeatedly**. Apply equal jitter: choose a delay between half and all of the current interval so many goals do not reconnect simultaneously. These are proposed defaults, configurable and testable with an injected clock/random source. No maximum attempt count or total retry duration.

Honor valid provider `Retry-After` as a lower bound, even above the local five-minute cap. Expose the actual due time. Persist the selected due time before returning to the UI. Restarting must not reset every goal into an immediate retry storm. Reset the failure streak only after observed healthy execution, not merely an HTTP handshake.

Keep this transport retry cadence separate from attempt deadlines, dependency polling and no-progress strategy changes. A long, healthy generation is not a failed connection. Distinguish connection timeout, first-token timeout, idle stream timeout and maximum tool execution time. Slow local prefill needs provider/model-specific deadlines and host progress signals.

### Failure handling matrix

| Observation | Action | User sees |
|---|---|---|
| DNS/network failure before confirmed acceptance | Persist retry and back off | Reconnecting; next retry time; goal still in effect |
| 429 / provider busy / transient 5xx | Honor retry-after; coordinate endpoint cooldown | Provider busy; retry scheduled |
| Connection lost after possible acceptance | Query host message/attempt receipt before resending | Reconciling an interrupted request |
| Partial stream then disconnect | Preserve observed results; reconcile tools/effects; recover remaining work | Response interrupted; checking what finished |
| SDK resolves an error object | Normalize to typed failure; do not treat promise resolution as success | Same explanation as the equivalent thrown error |
| 401/403 or exhausted account quota | Keep goal enabled; periodically check restored access/availability; notify once | Access/capacity unavailable; next check; exact action needed |
| Invalid model/request configuration | Retain goal; diagnose, use an explicitly configured valid route if available | Configuration prevents execution; goal preserved |
| Context too large | Compact or transfer to fresh session; avoid retrying the identical oversized request indefinitely | Recovering context; contract unchanged |
| Empty output repeatedly | Record failure, reconcile actual message parts, refresh session or permitted model route | Empty response; recovery scheduled |
| Verifier unavailable | Retain candidate and evidence; retry verification separately | Work awaits verification; never completed yet |
| Tool outcome unknown | Reconcile action receipt/target state before any repeat | Checking whether the previous action succeeded |
| All work depends on unavailable input | Keep repeated dependency checks scheduled; continue any independent work | Waiting on named dependency; goal remains enabled |

Do not route around permission denial or invent credentials. Alternate models/providers must come from user-approved configuration; no surprise bill or data transfer to a new provider.

### Retry command semantics

`/goal retry` asks the supervisor to reconcile now and, if safe, advance the next recovery attempt. It does not clear failure history, change the goal, create a second worker, override provider retry-after, bypass a permission request, or resume an explicit user pause.

Examples:

- “Recovery check requested. No worker was active; reconnecting now.”
- “Request is still running. Attached to attempt 42; no duplicate request sent.”
- “Provider requires waiting until 14:32:10. Goal remains enabled.”
- “Paused by you. Use `/goal resume` to continue.”

“Retry now” is a convenience. Normal operation never requires it to repair a missed wake-up; the supervisor does that automatically.

### Coordination and durable recovery

A provider-level circuit breaker temporarily gates requests while scheduling health probes. It never cancels an individual goal. Fairly distribute recovered capacity among goals; do not let one impossible goal monopolize every slot. Keep per-goal and per-provider failure state separate.

The durable outbox must distinguish pending, transmitting, accepted, outcome-unknown and settled attempts. A scanner repairs missing wakes. Use one fenced execution owner per goal and reconcile old workers before takeover. The background service and plugin cannot independently dispatch the same goal. A dead service needs an OS service restart policy; a heartbeat by itself cannot resurrect its owner.

Ordinary availability notifications should be quiet and aggregated: one disconnect notice, visible countdown, one recovery notice. Repeated retries update status rather than flooding the transcript. No transcript pruning may erase the durable failure history needed for reconciliation.

## 5. Trust comes from visible, truthful receipts

Keep a compact sticky indicator while a goal is enabled:

> GOAL IN EFFECT · Reconnecting · next retry in 24s

The details view answers five questions: What is the immutable goal? What happened last? What is running or waiting? What will happen next, and when? What remains unproven?

Show scheduler health separately from model progress. “Supervisor last checked 4s ago” does not mean the model made progress. If the supervisor stops heartbeating, the UI derives and displays “Runner unavailable; goal saved” rather than leaving a stale green Working label. Poll status independently of model output; the server validates all displayed deadlines and receipts.

Provide typed reason codes for machines plus readable explanations for humans. Use a clear distinction among goal enabled, execution running, recovering, user-paused, cancelled and verified. “Active” alone is too ambiguous.

## 6. More improvements worth adding before coding

1. **Accepted-goal receipt:** a durable ID/revision and persistence-scope acknowledgement, so developers know the instruction actually took effect.
2. **Contextual command lessons:** syntax and next steps at the exact point of confusion, not a link to a README.
3. **Contract change preview:** show what edit changes, what stays binding and which proofs become stale.
4. **Recovery timeline:** a compact history of disconnect, reconciliation, scheduled retry and successful resumption.
5. **Provider outage coordination:** one endpoint cooldown and fair recovery across goals, preventing retry storms.
6. **Offline control plane:** inspect, pause, stop, edit drafts and read help without a working model connection.
7. **Runner health indicator:** distinguish a healthy scheduler waiting on a provider from a dead scheduler.
8. **Unknown-outcome reconciliation:** preserve receipts so retry cannot casually duplicate a deployment, payment or other external effect.
9. **Compatibility preflight:** identify supported host features, loaded duplicate plugins and missing verifier/service capabilities before claiming readiness.
10. **Reliability rehearsal:** a developer-only fault-injection harness for dropped connections, lost events and process crashes, with a report of whether obligations survived. Never inject failures into the user's live work by default.

## 7. Additional implementation gates

- Every public command has schema-generated usage, example, missing-argument behavior and a provider-independent help path.
- Starting a goal is acknowledged only after its contract and wake obligation are durable. Failed acceptance preserves input and starts no worker.
- Bare `/goal`, typed `/goal <objective>`, Tab/Enter selection and multiline paste coexist without duplicate registration or lost arguments.
- Simulate a long outage with arbitrary restarts; after recovery every enabled unfinished goal resumes within its documented scheduling bound.
- Verify jitter and retry-after using a fake clock, without wall-clock sleeps. Recovery never resets into a burst on every restart.
- Simulate acknowledgement loss after an accepted request: reconcile instead of duplicating it.
- Provider recovery does not resume user-paused goals. A late result cannot undo cancellation or finish an obsolete revision.
- An impossible goal remains enabled/unverified across a large generated trace; lack of progress never removes its scheduled obligation.
- A hung provider cannot block local pause/stop/help; a hung goal cannot starve other goals.
- Runtime status must never show Working without a live owned attempt, nor Recovering without a durable next action or explicit visible dependency check.

The implementation should begin with command/schema and supervisor state-machine contracts, then an adversarial test harness, before a broad UI/retry rewrite. These planning documents define intended behavior; they do not claim it has already shipped.
