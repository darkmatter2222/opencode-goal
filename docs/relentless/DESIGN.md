# OpenCode Relentless

**Keep working. Prove the finish.**

A planning specification for Ryan's fork, reviewed 2026-09-20. Proposed product name: **OpenCode Relentless**. Keep `/goal` as the familiar entry point. Proposed package `@darkmatter2222/opencode-relentless` is an identity proposal, not a claim that the npm scope/name is available. Keep the existing fork URL during planning; a later repository rename can preserve redirects. Retain upstream MIT attribution and history.

## 1. The requirement, precisely

Once a user starts a goal, its instruction to continue survives failed attempts, apparent impossibility, model refusals to continue, empty responses, repeated blockers, context exhaustion, process restarts, and provider outages. **Only verified satisfaction ends it successfully. Only an explicit user control changes the instruction to run.** A model's opinion that the goal is impossible cannot stop it, weaken it, or count as completion.

For `1 + 1 = 3`, fix the interpretation to ordinary integer arithmetic. The protected verifier evaluates that proposition as false. Redefining addition, changing the expected answer, editing a test to return success, or writing a file that says “1+1=3” cannot satisfy it. The scheduler keeps arranging attempts for as long as the user leaves it enabled. An impossibility finding is useful evidence about the problem, but it does not authorize termination. An attempt may honestly report impossibility; the next attempt remains scheduled.

This is stronger than “send another continue prompt.” It needs two separate guarantees:

1. **Completion integrity:** never label an unproven contract complete.
2. **Execution persistence:** never silently lose the obligation to keep trying.

Literal infinite uptime or infallible judgment for arbitrary natural-language goals cannot be guaranteed. A powered-off machine cannot execute, unavailable credentials cannot authorize an API call, and an unconstrained semantic goal has no universal truth oracle. The implementable contract is exact: under a functioning supervisor, durable storage, available execution capacity and permitted actions, every unfinished enabled goal eventually gets another attempt; while unavailable, its durable obligation survives and recovery keeps retrying. There is no maximum total attempt count.

Do not market a second LLM's agreement as absolute proof. Strict completion requires a supported authoritative oracle or explicit user acceptance where the criterion is subjective. User acceptance is a separately labeled event; it cannot override a deterministic false condition and call it machine-proven.

## 2. Scope and evidence

Fork HEAD is `586e7ce3cf3a9105c7389310cc929ec1ed5e2bad`, package version 1.3.33. The earlier exhaustive production-source review was pinned to 1.3.31, `75408cd6cefedd39466a7535defa2d478ae92a38`. This pass reviewed all production changes between those revisions and rechecked the critical continuation, parser, verification, TUI, and storage paths. SOURCE-REVIEW.csv identifies unchanged inherited review versus changed/new source. Tests and scripts were inspected selectively, not represented as a line-by-line review of every test fixture.

The unchanged fork passes its suite: **324 tests, 322 pass, two platform skips, zero failures**. That does not establish the user's intended semantics: several passing tests deliberately assert that the plugin stops.

Seven fresh probes reproduced: idle-driven pause with zero turns; pause after two empty completions; unverified model-requested waiting; blocker count surviving intervening progress; `/goal help` parsed as a new goal; repeated dirty-file edits invisible to the Git marker; small-context pressure at one input token. The earlier seven integration/domain probes and 38 findings remain in the baseline report, with their version explicitly pinned. Do not describe all baseline probes as rerun against this fork.

No user incident log was available. These are verified code paths and controlled reproductions, not a claim to know which path caused a particular observed stop.

## 3. Why this fork can stop

The original design equates several failure observations with permission to suspend the entire goal. Unlimited token/turn budgets do not remove these other policies.

| Current mechanism | Evidence in fork | Effect | Relentless change |
|---|---|---|---|
| No observed progress | `runtime/progress.ts`, `closeObservedTurn` | Default three closures pause; Todo size raises this only to 4–12 | Strategy recovery, never automatic goal pause |
| Idle mistaken for a completed turn | Core calls the function on idle without a durable closed-turn cursor | Repeated idles can pause at zero completed turns | Account a unique logical attempt exactly once |
| Repeated blocker | `runtime/blocker.ts` | Third distinct report stops; not actually consecutive across intervening progress | Block requirement/task, retain goal scheduling |
| One model wait request | `opencode/plugin.ts`, `opencode_goal_wait_for_user` | Persists `waiting_user`; explicitly no autocontinue until user resumes | Report dependency only; host keeps scheduled checks and independent work |
| Two empty completions | `runtime/empty-turn.ts` | One retry, then paused | Recover request/session/model; unlimited lifetime attempts |
| Exhausted context | `opencode/host-limits.ts` | Failed or repeated compaction can pause | Fresh-session handoff with persisted contract and receipts |
| Provider limits/errors | `runtime/limits.ts`, host/recovery wrappers | Some retry; quota/fatal classifications suspend | Durable availability watch with bounded retry intervals; no discarded goal |
| Lost dispatch outcome | `opencode/plugin.ts`, `sdkPrompt` | Resolved SDK error unchecked; hung promise retains dispatch token | Normalize results; deadline and reconcile acceptance before replay |
| Child/compaction/steering wake gaps | Task deferral, compaction continuation, ownership wrappers | Goal says active but nothing schedules work | Durable wake obligations plus periodic reconciliation |
| Restart and concurrent writes | Recovery barrier, sequential restore, independent stores | One failed/hung operation can prevent recovery or lose a transition | Transactional state owner, outbox, per-goal leases and fair recovery |
| Inaccurate progress | `opencode/shell-progress.ts` | HEAD + porcelain strings miss content changes in already-dirty files | Content/diff evidence; activity never grants stop permission |
| Small local model context | `runtime/model-context.ts` | Minimum reserve 8192 exceeds a 4096-token window | Capacity-aware reserve; diagnose impossible prompt fit and route recovery |
| Weak completion judgment | Semantic verifier accepts corroborated real quotations as supporting claims | True quotation can still fail to entail success | Authoritative criterion-specific verification and honest unknown state |
| Proof loss or stale proof | Last-28 verifier evidence, last-500 merge, absent workspace fence | Valid work cannot prove completion, or stale work can be falsely completed | Requirement-indexed evidence and snapshot-fenced finish |
| Explicit user controls | Pause/clear, finite budgets, denied permissions | Intentional boundary | Preserve user authority; never conflate with success |

Detailed baseline IDs A1–E3 cover 38 findings, including check-process timeout escalation, optional toast blocking, lock-cleanup crashes, shallow schema validation, ownership expiry, plan truncation, cadence miscount, installer rollback, and version compatibility. Those findings distinguish reproduced behavior, direct code findings, and timing hypotheses; they are not 38 observed user incidents.

Additional current-fork details:

- Empty detection is event-order sensitive: meaningful parts are kept in a 256-entry in-memory cache. A completion arriving before its part updates can look empty. Reconcile persisted message parts before making strategy decisions; never stop the goal on this heuristic.
- Proactive context management and no-op save suppression are useful upstream improvements, but neither creates a general liveness supervisor.
- Runtime fingerprints improve diagnostics. They are not proof of trusted execution: environment-supplied build identity and mutable local files are not attestations.
- Todo drift warnings are advisory. A cancelled/deleted Todo never cancels the associated contract requirement.
- `waitForUserGoal` clears infrastructure recovery metadata as it sleeps. Under the requested semantics this removes precisely the wake intent we need to preserve.

## 4. State model: the goal survives the worker

Replace a single overloaded status with separate records:

| Record | Important fields |
|---|---|
| Goal contract | ID, immutable revision, objective verbatim, interpretation, criteria IDs, constraints, oracle definitions/hashes, user control epoch |
| Goal lifecycle | `open`, `verified`, `cancelled` |
| User run instruction | `enabled`, `paused_by_user`; optional explicit user resource policy |
| Execution phase | `queued`, `running`, `verifying`, `recovering`, `waiting_capacity`, `waiting_dependency` |
| Attempt | Attempt ID, executor session, lease epoch, dispatch ID, accepted message ID, deadlines, heartbeat, outcome |
| Wake obligation | Goal/revision, due time, reason, dependency key, retry count, delivery acknowledgement |
| Evidence | Criterion ID, contract revision, snapshot identity, verifier identity/version, captured result, freshness policy |

A waiting phase is **nonterminal and always scheduled**. The model has no API to disable the goal. Reports of missing input become dependency records. If there is nothing independently actionable, the supervisor schedules another dependency check/attempt at the configured cadence. It never silently turns a wait into an indefinite event-only subscription.

All finite limits must be explicitly user-selected. Default lifetime attempts, tokens and runtime are unbounded. Backoff controls the interval between attempts, not the total number. Honor provider retry-after signals. Escalating recovery may switch among permitted configured models, refresh sessions, or repair context; it must never relax the goal or bypass access controls.

An impossible task uses this same lifecycle. It may cycle forever without progress. Show that honestly instead of inventing progress percentages. Do not add a hidden “unsatisfiable” stop or an automatically lengthening delay that tends toward never running again.

## 5. Supervisor architecture

The TUI is a view and controller. A single supervisor owns state transitions. A separate service is required for execution to survive TUI/host exit; an in-process plugin alone cannot provide that property.

### Transactional scheduling

Use a local transactional journal, preferably SQLite with an explicitly tested durability configuration. Commit the state transition and pending dispatch/wake in one transaction. An outbox worker delivers the dispatch, records its receipt, and reconciles ambiguous acceptance. A crash between persistence and transmission leaves work deliverable; a crash after transmission must not blindly duplicate it.

Use per-goal leases with fencing epochs, not a bare `dispatching` boolean. An expired lease does not prove a previous worker stopped. Reconcile/abort the old worker and fence stale callbacks before allowing new mutations. An old session's late completion cannot finish a new revision.

Scan all enabled open goals on startup and periodically. Host events accelerate the scan; they are not its only trigger. Every goal must have one of: live leased work, durable next wake, or a visible explicit user restriction. A scanner repairs missing wake records. Timers are disposable caches of durable due times.

A dispatcher must handle rejected promises, resolved SDK error objects, malformed success responses, accepted-but-unacknowledged requests, and promises that never settle. Track transport acknowledgement separately from actual assistant progress. Use monotonic elapsed time inside a process, durable wall-clock due times across restarts, and handle wall-clock jumps conservatively.

Recover each goal independently with bounded concurrency and fair scheduling. One hung goal must not block all other goals. Recover stale children by querying host state; completion of the last child creates a parent wake in the same transition. Compaction and steering barriers need owner IDs, deadlines, and recoverable states.

### Recovery ladder

1. Reconcile the current attempt, outstanding tools, children, and permission requests.
2. Repair missing dispatch/wake delivery and transient transport problems.
3. Use unmet criteria and failed-approach history to choose another permitted strategy.
4. Compact with model-specific headroom, then hand off to a fresh session if needed.
5. Try a configured compatible fallback model/endpoint; retain the same contract and verifier trust boundary.
6. Continue independent requirements; schedule repeated checks of unavoidable dependencies.
7. Repeat indefinitely while enabled. No exhaustion threshold changes lifecycle or run instruction.

Provider authentication failure is a real capacity problem, not success. Avoid repeatedly sending a known unauthorized action: keep a scheduled availability/dependency check, expose the exact missing input, and retry execution when permitted. User stop remains immediately available, even while the provider or a tool is stuck.

### Long-run details that “forever” exposes

- Bounded in-memory caches cannot serve as permanent deduplication or proof ledgers. Persist identities and compact journals without discarding current obligations.
- Partition/archive attempt logs. Pin current criteria, action receipts, and evidence still needed by the verifier. Retention must not invalidate success history silently.
- Detect disk full, corrupt records and migrations explicitly. Restore from validated snapshots plus journal; never skip an unreadable open goal and call recovery complete.
- Use process-tree cancellation with escalation for hung verification commands. A deadline without termination is not recovery.
- Keep UI notifications off the critical execution path. A stuck toast cannot freeze the scheduler.
- Persist action receipts for external side effects. Exactly-once effects across arbitrary systems cannot be promised; use target-supported idempotency and reconcile uncertain outcomes before retry.
- Do not reset unrelated user work during recovery. Worktree checkpoints belong to a specific goal and branch.
- Service restart, sleep/wake, network flaps, host upgrades and executable availability all need visible reconciliation.

## 6. Completion that the executor cannot talk its way around

### Freeze meaning

Store original text and user-approved interpretation separately. Every criterion gets an ID and authoritative verification method. The worker may propose clarification or a contract revision; only a user control can activate it. Revision changes show a diff and invalidate affected evidence. They do not retroactively make the old goal complete.

The executor must not be able to modify its own judge. Put the canonical contract, verifier definitions and receipts in a supervisor-controlled store outside the writable worktree. An ordinary checksum in a directory the model can edit is not protection. For a strong boundary, run the worker under a separate OS identity/sandbox with no write access to that store or the supervisor socket's privileged operations. Enforce this for shell tools too, not just editor hooks.

### Verification levels

| Criterion | Completion evidence | What does not suffice |
|---|---|---|
| Arithmetic proposition | Protected evaluator or checked formal proof using fixed definitions | Model confidence; altered arithmetic; printed equation |
| Software behavior | Trusted tests/property checks against an immutable candidate snapshot | Agent-edited tests alone; exit 0 from an unrelated command |
| Deployment/API result | Read-back from the authoritative target, resource ID and freshness | “Deployment succeeded” in a local note |
| File/content requirement | Actual file content/object hash and required predicate | Filename existence for broader behavioral claims |
| Visual behavior | Defined browser scenario and observable assertions; user acceptance for subjective taste | Screenshot existence; an LLM saying “looks good” |
| Broad semantic objective | Explicit criterion decomposition, evidence, outstanding uncertainty | A second model's blanket verdict |

A semantic reviewer can challenge proof and detect gaps, but cannot override a failing deterministic criterion. Missing/unknown evidence stays unproven. If no trustworthy oracle exists for a criterion, strict mode cannot honestly certify it automatically; it stays open unless the user explicitly chooses an appropriate acceptance method.

### Atomic finish

Freeze candidate snapshot S and contract revision R. Run authoritative checks outside the worker's mutable environment, record evidence bound to S/R, and verify every criterion and constraint. Recheck the user control epoch and snapshot before committing `verified` in a transaction. Any changed candidate, contract, cancellation, or late stale event rejects the commit. A passing finish may remain historically true for S even if later user edits change the workspace; display that distinction.

Use a paged evidence index by criterion, not last-N prompt records. Temporal requirements such as “perform three separate turns” use a durable logical-attempt ledger. A file mutation fingerprint or three shell commands is not three turns.

## 7. Developer experience: stop making users memorize a parser

### Host research

OpenCode source examined: `anomalyco/opencode` commit `d870e22c70f27103016dcd479edcfebf86136d93`, plugin package version 1.18.31. This is a researched host snapshot, not a claim about Ryan's installed host version.

- The current plugin registers only `config.command.goal`; its parser has 21 action variants and no help action.
- The TUI entrypoint only registers a read-only sidebar slot.
- Host autocomplete collects registered server commands and TUI slash commands. It hides when whitespace occurs between `/` and the cursor. Consequently `/goal status` arguments do not get built-in nested suggestions.
- Current host TUI types expose `keymap.registerLayer`, slash command metadata, dialogs, routes and state. Legacy `api.command.register` is marked deprecated and bridged into keymap registration.
- No general argument-completion provider is exposed in the reviewed TUI API. Do not promise arbitrary native inline nested completions without a host change.

Sources: [custom commands documentation](https://opencode.ai/docs/commands/), [plugin documentation](https://opencode.ai/docs/plugins/), [autocomplete implementation](https://github.com/anomalyco/opencode/blob/d870e22c70f27103016dcd479edcfebf86136d93/packages/tui/src/component/prompt/autocomplete.tsx), [TUI API](https://github.com/anomalyco/opencode/blob/d870e22c70f27103016dcd479edcfebf86136d93/packages/plugin/src/tui.ts), [legacy bridge](https://github.com/anomalyco/opencode/blob/d870e22c70f27103016dcd479edcfebf86136d93/packages/tui/src/plugin/command-shim.ts).

### The primary experience

Typing `/goal` and Enter opens a searchable native action picker. If no goal exists, “New goal” is first. If one exists, show its title, run state, unmet criteria count and next action, followed by context-appropriate controls. No model call is needed to open menus, inspect status, pause, or stop.

Picker actions: New goal; View progress; View proof; Explain current wait/recovery; Pause or Resume; Stop; More (queue, history, settings, diagnostics). Search matches descriptions and familiar terms such as “why,” “audit,” and “help.” Every row states what it does. Disabled actions explain why.

Register explicit top-level shortcuts so the host's existing autocomplete can find them:

| Shortcut | Behavior |
|---|---|
| `/goal` | Action picker, or concise textual menu on hosts without rich UI |
| `/goal-new` | Goal form; optional objective text |
| `/goal-status` | Current goal, unmet criteria, activity, next scheduled action |
| `/goal-proof` | Criterion-by-criterion evidence and gaps |
| `/goal-why` | Exact current execution reason and recovery history |
| `/goal-pause` / `/goal-resume` | Explicit user run control |
| `/goal-stop` | Cancel this goal, retain history and work |
| `/goal-help` | Examples and searchable actions; never creates a goal |
| `/goal-doctor` | Host, provider, scheduler and migration diagnostics |

Preserve old subcommands as aliases during migration. Reserve known control words; a typo like `stats` should offer “status,” not silently create a replacement goal. Provide `/goal-new -- <literal objective>` for goals beginning with command words. Keep pasted multiline objectives literal and move options into form fields or a structured goal file.

TUI controls should call typed host operations through the supported SDK/command hook bridge; they must not write state files directly. Server validates user origin, goal ID, revision and control epoch. One command schema should generate parser validation, menu labels, shortcut registration, help text and CLI completion definitions.

### New goal form

Two primary fields: **What must be true?** and **How will we verify it?** Let the developer paste a specification. Display original text unchanged; suggested criteria remain visibly suggested until adopted. Offer project-detected test commands as choices, never as complete proof of unrelated claims.

“Continue until verified” is the default policy. Advanced settings hold optional explicit budgets, model choices, dependency cadence, and supervisor scope. If no objective completion method exists, say “This criterion has no automatic proof method yet”; permit starting work while keeping it unproven. Do not pretend every goal becomes objectively decidable merely by filling a form.

### Active goal view

Use a compact terminal panel, not a large dashboard: goal title; state; `2 of 4 criteria verified`; current attempt; next scheduled action; current branch. Expand proof, attempts or diagnostics on demand. Counts reflect verified criteria, not a model-invented overall percentage.

Example recovery text: “Provider returned no content. Attempt 18 ended. Fresh-session attempt scheduled in 15s. Goal remains open.”

Example impossible goal: “0 of 1 criteria verified. Integer evaluator returned false. Goal remains enabled. Next attempt in 30s.” This is explanatory copy for a proposed cadence, not an imposed delay policy.

Example dependency: “Deploy check needs an authorized production session. Other required tests continue. Connection check scheduled in 60s.” Never label that completed or quietly stop scheduling.

### Proof view

Rows show criterion, status (`unproven`, `checking`, `verified`, `stale`), proof method, and captured candidate revision. Expanding a row reveals actual result, timestamp, source and failure details. “Implemented” and “verified” are separate. A model's completion request appears as an audit event, not a green checkmark.

### Interaction and accessibility

Native up/down, Enter and Escape; visible key hints; search; readable wrapping; no color-only status. Respect terminal theme and narrow widths. Escape closes a dialog without stopping work. User pause/stop is local and responsive even if the model hangs. Stopping preserves changes and receipts; restarting is explicit. Keep advanced queue editing out of the first-run path. Text/JSON status parity supports headless users and automation.

On startup capability-detect rich TUI APIs. Prefer current keymap API, support legacy command API where present, and use registered textual shortcuts as fallback. Keep the same business operations underneath every surface. Do not claim compatibility across all `>=1.4.0` hosts until exercised in the matrix.

## 8. Ten features that could make developers choose this plugin

| # | Feature and developer payoff | Concrete design / first useful slice | Success test |
|---|---|---|---|
| 1 | **Goal command center** — discover actions without reading a manual | Native searchable `/goal` picker, context-aware actions, top-level autocomplete aliases, generated help | A new user starts, inspects and pauses a goal without guessing syntax; all controls work without an LLM |
| 2 | **Proof board** — know exactly what “done” means | Live criterion-to-test/artifact matrix; source results and stale indicators | Every green row opens authoritative evidence for the current candidate |
| 3 | **Always-on goal runner** — close the terminal without losing the task | Optional installed supervisor service, durable outbox, reconnectable TUI, user stop | Kill TUI/host at each dispatch boundary; recover obligation without duplicate accepted effects |
| 4 | **Why is it doing that?** — make recovery understandable | Flight recorder, next-wake countdown, typed reason, redacted replay export | An active-but-idle incident yields a reconstructable cause instead of a vague status |
| 5 | **Strategy memory** — persistent work becomes smarter instead of repetitive | Record approach, observed outcome, failed criterion and next alternative across compactions | Repeated failure changes the attempted strategy while preserving the contract; no automatic give-up |
| 6 | **Fresh-session relay** — context loss stops being a task reset | Transfer exact contract, evidence index, worktree, unfinished plan and action receipts; fenced ownership handoff | Old session cannot mutate/complete after takeover; new session sees unfinished tail requirements |
| 7 | **Goal recipes** — create strong contracts quickly | Versioned bug-fix, migration, refactor and UI recipes with editable verification adapters; project detection | A recipe produces concrete observable criteria, not generic “all tests pass” theater |
| 8 | **Checkpoint lab** — try alternatives without losing good work | Goal-owned worktree checkpoints, diff comparisons, user-selected restore, candidate proof runs | Recovery preserves unrelated user edits and never resets the wrong worktree |
| 9 | **Dependency work graph** — keep useful work moving around blockers | Requirement-linked tasks, explicit dependency watchers and fair scheduling | One blocked deploy does not stop independent tests; blocked requirement still prevents completion |
| 10 | **Verification adapter kit** — extend objective truth beyond code files | Typed adapters for tests, browser assertions, APIs, formal checks and CI; provenance/freshness contract | A local “success” note cannot spoof a failed remote or browser assertion |

Additional polish backlog: first-run verifier preflight; stable goal IDs across sessions; semantic search of history; notifications only for meaningful transitions; import/export of contracts; dry-run installer; one-command diagnostics; visible provider/model compatibility; explicit cost rate without hidden lifetime limits; copyable repro commands; keyboard-accessible queue; diff of contract revisions; localized labels generated from the same schema; command typo repair; CI/headless output with stable reason codes. These supplement the ten feature designs, not replacements for core reliability.

## 9. Implementation plan on this fork

| Increment | Files/components | Reviewable outcome and gate |
|---|---|---|
| 1. Make stopping explainable | Typed reasons, telemetry around all existing transitions; preserve existing behavior initially | Every automatic stop and active/no-wake state appears in a replayable trace |
| 2. Lock goal semantics | Contract revision/oracle ownership, separate user control from model reports | Impossible arithmetic never completes; worker cannot change contract or verifier |
| 3. Build durable supervisor | Shared transactional state, outbox, attempt IDs, leases, scanner, normalized SDK results | Crash/reorder/drop-event tests preserve next attempt; duplicate idle is harmless |
| 4. Replace surrender policy | Progress/blocker/empty/overflow and waiting paths | No automatic pause in persistent mode; no retry cap; every wait has a due time |
| 5. Make proof trustworthy | Evidence index, protected verification, snapshot-fenced finish, logical cadence ledger | Failed, stale, irrelevant or tampered proof cannot complete |
| 6. Ship command redesign | Shared schema, picker, aliases, forms, read-only views and headless parity | `/goal`, `/goal-help`, typo paths and multiline specs behave predictably across host versions |
| 7. Add service and relay | OS service packaging, independent recovery, session handoff, fair multi-goal scheduling | Host/TUI restarts recover; explicit stop fences late workers |
| 8. Rename and migrate release | Package/bin/server/TUI IDs, installer markers, README, publishing configuration | Existing upstream config migrates once, backs up/rolls back, preserves goals, never double-loads |

Do not merely increase stall thresholds or add “never stop” to prompts. Do not ship the UX first and call the reliability problem fixed. Keep production commits narrow; retain existing useful verification and host integrations while moving scheduling authority into one component.

## 10. Acceptance tests for the promise

**Safety:** false fixed arithmetic oracle across thousands of attempts; forged semantic success; modified judge; cancelled Todo; stale revision; unrelated passing tests; candidate changes during verification; adversarial instructions inside project files; late finish after user stop. All must remain unverified or cancelled as appropriate.

**Liveness:** dropped/duplicated/reordered events; idle with zero turns; resolved SDK error; hung prompt; accepted request with lost receipt; last child completes without parent idle; lost compaction callback; slow bootstrap; one hung goal among many; process death during each transaction/outbox step; lease owner dies; clock jumps; disk full; restart after weeks; empty model outputs and impossible goal across a large simulated attempt count. Enabled goals retain scheduled obligations and resume when prerequisites recover.

**User authority:** pause and stop race with dispatch and completion; explicit budgets; permissions denied; natural-language discussion that should not mutate the contract. A permission problem never licenses bypassing it, and no model-generated “user asked” claim is accepted as a privileged user command.

**DX:** new user discovers actions; `/goal help` never creates a goal; command-word objectives can be entered literally; multiline paste preserves text; terminal width 40/80/120 columns; keyboard-only controls; command collisions; supported current/minimum/legacy host versions; rich TUI absent; multiple installed plugins; migration failure halfway through config writes.

Add state-machine/property tests that enforce the invariants over generated traces, bounded model checking of the supervisor protocol, deterministic fault injection, and real-host soak tests with representative configured providers. These establish increasingly strong evidence; no finite test establishes infinite robustness.

Proposed measurable release gates: zero lost obligations in fault-injection traces; zero false completions in the adversarial oracle suite; no duplicate active fenced owner; restart reconciliation within a documented bound under healthy dependencies; user stop responsive independently of model calls; every waiting goal exposes a next scheduled check. Publish the tested host/provider matrix and fault model alongside the claim.

## Decision

Build **OpenCode Relentless** around an immutable success contract, a durable supervisor, and visible proof. Preserve the user's exact requirement: failure and impossibility do not release the obligation to keep trying. Make `/goal` the friendly front door to that machinery, not a hidden command language.
