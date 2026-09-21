# OpenCode Relentless

### Persistent goals, automatic recovery, and completion checks for OpenCode

Relentless adds a persistent `/goal` workflow to your OpenCode coding agent. Describe the result you want, specify how to check it, and let the agent work across multiple turns. If an attempt fails or the provider disconnects, the plugin saves recovery state and schedules another eligible attempt.

**You decide the objective. The plugin tracks pursuit. Completion requires evidence.**

[![CI](https://github.com/darkmatter2222/opencode-goal/actions/workflows/ci.yml/badge.svg?branch=feat%2Frelentless)](https://github.com/darkmatter2222/opencode-goal/actions/workflows/ci.yml)
[![Release checks](https://github.com/darkmatter2222/opencode-goal/actions/workflows/release-readiness.yml/badge.svg?branch=feat%2Frelentless)](https://github.com/darkmatter2222/opencode-goal/actions/workflows/release-readiness.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Install](#install) · [Use it](#your-first-goal) · [Commands](#find-the-right-command) · [Recovery](#when-work-gets-interrupted) · [Documentation](#documentation)

> **About this repository:** `darkmatter2222/opencode-goal` is a fork of ByBrawe's Goal plugin. The Relentless implementation described here is on **`feat/relentless`**, under review in [PR #1](https://github.com/darkmatter2222/opencode-goal/pull/1). Its package identity is **`@darkmatter2222/opencode-relentless`**, version **`2.0.0-beta.1`**. Use the source installation below for this development beta.

## Install

You need Node.js **20+**, Git, and OpenCode with a working model/provider configuration. The package declares OpenCode **1.4.0+** and plugin API **1.4.0–1.x** compatibility. Menu support depends on your host's TUI API.

**1. Clone and build.** Run in your terminal, using Bash or PowerShell:

```sh
git clone --branch feat/relentless https://github.com/darkmatter2222/opencode-goal.git
cd opencode-goal
npm ci
npm run build
node -e "console.log(require('node:url').pathToFileURL(process.cwd()).href)"
```

**2. Register the plugin.** Copy the URL printed by the last command into the `plugin` array in your OpenCode configuration, such as `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-goal"]
}
```

Use your generated URL, not the placeholder. On Windows it will look like `file:///C:/src/opencode-goal`. Keep your other settings and plugins. If you already use `@bybrawe/opencode-goal`, replace that entry: both plugins own `/goal` and must not be loaded together.

**3. Restart OpenCode completely.** Open the project you want the agent to work on, then enter:

```text
/goal help
/goal doctor
```

The first command explains usage; the second checks storage integrity and recovery configuration. Relentless uses your OpenCode provider setup, including a local model if that setup supports the required tools and verifier requests. It does not install a model or supply credentials.

[More installation help, updates, and rollback →](docs/guides/INSTALLATION.md)

## Your first goal

The simplest form is an objective in plain language:

```text
/goal Explain how authentication works in this project
```

For code changes, add a concrete completion check. In a project with an `npm test` script:

```text
/goal new Fix the login redirect loop --check "npm test"
```

The agent works toward the objective. When it attempts completion, the plugin runs required checks and evaluates the evidence. A failed or missing requirement keeps the goal unverified.

Use these controls as you work:

| During the task | Enter |
|---|---|
| See the goal's state and recovery timing | `/goal status` |
| Understand why it is waiting | `/goal why` |
| Inspect the exact objective and requirements | `/goal contract` |
| Read recorded verification evidence | `/goal proof` |
| Pause autonomous pursuit and keep the goal | `/goal pause` |
| Enable a saved goal again | `/goal resume` |
| Cancel pursuit and archive the goal | `/goal stop` |

Pause and stop preserve project edits; they are not rollback commands. Running tools may take time to cancel. A new goal cannot silently replace an unfinished one.

## Make “done” specific

A good goal describes an observable result and supplies checks appropriate to the project.

```text
/goal new Fix expired-token handling --accept "Expired tokens return HTTP 401" --constraint "Keep the public response schema unchanged" --check "npm test"
```

| Option | What it adds | Example |
|---|---|---|
| `--accept` | An acceptance criterion for semantic review | `--accept "Empty input returns a clear error"` |
| `--constraint` | A boundary the solution must respect | `--constraint "Do not change the public API"` |
| `--check` | A command that must exit successfully | `--check "python -m pytest"` |
| `--file` | A file that must exist | `--file docs/setup.md` |
| `--contains` | Required text within a file | `--contains "docs/setup.md::Troubleshooting"` |

Quote values containing spaces. Repeat these options for multiple requirements. Use commands and paths that actually exist in your project.

**Refactor with two checks:**

```text
/goal new Remove duplicate retry logic --constraint "Preserve retry counts and timeout behavior" --check "npm test" --check "npm run build"
```

**Create a contributor guide:**

```text
/goal new Write a local setup guide for new contributors --file docs/setup.md --contains "docs/setup.md::Troubleshooting"
```

**Revise an existing goal:**

```text
/goal edit Fix expired-token handling and add regression coverage
/goal contract
```

Editing preserves unspecified checks, constraints, and acceptance criteria. Supplying a group replaces that group; completion evidence must satisfy the revised goal.

**Use literal text:**

```text
/goal-new -- Document the application's --help output
```

Everything after `--` is objective text. To use verification flags, put them in a normal `/goal new …` command instead. [Full syntax and multiline behavior →](docs/guides/COMMANDS.md)

## Find the right command

You should not need to memorize the command reference:

- **`/goal`** shows usage.
- **`/goal help edit`** explains one action with an example.
- **Type `/goal-`** to discover separate shortcuts, such as `/goal-status` and `/goal-pause`.
- **`/goal-menu`** opens a searchable picker on compatible TUI hosts. It inserts a command for review before you submit it.

There are 20 catalog commands. The remaining controls cover inspection and longer workflows:

| Task | Command |
|---|---|
| Inspect recent progress notes | `/goal attempts` |
| Check whether this session's recovery is due | `/goal retry` |
| Show or adjust resource limits | `/goal budget` |
| Queue another objective | `/goal add <objective>` |
| Inspect the queue | `/goal queue` |
| Activate the next eligible queued goal | `/goal next` |
| Inspect archived goals | `/goal history` |
| Restore an unfinished archive as paused | `/goal restore <goal-id>` |
| Inspect saved goals across project sessions | `/goal list` |
| Diagnose storage and recovery | `/goal doctor` |

Existing user-defined shortcuts are preserved; use `/goal <action>` when an alias is already taken. Nested argument autocomplete is not supported on every host.

[All commands, shortcuts, and examples →](docs/guides/COMMANDS.md)

## Queue work and set limits

Add a follow-up without replacing your current goal:

```text
/goal add Document the behavior changed by the current fix --file docs/behavior.md
/goal queue
```

Queue activation requires the current goal to be completed or absent and the execution context to permit it. `/goal next` does not discard unfinished work or create concurrent goals.

New goals have unlimited plugin budgets by default (`0`). Set an explicit limit when you want one:

```text
/goal budget --max-turns 30
```

A reached limit stops autonomous pursuit without declaring success. Inspect `/goal budget`, then deliberately increase or remove the limit to allow more work. Other options include `--max-tokens`, `--max-minutes`, and `--max-cost`; cost accuracy depends on host telemetry.

## When work gets interrupted

| Situation | Implemented behavior |
|---|---|
| No progress, empty responses, or repeated blockers | New persistent goals schedule another attempt instead of treating the failed attempt as completion. |
| Recoverable provider or transport failure | Recovery uses saved deadlines and exponential backoff with jitter. |
| Provider asks the client to wait | Supported provider cooldowns survive resume, edit, and later recovery observations. |
| An idle event is missed | A periodic scanner checks eligible saved goals against host status. |
| OpenCode restarts | Saved eligible goals can recover when the host and execution context are available. |
| You pause or stop | Explicit controls take priority over autonomous pursuit. |

`active` can mean **waiting for recovery**, not currently generating tokens. `/goal why` explains the next action. `/goal retry` respects deadlines and busy sessions; it does not bypass a cooldown or resume a paused goal. Repeated `/goal resume` on an already-active goal does not start a duplicate request.

For process supervision, the repository also includes `bin/opencode-relentless-runner.js`. It runs an authenticated loopback OpenCode host and restarts that host after failures. Configure its password, attach to that same server, and use an OS service manager if you need operation across logout or reboot. [Runner setup and operations →](docs/guides/OPERATIONS.md)

### What persistence does—and does not—mean

Goals are saved; execution still needs a running host, usable storage, provider access, and permissions. The plugin cannot work while the machine is off. Existing upstream goals retain their prior policy rather than being silently converted or resumed.

Completion checks improve confidence, but semantic review remains fallible. Supported exact integer equations use deterministic arithmetic, so `1 + 1 = 3` stays unverified. Local state and executable tests are not immutable external proof, and dispatch leases do not guarantee exactly-once external actions.

[Recovery rules and verification limits →](docs/guides/RELIABILITY.md) · [Troubleshooting →](docs/guides/TROUBLESHOOTING.md)

## Documentation

| Guide | Covers |
|---|---|
| [Installation](docs/guides/INSTALLATION.md) | Setup, migration, updates, Windows paths, rollback |
| [Commands](docs/guides/COMMANDS.md) | Complete syntax, help, queues, history, budgets |
| [Troubleshooting](docs/guides/TROUBLESHOOTING.md) | Symptoms, diagnosis, and recovery actions |
| [Reliability](docs/guides/RELIABILITY.md) | Retry scheduling, verification, and limitations |
| [Operations](docs/guides/OPERATIONS.md) | Host supervision, configuration, state, backups |
| [Architecture](docs/guides/ARCHITECTURE.md) | Execution flow, module map, concurrency |
| [Roadmap](docs/guides/ROADMAP.md) | Proposed improvements, clearly separated from shipped behavior |

[Documentation index](docs/README.md) · [Changelog](CHANGELOG.md) · [Türkçe](README.tr.md)

## Contribute

The plugin is written in TypeScript. From the repository checkout:

```sh
npm ci
npm run release:check
```

The release check runs type checking, tests, adversarial evaluations, documentation validation, and packed-package installation checks. For documentation-only edits, run `npm run docs:check`. GitHub Actions adds platform, compatibility, and real-host coverage; use the live workflow results rather than historical test counts.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow. Report bugs in [GitHub Issues](https://github.com/darkmatter2222/opencode-goal/issues), with reproduction steps and relevant diagnostics. Follow [SECURITY.md](SECURITY.md) for sensitive reports.

## License

[MIT](LICENSE). Based on [ByBrawe/opencode-goal](https://github.com/ByBrawe/opencode-goal), with upstream attribution and history preserved. OpenCode Relentless is an independent community plugin.
