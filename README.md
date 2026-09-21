# OpenCode Relentless — Persistent AI Coding Goals

**An OpenCode goal plugin that keeps pursuing your task, retries interruptions, and checks evidence before accepting completion.**

[![CI](https://github.com/darkmatter2222/opencode-goal/actions/workflows/ci.yml/badge.svg?branch=feat%2Frelentless)](https://github.com/darkmatter2222/opencode-goal/actions/workflows/ci.yml)
[![Release readiness](https://github.com/darkmatter2222/opencode-goal/actions/workflows/release-readiness.yml/badge.svg?branch=feat%2Frelentless)](https://github.com/darkmatter2222/opencode-goal/actions/workflows/release-readiness.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Give your AI coding agent a clear objective with `/goal`. Relentless saves the goal, tracks progress, schedules recovery after failed attempts, and verifies completion against your requirements. Use it for bug fixes, refactoring, tests, and documentation in OpenCode.

```text
/goal new Fix the login redirect loop --accept "Signing in returns the user to their original page" --check "npm test"
```

**Status: development beta · `2.0.0-beta.1` · install from source.** This fork of `@bybrawe/opencode-goal` uses the package name `@darkmatter2222/opencode-relentless`. The instructions below do not depend on an npm release.

[Quick start](#quick-start) · [Examples](#copyable-goal-examples) · [Commands](#everyday-goal-commands) · [Troubleshooting](#understand-status-and-recovery) · [FAQ](#frequently-asked-questions) · [All docs](docs/README.md) · [Türkçe](README.tr.md)

## Why use this OpenCode plugin?

| You want to… | Relentless provides… |
|---|---|
| Keep an unfinished task moving | Persistent goals that schedule another attempt after stalls, empty responses, and repeated blockers. |
| Recover from provider interruptions | Saved retry deadlines, exponential backoff with jitter, and respect for provider cooldowns. |
| Define what “done” means | Acceptance criteria, constraints, executable checks, and required files. |
| Inspect the evidence | Requirement-by-requirement proof and a separate semantic completion review. |
| Stay in control | Pause, resume, stop, and explicit resource budgets. |
| Learn commands inside OpenCode | Contextual help, 20 slash-command shortcuts, and a searchable picker on compatible hosts. |
| Line up more work | A goal queue, archived history, and restoration of unfinished goals. |

New goals stay enabled until verified or explicitly controlled. **Execution still requires a running host, usable storage, provider access, and host permissions.** Finite budgets remain authoritative; model-based verification can be wrong. See [how recovery and verification work](docs/guides/RELIABILITY.md).

## Quick start

### 1. Build the plugin

You need **Node.js 20+**, **Git**, and **OpenCode with a working model configuration**. The declared compatibility floor is OpenCode/plugin API 1.4.0; native menu support depends on the host.

Run these commands in your terminal. They work in Bash and PowerShell:

```sh
git clone --branch feat/relentless https://github.com/darkmatter2222/opencode-goal.git
cd opencode-goal
npm ci
npm run build
node -e "console.log(require('node:url').pathToFileURL(process.cwd()).href)"
```

The last command prints the plugin's absolute `file://` URL. Copy it for the next step.

### 2. Add it to OpenCode

In your OpenCode `opencode.json` or `opencode.jsonc`, add the printed URL to the `plugin` array:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-goal"]
}
```

- **Windows:** the generated URL looks like `file:///C:/src/opencode-goal`.
- **Linux/macOS:** it looks like `file:///home/you/src/opencode-goal` or `file:///Users/you/src/opencode-goal`.
- **Already using Goal?** Replace the `@bybrawe/opencode-goal` entry. Do not load both plugins.
- Preserve your other plugins and settings. Point to the **package directory**, not a source file.

For example, if you use `~/.config/opencode/opencode.json`, edit its existing `plugin` array. [Installation, updates, migration, and rollback →](docs/guides/INSTALLATION.md)

### 3. Restart OpenCode and run a goal

Restart OpenCode completely, open the project you want to work on, and enter these commands in its prompt:

```text
/goal help
/goal doctor
/goal new Inspect this project and explain how to run its tests
```

Your goal is now saved and enabled. Inspect it or pause it with:

```text
/goal status
/goal pause
```

**Need to stop autonomous work?** `/goal pause` keeps the goal for later. `/goal stop` cancels pursuit and archives it. Neither command rolls back project changes; running tools may take time to cancel.

## Copyable goal examples

Use one example at a time. Replace commands and file paths with ones that exist in your project. A new goal does not silently replace unfinished work; use `/goal edit`, `/goal add`, or `/goal stop` first.

### Fix a bug and require passing tests

```text
/goal new Fix the login redirect loop --accept "Signing in returns the user to their original page" --constraint "Keep the existing public API" --check "npm test"
```

`--accept` defines the expected outcome. `--constraint` sets a boundary. `--check` requires a command to pass during completion verification.

### Refactor without changing behavior

```text
/goal new Refactor retry handling to remove duplicated logic --constraint "Preserve existing retry counts and timeout behavior" --check "npm test" --check "npm run build"
```

Repeat `--check` when more than one command must pass. Constraints become part of the goal contract; they do not create an OS sandbox.

### Add Python regression tests

```text
/goal new Add regression tests for expired session tokens --accept "Tests cover missing, expired, and valid tokens" --check "python -m pytest"
```

### Write documentation with a required file

```text
/goal new Document local development setup --accept "A new contributor can install dependencies and run tests using the guide" --file docs/setup.md --contains "docs/setup.md::Troubleshooting"
```

The file and text checks establish concrete requirements. A separate semantic review assesses whether the guide meets the broader objective.

### Put a limit on autonomous work

```text
/goal new Fix the failing tests --check "npm test" --max-turns 30
```

New goals default to unlimited plugin budgets (`0`). An explicit limit pauses autonomous pursuit at that limit; it does not mark the goal complete. Inspect or change limits with `/goal budget`. [All budget options →](docs/guides/COMMANDS.md#budgets-and-legacy-aliases)

### Queue the next task

While your current goal is running:

```text
/goal add Document the behavior changed by the current fix --file docs/behavior.md
/goal queue
```

When the current goal is completed or absent, `/goal next` can activate the next eligible item. Queuing does not start concurrent goals or discard unfinished work.

## Everyday `/goal` commands

| What you need | Command |
|---|---|
| Learn the basics | `/goal` or `/goal help` |
| Get syntax and examples for one action | `/goal help edit` |
| Start a task | `/goal new <objective>` |
| See current progress and recovery timing | `/goal status` |
| Understand why it is waiting | `/goal why` |
| Inspect completion evidence | `/goal proof` |
| Read the exact objective and requirements | `/goal contract` |
| Revise the current objective | `/goal edit <revised objective>` |
| Pause and keep the goal | `/goal pause` |
| Resume a saved goal | `/goal resume` |
| Check whether recovery is due | `/goal retry` |
| Cancel and archive the goal | `/goal stop` |
| Inspect or change resource limits | `/goal budget` |
| Diagnose storage and recovery | `/goal doctor` |

**Prefer separate slash commands?** Type `/goal-` to discover shortcuts such as `/goal-new`, `/goal-status`, and `/goal-pause`. Existing user-defined shortcuts are preserved. Use `/goal <action>` if a shortcut name is already taken.

**Prefer a menu?** On compatible TUI hosts, `/goal-menu` opens a searchable picker and inserts your selected command for review. Nested argument autocomplete is not available on every host.

**Using a command-like word as your objective?** Use a literal delimiter:

```text
/goal-new -- pause
/goal-new -- Document the application's --help output
```

Everything after `--` is objective text, including any flag-looking words. Use a normal `/goal new … --check "…"` command when you want verification options parsed.

[Full reference: all 20 commands, flags, queues, history, and examples →](docs/guides/COMMANDS.md)

## Understand status and recovery

| What you see | What it means | What to do |
|---|---|---|
| `active`, with a retry deadline | The goal is enabled and waiting for its next eligible attempt. | Run `/goal why`; keep the host available. |
| `paused` | Autonomous pursuit is off. | Run `/goal resume` when ready. |
| `budget_limited` | An explicit resource limit was reached. | Inspect `/goal budget` and adjust deliberately. |
| Missing or failed proof | Completion has not been established. | Inspect `/goal proof` and the goal's requirements. |
| A storage integrity error | Saved state cannot be interpreted safely. | Run `/goal doctor`; back up state before repair. |

`/goal retry` checks **this session**. It does not bypass provider cooldowns, interrupt busy work, or resume a paused goal. Repeating `/goal resume` on an active goal does not launch a duplicate request. `/goal proof` displays recorded evidence; it does not rerun verification.

[More symptoms and fixes →](docs/guides/TROUBLESHOOTING.md)

## Frequently asked questions

### How is Relentless different from a normal OpenCode prompt?

A normal prompt asks the agent to respond or act. Relentless adds a saved goal contract, progress tracking, retry scheduling, completion checks, and explicit controls around that work.

### Does it keep working after OpenCode closes?

The goal remains saved, but the plugin needs a running OpenCode host to execute. The optional runner supervises an authenticated local host and can restart it after a crash. An OS service manager is needed for operation across logout or reboot. See [host supervision and operations](docs/guides/OPERATIONS.md).

### Can it guarantee that a goal is truly complete?

No general-purpose model verifier can guarantee that. Relentless requires its completion gate to pass, including declared checks, file evidence, and semantic review. Supported exact integer equations have a deterministic check: `1 + 1 = 3` remains unverified. Tests prove their own scope, and an executor able to rewrite its tests is not an independent authority. See the [verification contract and limits](docs/guides/RELIABILITY.md).

### Can I use it with a local model?

Relentless uses OpenCode's configured provider and model; it does not include a model or provider credentials. Your setup must support the tool use and verifier requests the plugin needs. A dedicated verifier can be configured with `OPENCODE_GOAL_VERIFIER_MODEL`. See [configuration](docs/guides/OPERATIONS.md).

### Will my existing Goal plugin state be changed automatically?

Existing goals retain their previous policy. Installing Relentless does not silently resume or convert old work. Follow the [migration guide](docs/guides/INSTALLATION.md#saved-goals-and-compatibility) to replace a legacy goal deliberately.

## Documentation and contributing

| Guide | Start here when you need… |
|---|---|
| [Installation](docs/guides/INSTALLATION.md) | Setup, Windows paths, updates, migration, or rollback. |
| [Commands](docs/guides/COMMANDS.md) | Every command, shortcut, verification flag, and budget option. |
| [Troubleshooting](docs/guides/TROUBLESHOOTING.md) | Explanations and fixes for unexpected behavior. |
| [Reliability](docs/guides/RELIABILITY.md) | Exact retry behavior, completion rules, and known limitations. |
| [Operations](docs/guides/OPERATIONS.md) | Host supervision, configuration, saved state, and backups. |
| [Architecture](docs/guides/ARCHITECTURE.md) | The execution flow, source map, and concurrency boundaries. |
| [Roadmap](docs/guides/ROADMAP.md) | Ten proposed improvements and their acceptance criteria. |

To develop and validate changes from the repository checkout:

```sh
npm ci
npm run release:check
```

This runs TypeScript checks, tests, adversarial evaluations, documentation validation, and packed-package installation checks. GitHub Actions also exercises Windows/Linux, Node versions, plugin compatibility, and real-host scenarios. The badges above show live workflow results.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes. Report bugs through [GitHub Issues](https://github.com/darkmatter2222/opencode-goal/issues); follow [SECURITY.md](SECURITY.md) for sensitive reports. See the [changelog](CHANGELOG.md) for changes.

## License and attribution

OpenCode Relentless is an independent community plugin built on [ByBrawe/opencode-goal](https://github.com/ByBrawe/opencode-goal), released under the [MIT license](LICENSE). Upstream attribution and repository history are preserved. No affiliation with OpenCode is implied.
