# OpenCode Relentless — source audit and implementation plan

Prepared 2026-09-20. Planning only; production behavior and package identity are unchanged.

## Decision

Name: **OpenCode Relentless**. Intended repository: `darkmatter2222/opencode-relentless`. Proposed package: `@darkmatter2222/opencode-relentless` (not published; registry name availability not established). Keep `/goal` as the familiar command, with `/relentless` as an optional alias later.

The right product promise is: **keep ownership of the goal until verified completion or an explicit user stop; automatically recover, change approach, or wait on an identified dependency instead of silently abandoning it.** An unavailable machine, missing credentials, a denied permission, or an impossible requirement cannot be fixed by a stronger prompt. Such conditions need visible, durable waiting states. They must never masquerade as completion.

The current plugin has substantial completion-integrity machinery. Its weakness relative to this request is continuation reliability and stop policy, not simply the wording of its prompt. Do not remove independent verification to make the loop appear more persistent.

## Delivery status and audit scope

- Upstream cloned from https://github.com/ByBrawe/opencode-goal.
- Reviewed release source: `75408cd6cefedd39466a7535defa2d478ae92a38`, version **1.3.31**. npm `gitHead` independently matched this exact commit.
- npm integrity: `sha512-cRS9LqBX0y2GVNh3hj9NZhTL714x5ZPGbrsnAbs44HnNGsAzEGoKGF4IoqjQZde9GLCBQcHYwthAct3PoKJroA==`.
- Compared relevant later production changes through upstream `586e7ce3cf3a9105c7389310cc929ec1ed5e2bad`, whose manifest says 1.3.33. Some commits follow the 1.3.33 release commit; do not assume every main-branch change is in the published package.
- Local planning branch: `planning/relentless-audit`, based on 1.3.31. Only audit documentation and reproduction probes are added.
- **Remote fork was not created.** The connected GitHub account was verified as `darkmatter2222`, but the connector exposes no fork/create-repository operation and the available GitHub browser is signed out. No remote branch or PR is claimed.
- Reviewed all **58 production TypeScript files, 9,889 lines**, including runtime wrappers, storage, installers, TUI, locale tables, and experimental V2 adapter. Read the launcher, package/build configuration, key CI/release workflows, targeted test bodies, and test coverage names for the relevant lifecycle paths. This is not a claim that every benchmark fixture, test, historical document, or language translation was exhaustively validated.
- Ran the complete baseline unit suite: **304 tests, 302 passed, 2 Windows-only skips, 0 failed** on Linux / Node 24.19.0. Build succeeded as part of `npm test`.
- Existing adversarial evaluation gate also passed: weighted score **162/162**, 100%. This covers the existing corpus, not the new hypotheses.
- Seven additional synthetic probes reproduce the behavior described below without modifying production code. They are event/unit simulations, not a live OpenCode or local-model diagnosis.
- The user's Windows config, actual OpenCode version, provider logs, and stopped-goal state were not available. Consequently this report identifies possible causes and confirmed code behavior; it does not assert which one caused the reported incidents.

## How the plugin actually works

`src/server.ts` exports the server module, which loads `src/index.ts`. The latter constructs the core and layers roughly twenty hook wrappers around it. Their order matters: an outer wrapper can suppress an idle event before it reaches the core, and several coordinators later call the final hook stack to resume work.

1. `/goal` arguments become a persisted contract: objective, semantic acceptance criteria, constraints, optional command checks, optional file contracts, execution model/agent, and cumulative budget.
2. The core inserts a goal-owned prompt into the session and associates user messages, assistant messages, and tool calls with a goal ID and revision.
3. File mutations, patch events, certain shell activity, and host evidence update progress. Notes and Todo changes alone are deliberately not proof.
4. Assistant-completion events update usage. A `session.idle` event invokes the continuation path; it closes the observed turn, evaluates stall/budget policy, and dispatches another prompt if status is still `active`.
5. Task, Plan-mode, compaction, provider-recovery, startup, and command wrappers can intercept that path.
6. `opencode_goal_complete` runs declared command/file checks, then creates a restricted read-only verifier child. Its structured verdict and exact file quotations / host evidence are checked before completion.
7. State is saved under project-local `.opencode/goals`, with archive, sequence, and process-lock support. Persistence permits restart recovery, but does not itself provide a continuously running scheduler.

Current statuses are `active`, `paused`, `blocked`, `budget_limited`, `usage_limited`, and `completed`. Only `active` normally continues. “Active” does not guarantee a request is running or a wake-up is scheduled.

Important corrections to tempting but inaccurate diagnoses:

- Fresh 1.3.31 goals have **no default turn, token, cost, or runtime cap**; all four defaults are zero/unlimited. Explicit limits and finite budgets carried from older saved goals still apply.
- A verifier infrastructure exception initially pauses the core, but the public plugin's outer recovery wrapper normally converts that pause to active exponential-backoff recovery. Reading the core in isolation would incorrectly label all verifier outages permanent pauses.
- A rejected completion is not success. The goal can remain active and later stall, block, or loop.
- Having only one configured plugin removes one source of contention, but does not remove OpenCode's own task, compaction, command, tool, and provider events.

## Findings and fixes

Labels: **R** = reproduced in the attached probes; **C** = direct code behavior / design choice; **H** = a concrete failure hypothesis whose triggering host timing or environment still needs an integration test. Priorities: P0 before unattended use, P1 next reliability release, P2 hardening. “Reproduced” refers to the stated code path, not the user's incident.

### A. Explicit early-stop policy

| ID | Evidence and trigger | Consequence | Proposed fix and acceptance test |
|---|---|---|---|
| A1 · P0 · C/R | `src/runtime/progress.ts`, `defaultStallLimit` / `closeObservedTurn`: default threshold 3; with current open Todos, `min(12,max(4,3+ceil(open/10)))`. | Useful reading, investigation, external-tool work, or difficult reasoning can exhaust the window without a recognized mutation. | Replace automatic pause with a persisted recovery ladder: inspect, replan, use an alternative method, compact/handoff if justified. Recognize newly acquired evidence separately from writes. Test long research-only work and true repeated-no-op work. |
| A2 · P0 · C/R | `src/runtime/blocker.ts`, `reportBlocker`: three matching reports on different message IDs set `blocked`; no independent blocker validation. | The model can stop the goal by repeating an invented or premature blocker. Repetition is not evidence. | A blocker report requests diagnosis. Require failure evidence, attempted alternatives, scope of affected requirements, and an explicit dependency before waiting. Test an agent that says “impossible” three times while an available path exists. |
| A3 · P1 · R | Same function increments `consecutiveTurns` when the same key reappears, but intervening progress and unreported turns do not reset it. The core falls back from message ID to call ID/time. | Nonconsecutive reports can be treated as consecutive; absent message IDs can turn multiple calls into alleged distinct turns. | Count durable logical goal turns, reset on relevant progress or resolution, disallow call-ID fallback as proof of distinct turns. Test t1/t5/t9 reports with successful work in between and multiple reports in one turn. |
| A4 · P1 · C | `src/runtime/accounting.ts`, `budgetLimitHits`; `domain/goal.ts`, `editGoal` preserves budget and cumulative usage. | A finite legacy or explicit budget still ends continuation; editing/resuming does not replenish it. | Surface the exact inherited cap at activation. Persistent mode defaults remain unlimited, but never silently override a user-set cap. Test fresh, legacy, edited, restored, and explicitly capped goals. |
| A5 · P1 · C | `src/opencode/host-limits.ts`, `recoverPromptOverflow`: compact once, then pause if overflow repeats before observed work; missing summarize API/model or failed summarize also pauses. | Long goals stop despite otherwise recoverable context problems. | Preflight real input/output headroom; then compact, reduce recovery context, and migrate to a fresh session carrying the immutable contract and evidence. Test overflow after compaction, missing limits, and failed summarization; do not replay non-idempotent mutations. |
| A6 · P1 · C | `src/runtime/limits.ts`: free-tier/account-rate-limit retry reasons become `usage_limited`; auth and selected nonretryable API failures pause. | Recoverable quota/reset conditions require manual resume; generic 400s may include context or parameter problems. | Separate quota wait, credential dependency, incompatible request, and context failure. Schedule a known reset or approved local endpoint health check. Preserve permission/auth boundaries. Test provider-specific envelopes and a limit that later clears. |
| A7 · P1 · C | `agent-boundary.ts`, `domain/goal.ts`, `store.restore`, `model-resume.ts`: Plan mode/user pause/restoration stop autonomy. Natural resume depends on a model call, stored only in memory until idle. | Some stops are intentional; a requested resume can also vanish on crash or be misunderstood. | Keep explicit user pause and Plan mode authoritative. Persist accepted resume intent with goal/revision identity; expose deterministic resume status. Test pause-resume races, crash before idle, and a model that omits the resume tool. |

### B. Active but asleep: dispatch and event ownership

| ID | Evidence and trigger | Consequence | Proposed fix and acceptance test |
|---|---|---|---|
| B1 · P0 · R | `opencode/plugin.ts:188`, `prepareContinuation` calls `closeObservedTurn` for every idle that reaches it, without a unique completed-turn cursor. | Three synthetic idle events paused a goal with **zero completed assistant turns**. Duplicate or unrelated idle events can consume stall allowance. | Idempotent logical-turn ledger; close each goal-owned turn once. Idle is a scheduling hint, never proof of a completed turn. Replay duplicate/reordered idle events and assert no counter change. |
| B2 · P0 · C/H | `continueIfActive` uses a detached `session.prompt` promise and clears `dispatching` only on settlement. No generic executor dispatch deadline/heartbeat exists. | A never-settling transport holds dispatch ownership indefinitely; later idles merely set `deferredIdle`. | Dispatch receipt plus reconciliation lease. Poll host message/tool state before classifying a request lost; distinguish slow active generation from a dead connection. Test a never-resolving promise, live streaming, and uncertain acceptance without duplicate mutation. |
| B3 · P0 · R | `sdkPrompt` returns the SDK response unchecked; infrastructure transport only catches thrown errors. Verifier code, by contrast, explicitly checks returned `.error`. | `{error: ...}` can leave status `active`, with no recovery and no future event. | One response-unwrapping/error-normalization adapter for every SDK operation. Test thrown errors, resolved error envelopes, malformed success, and accepted requests whose response is lost. |
| B4 · P0 · R | `task-deferral.ts:129–145`: parent idle is suppressed; clearing the last child removes bookkeeping but never explicitly schedules the parent. Existing tests manually inject another parent idle. | Parent remains active and asleep if the host does not emit that additional event. | Persist a deferred-parent wake token and release it through the guarded scheduler when the last dependency settles. Test child completion with **no subsequent parent idle**, plus a concurrently busy parent. |
| B5 · P1 · C/H | `task-deferral.ts`: foreground call/child maps rely on after-hooks and terminal events; no expiry or host reconciliation. | Missing tool-after, lost child event, or changed metadata leaves a permanent deferral. Terminal child errors are also treated as terminal ownership, so retries need host confirmation. | Durable dependency records and reconciliation against authoritative child/tool state. Repair stale bookkeeping without aborting real work. Test dropped after-hooks, child retry, deleted child, and restart. |
| B6 · P0 · C/H | `compaction-continuation.ts:72` enters `awaiting_prompt`, suppressing subsequent idles until `chat.message`. | If dispatch is lost or the callback never arrives, successful compaction can be followed by indefinite silence. | Give every barrier a durable identity, deadline, and reconciliation action. Test SDK acceptance without chat callback and fallback competing with human steering. |
| B7 · P1 · C/H | `plugin.ts:150–180`: a five-second suppression is consumed by the next idle after steering/abort, irrespective of its exact originating turn. | With missing/reordered abort events, it may suppress the only useful idle; late abort idle can escape suppression. | Correlate suppression to a specific aborted dispatch/turn, not elapsed time. Test missing abort idle and reordered steering completion. |
| B8 · P1 · R | `ownership.ts:109` deletes the parent user-owner mapping on an assistant completion. | A subsequent assistant message with that same parent is unowned in the probe. On hosts that use this pattern for tool loops, usage/progress/cadence attribution can be lost. | Retain parent ownership through the logical prompt boundary, with bounded durable turn mapping. Validate the pattern against supported OpenCode versions before shipping. |
| B9 · P1 · C/H | `ownership.ts`: prompt equality and 60-second expiry; pending mutation ownership shares that expiry, while Todo hooks require observed active ownership. | Slow local prefill, callback delays, or rewritten prompt text can lose attribution or be mistaken for user steering. | Use host request/message IDs and dispatch receipts where supported; retain exact-text matching only as a bounded compatibility fallback. Test >60-second prefill and tool-before-message ordering. |
| B10 · P0 · C/H | `infrastructure-recovery.ts`: timer callback catches errors by cancelling the timer; startup recovery catch discards errors; transport cleanup observation lasts only 30 × 10 ms. | A storage/SDK error during recovery can silently remove the only future wake; delayed core cleanup can miss the recovery observation window. | Persist retry intent before scheduling; a general reconciler repairs overdue intents. Record typed recovery failures and retry generation conflicts. Test a storage failure at wake, late core pause, and an exception while rescheduling. |
| B11 · P1 · C/H | Same file: `busy` and `unknown` host statuses defer indefinitely; only `retry` gets a two-minute watchdog. `nextRetryAt` is set to zero before dispatch traverses all wrappers. | Stale busy/unknown or a downstream deferral may leave no effective recovery owner. | Cross-check chronological messages, active tools, permissions and children; require a positive dispatch receipt before consuming the retry intent. Never assume unknown means idle. Test stale busy and a task barrier intercepting the recovery wake. |

### C. Restart, storage, and host waits

| ID | Evidence and trigger | Consequence | Proposed fix and acceptance test |
|---|---|---|---|
| C1 · P0 · C/H | `recovery.ts:146–185`: startup barrier awaits list/status once; failure clears pending state without retry. Busy/retry/missing sessions are skipped. | A transient startup issue can strand goals. A hanging barrier suppresses their idle events. | Retry host readiness with diagnostics; reconcile all persisted eligible goals after readiness, including pagination where applicable. Keep bootstrap requests outside instance initialization deadlocks. Test list rejection, delay, missing page, and stale busy. |
| C2 · P1 · C/H | `recovery.ts:192–264`: a sequential loop awaits each recovery prompt. | One slow/hung goal prevents later goals from being recovered. | Independently scheduled per-session recovery with bounded overall concurrency and one lease per goal. Test two goals where the first prompt never settles. |
| C3 · P0 · C | Store writes are generation-checked, but several wrappers own separate store instances; core `serialize` only serializes its own instance. Most save sites do not rebase conflicts. | A stale-write/lock error can terminate an event callback or lose useful telemetry; the existing locks prevent corruption but do not guarantee continuation. | Central transactional mutation function shared across wrappers, retry only safe recomputable transitions, durable dispatch outbox. Test competing progress/accounting/recovery/steering writers. |
| C4 · P1 · C/H | `process-lock.ts:217`: dead-owner cleanup elects through a `.cleanup` hard link but has no corresponding reclamation path if that cleanup owner dies. PID-only liveness can also meet reused PIDs. | Rare crash sequences can leave a lock effectively unrecoverable until intervention. | Lease ownership includes process-start identity and recoverable cleanup election. Never break a live lock based on age alone. Test death during cleanup and simulated PID reuse. |
| C5 · P1 · C/H | `store.ts:65`: validation checks a small top-level subset, not status/budget/usage/requirements deeply. Scans skip corrupt states. Windows rename fallback removes the target before retry. | A parseable malformed state can pass validation then crash later; corrupt/missing snapshots may look like absent goals; interrupted Windows replacement risks losing the live snapshot. | Versioned full schema, last-known-good snapshot/journal, visible quarantine and restore diagnostics, crash-safe replacement strategy. Test missing usage, invalid status, disk-full, and crash during Windows fallback. |
| C6 · P0 · C/H | `runtime/checks.ts:21`: timeout sends SIGTERM to a shell process and waits for `close`; no forced process-tree deadline. Checks are sequential, default one hour each. | A child retaining pipes or ignoring termination can hang completion; even healthy long checks can look like silence. | Process-group/tree cancellation, kill escalation, absolute deadline, cancellation on user stop, bounded live check status. Test ignoring SIGTERM and a spawned descendant holding stdout. |
| C7 · P1 · C/H | `opencode/toast.ts:15`: an optional UI notification is awaited without a deadline. | A hung TUI response can block otherwise unrelated lifecycle/recovery code despite the comment that UI must not affect completion. | Bound or detach notifications with logged failures. Test a toast promise that never resolves. |
| C8 · P1 · C | No standalone supervisor in this package; no permission/question-specific reconciler in 1.3.31. Project root and session ID determine state identity. | Closed OpenCode, suspended machine, pending permission/question, new session, moved workspace, or disabled/unloaded plugin can all look like an abandoned goal. | Visible waiting reasons and user-scoped goal index; later optional supervisor and explicit session migration. Do not auto-approve denied tools. Test restart, permissions, moved workspace, new session, plugin load failure. |

### D. Verification and false completion

| ID | Evidence and trigger | Consequence | Proposed fix and acceptance test |
|---|---|---|---|
| D1 · P0 · C | `verifier.ts:293`: verifier selection is explicit option → `small_model` → default model; it does not inherit the selected goal executor model. Root wrapper default timeout is five minutes, followed by at most one fresh 60-second timeout retry. | A weak, unavailable, or differently routed verifier can reject correct work, malfunction, or create long recovery waits. This matters with local endpoints. | Display and preflight executor/verifier separately, validate tool-call support, use an explicitly configured competent local verifier and approved fallbacks. Test malformed tools, slow prefill, unavailable small model, and empty verdicts. |
| D2 · P1 · C/H | Verifier result errors split into infrastructure exceptions and generic missing-result/quote/format failures. Only the former gets dedicated backoff; `verifyDeclaredFiles` and checks are outside the semantic try/catch. | Schema/quote mistakes may send the executor back to redundant work or lead to a generic stall; file read errors can escape the tool. | Typed outcomes: infrastructure, invalid verdict, insufficient proof, contradicted requirement. Retry/reformat the verifier without repeating already completed mutations. Test malformed result, nonempty prose without tool submission, EACCES, and stale file. |
| D3 · P0 · C | `plugin.ts:125`: audit merge still applies `.slice(-500)` despite the separate retention helper pinning required proofs. `verifier.ts:103` supplies only the latest 28 passing host records. | Large contracts can lose evidence needed to complete or omit necessary proof from verifier context. | Use `retainEvidenceRecords` at the final merge and select evidence by requirement, with paging/chunked audit rather than last-N truncation. Test >500 required proofs and >28 disjoint checks. |
| D4 · P0 · C/H | Host checks and file corroboration happen before the final merge; no workspace generation/hash fence spans the whole audit. | External changes or another tool can invalidate evidence before status becomes completed. | Capture the evidence snapshot identity and revalidate affected files/check dependencies immediately before commit; reject changed snapshots. Test mutation while verifier runs. |
| D5 · P0 · C | Exact quotations establish that text exists; the model still decides whether it proves the full objective. No independent semantic truth oracle exists. | A verifier can accept a real but irrelevant quote and falsely complete unfinished work. Weak checks such as existence/contains or a passing trivial command are insufficient for broader claims. | Requirement-specific executable oracles, negative tests, provenance, independent review for broad semantic claims. Test plausible README claims and unrelated valid quotations. Keep semantic uncertainty explicit. |
| D6 · P1 · C | Verifier tools are limited to read/glob/grep/result; evidence corroboration reads project files. Remote state, screenshots, UI behavior, and other external claims lack native proof adapters. | Some goals cannot be convincingly completed through available evidence, or may be judged using indirect claims. | Add host-owned evidence adapters for requested external outcomes, with snapshots/time/source and freshness checks. Test a goal whose only authoritative success signal is a remote API response. |
| D7 · P1 · C | `runtime/todo-plan.ts` bounds recovery rendering to 8,000 characters, but `opencode_goal_get` does not expose a paged item manifest. Completion blocks any current pending/in-progress Todos, without distinguishing required from advisory work. | Long plans lose actionable tail context, or an irrelevant stale Todo blocks otherwise valid completion. | Paged manifest retrieval; requirement-linked mandatory items; recovery prioritizes unfinished items. Reconcile stale plans without treating cancellation as success. Test 100+ tasks where only tail items remain. |
| D8 · P0 · R/C | `verifierHostEvidence` calls all `progressFingerprints` mutations; 1.3.31 shell progress hashes command text. `guardSemanticProcessResults` accepts the count as per-turn mutation proof. Fingerprints are capped at 128, and one patch may yield several file fingerprints. | False early completion is possible if the verifier claims a cadence requirement proven using this inaccurate aggregate; long valid cadence goals may instead never prove completion. | A separate append-only logical-turn/mutation ledger, distinguishing activity, evidence, and actual mutations. Test three shell fingerprints in one turn (reproduced), multi-file patches, and >128 mutation turns. |
| D9 · P1 · C | `settleCurrentProgress` resets stalls on every successfully evaluated completion attempt, even a rejected audit; new trusted file/command evidence increments progress even when unchanged or failing. | The inverse failure: endlessly attempting the same invalid completion can evade stall policy and never reach the objective. | Fingerprint audit outcomes and track repeated unchanged failures separately. Drive repair from unmet requirements. Test 20 identical failed audits and repeated unchanged file evidence. |

### E. Loading and upgrading the fork

| ID | Evidence and trigger | Consequence | Proposed fix and acceptance test |
|---|---|---|---|
| E1 · P1 · C | `install.ts`, `install-legacy.ts`, `server.ts`, package exports and command markers contain upstream identity. The installer preserves user-owned `goal.md`; the fallback bridge tells the model not to execute when the plugin did not intercept it. | A shallow package rename can keep installing upstream, refuse migration, create duplicate ownership, or leave `/goal` inert. | Coordinated migration of package/server/TUI/bin/markers/README/CI; detect the known upstream installation and replace it transactionally with backup. Keep tool aliases and state schema compatible initially. Test the user's exact single-plugin config, JSONC, multiple configs, and user-owned commands. |
| E2 · P1 · C | Multi-config installation stages all files but commits them sequentially, without rollback. Release workflow still targets upstream npm identity. No lockfile is committed. | Partial write failure can leave inconsistent configuration; a fork is not reproducibly releasable by merely renaming its repository. | Transaction manifest plus rollback, pinned development dependency lock, fork-specific publish identity/trusted publisher and disabled automatic publication until release approval. Test failure on the second write and clean packed installation on Windows. |
| E3 · P1 · C | Experimental V2 adapter is deliberately read-only; stable dependency range is `@opencode-ai/plugin >=1.4.0 <2`. Internal verifier name collision throws during config. | Unsupported host or verifier-agent collision can prevent functionality entirely. | Capability negotiation at load with a conspicuous diagnostic; retain fail-closed V2 behavior until host capabilities exist. Test supported minimum/current host, V2, and conflicting agent configuration. |

The inventory above contains **38 findings**. Some are correct boundaries to expose better, some are policy mismatches, and others are reproducible defects or timing hypotheses. They are not 38 independently observed failures in the user's environment, nor a mathematical guarantee that no other defect exists.

## What newer upstream code already changes

| Source version/commit | Useful change | What Relentless should do |
|---|---|---|
| 1.3.32 / `bf5f3a2` | Proactive context-pressure compaction and telemetry-backed interpretation of some ambiguous HTTP 400s; durable `waiting_user`; stricter shell progress. | Reuse selectively after review. A model-visible wait tool still needs evidence-backed dependency handling to avoid premature surrender. |
| 1.3.33 / `70312fd` | Empty-response classification; preserve token/cost/runtime while not charging logical turn count; retry once then pause on the second empty completion. | Reuse detection/accounting, change terminal policy to recovery/fallback/visible provider wait. Simply upgrading adds another automatic pause, so it does not satisfy the requested persistence behavior. |
| Post-release main / `c64c27c` | Avoid semantic no-op storage writes. | Good reduction in storage contention; not a substitute for shared transition transactions. |
| Post-release main / `09c4bb9` | Persist runtime build fingerprints. | Include for diagnostic provenance. |
| Post-release main / `586e7ce` | Warn about suspicious Todo drift. | Include as advisory diagnostics; still require requirement-linked proof. |

One regression risk in the newer shell implementation deserves a specific test: its Git marker hashes HEAD plus porcelain **status strings**, not changed file contents. Editing an already-dirty file again can leave that marker unchanged. Do not assume this measures all durable work. Prefer content/diff/object fingerprints with bounded cost. Also review its hard minimum context reserve on small-window local models.

## Recommended architecture for the branch

Introduce one host-owned **GoalSupervisor** to own transitions and wake-ups. Existing verification, storage guards, command parsing, and host integration remain useful components. Replace wrapper-to-wrapper scheduling over time, not in one uncontrolled rewrite.

Separate three concepts:

- **Goal lifecycle:** open, completed, cancelled. Only verified completion or explicit cancellation ends ownership.
- **Execution phase:** running, verifying, recovering, waiting_dependency, waiting_user, paused_by_user, budget_limited.
- **Liveness record:** goal/revision, logical turn ID, dispatch ID, lease owner, last host event, outstanding tools/children, next wake time, dependency/check details, attempt outcome, and typed reason.

Invariants:

1. Every open goal has exactly one explanation: work is running, a wake-up is scheduled, a known dependency is being watched, or an explicit user/budget boundary prevents action.
2. Only one autonomous dispatch lease exists per goal/session, including across processes.
3. A host idle event cannot by itself increment logical turns or stalls.
4. A dispatched request is not successful merely because its HTTP promise resolved.
5. Unknown request acceptance is reconciled against host state before replay. Non-idempotent external actions require durable action receipts.
6. No-progress triggers strategy change; retries never turn into fabricated progress or diluted acceptance criteria.
7. A model can request completion or report a blocker. The host decides the transition using evidence and the user's policy.
8. Pause/cancel/permission denial and explicit budgets remain authoritative.
9. An audit can commit completion only against the same contract revision and still-valid evidence snapshot.
10. Repeated tool, event, and process delivery must be idempotent.

A practical recovery ladder:

1. Reconcile ownership, messages, tools, children, pending questions, and current state.
2. Repair a lost wake-up or transient transport failure with backoff and jitter.
3. Detect repetition and require a concrete alternative strategy focused on unmet requirements.
4. Compact or start a fresh executor session with the contract, unfinished plan, evidence references, and failed approaches preserved.
5. Use an explicitly configured alternate local model/endpoint if appropriate and available.
6. If a genuine external dependency remains, persist a precise wait condition and continue any independent required work. Resume when the condition clears. Notify the user once with the exact dependency when human action is indispensable.

This does not promise that every possible goal is achievable. It promises that unfinished work is never silently discarded or falsely marked done.

## Implementation sequence and acceptance gates

| Phase | Changes | Gate |
|---|---|---|
| 0 — fork foundation | Create renamed GitHub fork; retain upstream MIT attribution/history; add planning branch; document migration identity. Import upstream fixes only through reviewed commits. | Remote repository identity verified; no publication or user installation changed. |
| 1 — prove liveness | Typed stop/recovery reasons, event journal, logical-turn cursor, normalized SDK responses, last-child wake, dispatch receipts and reconciliation. | All seven attached probes converted into desired-behavior regressions. Duplicate events never double-dispatch or pause an unstarted goal. |
| 2 — persistence policy | Replace stall/blocker surrender with strategy recovery and explicit dependency waits; retain user pause, Plan, and budgets. | Read-only research survives; fake blockers do not stop; real denied permissions do not get bypassed; explicit stop wins every race. |
| 3 — long-run resilience | Context preflight/handoff, empty-turn recovery, local-model preflight/fallback, shared state transitions, crash-safe wake intent. | Thousands of simulated turns; injected dropped/reordered events; crashes at every save/dispatch boundary; slow local prefill. |
| 4 — trustworthy finish | Requirement-linked evidence, retention fixes, snapshot fence, logical cadence proof, command process-tree cancellation. | Stale or irrelevant proof cannot complete; >500 proof records remain usable; changed workspace invalidates audit; hung checks terminate. |
| 5 — release | Package/installer identity migration, rollback, clean Windows/Linux packed-artifact smoke, exact supported OpenCode compatibility matrix. | Upgrade the exact original single-plugin config and resume its persisted goals without duplicate plugin owners or lost state. |

Before claiming unattended reliability, run real-host tests with the user's actual OpenCode version and local model endpoints. The current audit probes intentionally avoid making paid provider calls, modifying the user's machine, or publishing a package.

## Ten feature ideas worth building

1. **Goal flight recorder.** `/goal why` displays why it is working, waiting, or recovering, with the last event, unmet requirement, next scheduled action, and retry countdown. Export a redacted replay bundle that deterministically reproduces scheduling failures.
2. **Proof board.** A live requirement-to-artifact/test matrix that distinguishes implemented, checked, stale, and proven. Clicking a claim reveals the actual evidence and its workspace revision, not just a model-written checkmark.
3. **Recovery strategist.** Detect repeated commands, repeated diffs, repeated verifier objections, and approach cycles. Maintain a compact failed-approach record and propose a materially different next step instead of issuing another generic “continue.”
4. **Local-model relay.** Configure separate executor and verifier roles plus approved fallback endpoints. Health-check tool calling and context limits; move an interrupted goal between available local models while preserving its contract and action receipts.
5. **Fresh-session handoff.** When context becomes unreliable, transfer the unfinished goal into a new session with exact requirements, completed proof, active branch, unfinished tasks, and known pitfalls. The old session remains inspectable, and only one session owns execution.
6. **Dependency-aware work queue.** Blocked requirements wait on explicit conditions while independent required tasks continue. File changes, test results, service health, and approvals can release dependencies without a manual “continue.”
7. **Goal worktrees and checkpoints.** Keep experimental approaches in isolated Git worktrees, record reversible checkpoints, compare results, and prepare a reviewable patch. Never automatically reset or overwrite the user's unrelated changes.
8. **Adaptive verification.** Run cheap targeted checks during work, broaden checks when affected scope changes, and run the full proof gate before completion. Record which requirement each check actually covers to avoid both needless repeated suites and weak completion claims.
9. **Stream Deck goal controls.** Integrate with AgentStreamDeck: show running/recovering/waiting/verified states, unmet-item count, and time since real progress. Buttons open the session, pause/resume, or act on a specific existing permission request without globally disabling permissions.
10. **Optional unattended supervisor.** A user-installed background service keeps the goal registry and wake schedule alive when the TUI closes, with restart recovery, quiet notifications, and a hard user stop. This is a separate lifecycle feature, not a promise that a session plugin alone runs after its host exits.

## Practical diagnosis of the currently installed plugin

For an actual occurrence, preserve `/goal status`, `/goal audit`, `/goal doctor`, the matching persisted goal JSON, OpenCode/provider versions, and the event tail around the last assistant message. Redact credentials. These are the minimal observations needed to distinguish an intentional pause from an active-but-asleep goal or a false completion.

Interpretation:

- `paused` + “without host-observed progress”: investigate A1/B1 and progress attribution.
- `blocked`: inspect the three blocker reports and whether the dependency was real.
- `active` + a future infrastructure retry: the goal is recovering, not necessarily abandoned.
- `active` + no live request, no dependency, and no next wake: investigate B2–B11 and C1–C3.
- `completed` while required work remains: investigate D4/D5/D8, the exact contract, and the evidence used.
- `budget_limited` / `usage_limited`: distinguish user budget from provider quota; unlimited goal tokens do not mean unlimited model context.

## Reproduction material

`reproduce-audit.mjs` runs against the built, unchanged 1.3.31 production source. It asserts existing flawed behavior, so a successful run means the flaws were demonstrated. It is intentionally outside the normal regression suite. After implementing fixes, replace these assertions with desired-behavior regression tests in `test/`.

Run from the repository root:

```sh
npm install --ignore-scripts --no-package-lock --no-audit --no-fund
npm run build
node docs/relentless/reproduce-audit.mjs
```

See `reproduction-results.json`, `baseline-tests.log`, and `SOURCE-REVIEW.csv`. The source inventory records exact file hashes and line counts; it is a review scope ledger, not a formal proof of correctness.

## Pinned source references

- [1.3.31 core continuation and completion](https://github.com/ByBrawe/opencode-goal/blob/75408cd6cefedd39466a7535defa2d478ae92a38/src/opencode/plugin.ts)
- [Stall policy](https://github.com/ByBrawe/opencode-goal/blob/75408cd6cefedd39466a7535defa2d478ae92a38/src/runtime/progress.ts)
- [Blocker policy](https://github.com/ByBrawe/opencode-goal/blob/75408cd6cefedd39466a7535defa2d478ae92a38/src/runtime/blocker.ts)
- [Delegated-task deferral](https://github.com/ByBrawe/opencode-goal/blob/75408cd6cefedd39466a7535defa2d478ae92a38/src/opencode/task-deferral.ts)
- [Infrastructure recovery wrapper](https://github.com/ByBrawe/opencode-goal/blob/75408cd6cefedd39466a7535defa2d478ae92a38/src/opencode/infrastructure-recovery.ts)
- [Independent verifier](https://github.com/ByBrawe/opencode-goal/blob/75408cd6cefedd39466a7535defa2d478ae92a38/src/opencode/verifier.ts)
- [Compared upstream changelog](https://github.com/ByBrawe/opencode-goal/blob/586e7ce3cf3a9105c7389310cc929ec1ed5e2bad/CHANGELOG.md)
