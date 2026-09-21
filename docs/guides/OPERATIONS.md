# Running and operating Relentless

[Documentation home](../README.md) · [Troubleshooting](TROUBLESHOOTING.md)

## Two independent recovery layers

The plugin retries goal work inside a running OpenCode host. The runner supervises the host process. An OS service manager supervises the runner across logout, failure and reboot. Configure the layers you need; starting the plugin alone does not install the others.

```text
node bin/opencode-relentless-runner.js --directory /absolute/project --port 4097
```

| Setting | Purpose | Default |
|---|---|---|
| `--directory` | Project whose directory-scoped instance is initialized | Current directory |
| `--port` | Authenticated loopback server port | `4097` |
| `OPENCODE_SERVER_PASSWORD` | Required server password, supplied in the environment | None; startup refuses an absent password |
| `OPENCODE_SERVER_USERNAME` | Server authentication username | `opencode` |
| `OPENCODE_EXECUTABLE` | Native OpenCode executable to launch | `opencode` on PATH |
| `OPENCODE_GOAL_VERIFIER_MODEL` | Dedicated verifier model, in `provider/model` form | OpenCode `small_model`, then configured `model` |
| `OPENCODE_GOAL_VERIFIER_TIMEOUT_MS` | Positive verifier attempt timeout | Five minutes in the public plugin |

The runner binds `127.0.0.1`; it does not open a public listener. Supply credentials through your service manager or shell's environment mechanism. Do not put real secrets in a committed example. The runner does not print the password. Host logs and child processes are still governed by OpenCode's behavior.

On Windows, `OPENCODE_EXECUTABLE` must identify a native `.exe` if `opencode` resolves only to a `.cmd` shim. The runner uses `shell: false` and does not evaluate a shell command.

## Lifecycle

- Every five seconds, an authenticated directory-scoped request checks/initializes the owned host. Requests have a five-second deadline.
- Twelve successive unsuccessful health checks request a restart. The runner first sends termination, then escalates after five seconds.
- Host exit triggers jittered restart backoff: approximately 7.5–15 seconds initially, up to 2.5–5 minutes for repeated short failures.
- A host that stays alive for over a minute resets the short-failure streak.
- Ctrl+C or a termination signal stops the runner and its owned host. Goals remain saved; execution resumes only after a host is running again and the saved goal is eligible.

Attach your TUI to the **same** server using matching credentials. Confirm OpenCode's installed `attach --help` syntax for your version. Creating a goal in an unrelated standalone TUI does not automatically move it into the runner's live session.

## OS supervision

Use systemd on Linux, launchd on macOS, or Task Scheduler/a service wrapper on Windows. Set an absolute Node executable, runner path and project directory; configure credentials in that supervisor's protected environment. Enable restart-on-failure and capture stdout/stderr. Avoid supervising the same project/session with competing runner instances on the same port.

This repository does not claim a tested, universal service-install script. Test your own restart, logout and reboot behavior before relying on unattended operation.

## State and backups

| Location in the project | Contents |
|---|---|
| `.opencode/goals/<session-hash>.json` | Current goal, requirements, evidence, policy, usage and recovery metadata |
| `.opencode/goals/history/<session-hash>/` | Archived goal snapshots |
| `.opencode/goal-sequences/` | Ordered queued goal specifications and promotion state |
| `.opencode/goal-locks/` | Process-lock metadata; not proof or a user-editable control surface |

Pause work and stop the host before taking a consistent manual backup. Back up the goal and queue directories together, plus the project and relevant OpenCode configuration/session data. A project-state backup is not a backup of external effects such as deployments, payments or messages.

Use `/goal history prune --keep N` to intentionally remove older archives. Do not manually delete live state or locks merely to force a goal to proceed.

## Before unattended use

Try a disposable project with explicit checks. Verify provider access, pause/stop, retry behavior, host restart and your own external-action idempotency. Read the [reliability limits](RELIABILITY.md). Keep logs and identify how you will stop the actual host and any long-running tools.
