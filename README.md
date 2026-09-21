# OpenCode Relentless

**Keep working. Prove the finish.**

Relentless keeps an OpenCode goal in effect through failed attempts, empty responses and provider outages, with automatic recovery and discoverable commands. Forked from [ByBrawe/opencode-goal](https://github.com/ByBrawe/opencode-goal), with the upstream MIT license and history preserved.

**Development beta: 2.0.0-beta.1. Not published to npm.** The implementation lives on `feat/relentless`. See [implementation status and limits](docs/relentless/IMPLEMENTATION.md) before using it for unattended work.

## Try this branch locally

```sh
git clone --branch feat/relentless https://github.com/darkmatter2222/opencode-goal.git
cd opencode-goal
npm ci
npm run build
```

In your OpenCode configuration, replace the upstream plugin entry with the absolute local package directory (a `file:///.../opencode-goal` package URL). Do not load both implementations. Keep a backup of your configuration. Restart OpenCode completely. The package root exports the server plugin; rich TUI entrypoint discovery depends on your OpenCode version.

For a source checkout, use the local package URL. **Do not run the installer yet against the npm registry:** it pins `@darkmatter2222/opencode-relentless@2.0.0-beta.1`, which is not published. The installer migration is implemented and tested for a future package release.

## Start with a goal

```text
/goal Fix checkout retries without duplicate charges --check "npm test"
```

New goals use persistent mode by default. They stay enabled through no-progress streaks, repeated blockers, empty model responses and infrastructure errors. Failed verification keeps the goal open. Explicit user pause/stop, finite budgets and OpenCode permissions still apply.

Existing stored goals retain their previous policy; migration does not silently resume paused or blocked work. The lower-level core/domain API retains its legacy defaults; the public plugin enables persistence. Plugin option `persistent: false` opts into the upstream bounded policy for new goals.

## Learn everything inside OpenCode

| Command | Purpose |
|---|---|
| `/goal` or `/goal help` | Commands, descriptions and usage |
| `/goal help edit` | Syntax and an example for one action |
| `/goal-menu` | Native searchable picker, when supported; selects a command for your prompt |
| `/goal-new -- <objective>` | Explicit literal objective, including command-like words |
| `/goal-status` | State, requirements, and recovery deadline |
| `/goal-edit <objective>` | Revise the objective while preserving unspecified checks and constraints |
| `/goal-pause` / `/goal-resume` | Explicit run controls |
| `/goal-stop` | Archive and stop pursuit; retain your project files |
| `/goal-retry` | Reconcile recovery without duplicating active work or shortening provider backoff |
| `/goal-why` | Current reason and next automatic action |
| `/goal-proof` | Requirement/evidence audit |
| `/goal-attempts` | Recent host observations and checkpoints |
| `/goal-doctor` | Storage integrity diagnosis |

Type `/goal-` for native shortcut suggestions. Existing forms such as `/goal pause`, `/goal contract`, `/goal queue`, `/goal history` and `/goal budget` remain available. Status/help/control responses request no model reply. Host support for the command hook's `noReply` behavior is required.

## Recovery

Transport failures use exponential retry intervals starting at 15 seconds and capped at five minutes, with equal jitter and no lifetime retry count. Provider `Retry-After` received with SDK dispatch failures is honored. A periodic scanner rechecks persisted active goals every five seconds and reconciles host status before requesting work. SDK waits have deadlines, and dispatch leases guard concurrent plugin instances.

A model dependency report schedules another check instead of putting a persistent goal to sleep. The plugin never changes permissions or credentials to get around a blocker.

## Keep the host running

```sh
# Set OPENCODE_SERVER_PASSWORD securely in your environment first.
node bin/opencode-relentless-runner.js --directory /absolute/project/path --port 4097
```

The runner starts an authenticated loopback `opencode serve` process and restarts it after crashes. Connect your OpenCode TUI to that server using its attach command and the same server credentials. Install/configure this plugin in the target project before starting the runner.

Run the command under systemd, launchd or Windows Task Scheduler for restart after logout/reboot. It does not install an OS service automatically. Set `OPENCODE_EXECUTABLE` to the native OpenCode executable if it is not on PATH; on Windows use the native `.exe`, not a shell `.cmd` wrapper. Ctrl+C stops the runner/host; persisted goals remain saved for the next start.

## Verification

Host checks and file evidence remain separate from semantic review. Required evidence is retained, Git content changes during an audit reject completion, and exact integer equations such as `1 + 1 = 3` receive a deterministic arithmetic verdict. A false supported equation cannot pass because a model says it is true.

These checks are **not a universal proof oracle or a security sandbox**. Broad semantic objectives still depend on the configured verifier. An executor with unrestricted shell access can alter local state or test definitions. Strong OS isolation, immutable external contracts and authoritative external verification adapters remain separate work described in the implementation status.

## Development

```sh
npm run check
npm test
npm run eval
npm run package:smoke
```

Tests cover persistent failure sequences, impossible arithmetic, dropped wakes, provider error envelopes, explicit pause/stop, aliases and help, plus upstream compatibility behavior. The release workflow is manual and publishes only to the `beta` tag after validation; no package was published by this development change.

- [Implementation status](docs/relentless/IMPLEMENTATION.md)
- [Architecture and ten feature designs](docs/relentless/DESIGN.md)
- [Command and continuity specification](docs/relentless/COMMANDS-AND-CONTINUITY.md)
- [Original source audit](docs/relentless/baseline-1.3.31/AUDIT.md)
