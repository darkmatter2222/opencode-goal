# Troubleshooting

[Documentation home](../README.md) · [Commands](COMMANDS.md)

Start with `/goal status`, `/goal why`, then `/goal doctor`. Keep the exact output: “active” means pursuit is enabled, not that a request is executing this instant.

| Symptom | Likely explanation | What to do |
|---|---|---|
| `/goal` is missing | Plugin not loaded, wrong package URL or host not restarted | Check configuration and build output; follow [installation](INSTALLATION.md). |
| `/goal-menu` is missing | Host lacks the required native TUI API | Use `/goal help` and `/goal-` shortcuts. |
| One shortcut is absent | A user-defined command already owns that name | Use its `/goal <action>` form; Relentless will not replace your command. |
| Active goal waits after an error | Saved retry deadline or provider cooldown | Read `/goal why`; keep the host available. Resume/retry do not bypass cooldowns. |
| Active goal waits without a retry reason | Host is busy, a delegated task is running, or a lease is held | Inspect OpenCode session/tool activity. Do not delete lock files to force concurrency. |
| Busy host never recovers | The host still reports an in-flight request | Investigate host health; use the runner for crash/unreachable-host recovery. A healthy-but-stuck busy session requires host-level intervention. |
| `budget_limited` | An explicit cumulative budget was reached | Inspect usage, then intentionally change the relevant limit with `/goal budget`. |
| `paused` persists | Autonomous pursuit is disabled | Use `/goal resume` when ready. Restarting alone must not override pause. |
| Goal pauses after ordinary stalls | It may be a saved legacy goal or bounded-mode configuration | Inspect the policy and [migration instructions](INSTALLATION.md); existing goals are not silently converted. |
| Completion rejected despite green tests | The full objective, constraints or other required evidence remain unproven | Inspect `/goal proof` and `/goal contract`; address the exact missing obligation. |
| Workspace changed during verification | The candidate differed between audit boundaries | Let changes settle and verify the current candidate again. |
| Verification unavailable | Verifier/provider configuration, credentials or transport failed | Check provider settings and the dedicated verifier model; recovery keeps the goal enabled. |
| Integrity error | Corrupt/unsupported state or an unsafe storage path | Back up files and run `/goal doctor`. Repair from known-good data; do not fabricate a completed snapshot. |
| New objective rejected | Another unfinished goal exists | Edit it, queue the new objective, or explicitly stop the current goal. |
| Impossible goal keeps retrying | Required proof cannot be satisfied | This is expected persistent behavior. Use pause/stop if you want pursuit disabled. |
| Work does not continue after closing the app | No host is executing the project | Keep the runner under an OS service manager; see [operations](OPERATIONS.md). |

## Provider outages and credentials

Retries repair transient availability failures. They cannot create credentials, grant permissions, pay a bill, repair a provider account or make an impossible objective true. Supply the missing prerequisite through normal OpenCode configuration. The saved goal and its requirements remain intact.

Provider `Retry-After` values received by continuation dispatch are retained as lower bounds. This is per-goal cooldown tracking, not a provider-wide circuit breaker across every OpenCode session or all your machines.

## A useful bug report

Include the package version, OpenCode version, OS, Node version, command used, expected result and observed result. Add redacted `/goal status`, `/goal why` and `/goal doctor` output plus the smallest reproduction. For recovery problems, include whether the host was restarted, whether it reports busy/idle/retry, and the deadline shown.

Remove credentials, private source, customer data and sensitive objective text from diagnostics. See [security boundaries](../../SECURITY.md) for sensitive reports. Never paste an entire provider configuration simply to demonstrate that credentials exist.
