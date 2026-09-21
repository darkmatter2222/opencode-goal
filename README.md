# OpenCode Relentless

**Keep working. Prove the finish.**

[![CI](https://github.com/darkmatter2222/opencode-goal/actions/workflows/ci.yml/badge.svg?branch=feat%2Frelentless)](https://github.com/darkmatter2222/opencode-goal/actions/workflows/ci.yml)
[![Release readiness](https://github.com/darkmatter2222/opencode-goal/actions/workflows/release-readiness.yml/badge.svg?branch=feat%2Frelentless)](https://github.com/darkmatter2222/opencode-goal/actions/workflows/release-readiness.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Give OpenCode an objective. Relentless preserves it across turns, records progress, retries interruptions, and checks the evidence before accepting completion.

**Development beta · `2.0.0-beta.1` · source installation.** New goals stay enabled through stalls, empty responses, repeated blockers and provider failures. User controls, explicit budgets and host permissions remain authoritative. This is persistent pursuit with bounded retry intervals—not a promise of infinite uptime or infallible semantic verification.

[Install](docs/guides/INSTALLATION.md) · [Commands](docs/guides/COMMANDS.md) · [Troubleshooting](docs/guides/TROUBLESHOOTING.md) · [Recovery contract](docs/guides/RELIABILITY.md) · [Contribute](CONTRIBUTING.md) · [Türkçe](README.tr.md)

## A first session

```text
/goal Fix checkout retries without duplicate charges --check "npm test"
/goal status
/goal proof
/goal pause
/goal resume
```

Need help while coding? Type `/goal` for an explanation, `/goal help edit` for a specific example, or `/goal-` to discover separate slash-command shortcuts. On compatible TUI hosts, `/goal-menu` opens a searchable picker and inserts the selected command for you to review.

```text
/goal-new -- pause
```

That creates the literal objective “pause.” The `--` delimiter makes everything after it objective text; put verification flags in a normal `/goal new …` command instead.

## What improves the workflow

| Capability | What you get |
|---|---|
| Persistent pursuit | No-progress streaks and model-reported blockers schedule another attempt instead of surrendering. |
| Recovery | Saved retry deadlines, jittered backoff, provider cooldown preservation and a periodic idle-session scan. |
| Goal contracts | An objective plus acceptance criteria, constraints, file requirements and executable checks. |
| Evidence-backed completion | Fresh host checks, file evidence and separate semantic review; missing proof keeps the goal open. |
| Understandable controls | Contextual help, command aliases, recovery explanations, proof inspection and recent observations. |
| Queues and history | Prepare future goals, preserve their persistence policy, and restore unfinished archives as paused. |
| Host supervision | An authenticated loopback runner can restart its OpenCode server after crashes. |

## Install from this branch

Requires Node.js 20+ and OpenCode. The declared compatibility floor is OpenCode/plugin API 1.4.0; native menu availability depends on the host's TUI API.

```sh
git clone --branch feat/relentless https://github.com/darkmatter2222/opencode-goal.git
cd opencode-goal
npm ci
npm run build
node -e "console.log(require('node:url').pathToFileURL(process.cwd()).href)"
```

Use the printed absolute package URL in your OpenCode configuration, replacing the old Goal plugin entry:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-goal"]
}
```

Restart OpenCode completely, then run `/goal help` and `/goal doctor`. Preserve other settings and plugins in your configuration. Do not load upstream Goal and Relentless together. See the [installation guide](docs/guides/INSTALLATION.md) for Windows paths, updates, migration and rollback.

The source installer targets the new npm package identity, `@darkmatter2222/opencode-relentless`. Use the local package URL for this beta; do not assume that version has been published to npm.

## Know what is happening

| If you see… | It means… | Next action |
|---|---|---|
| `active` with a retry deadline | The goal is enabled and waiting for recovery. | `/goal why`; leave the host running. |
| `paused` | Autonomous pursuit is off. | `/goal resume` when you want it enabled again. |
| `budget_limited` | An explicit resource limit was reached. | Inspect `/goal budget`, then intentionally adjust it. |
| Unproven requirements | Completion has not been established. | `/goal proof`; gather or strengthen evidence. |
| An integrity error | The plugin cannot safely interpret saved state. | `/goal doctor`; back up state before repair. |

`/goal retry` reconciles **this session** when its saved wake is due. It does not skip provider cooldowns, interrupt busy work or resume a paused goal. Repeating `/goal resume` on an active goal does not launch a duplicate request.

## Keep a host available

Set `OPENCODE_SERVER_PASSWORD` securely in the environment, then:

```sh
node bin/opencode-relentless-runner.js --directory /absolute/project --port 4097
```

Attach your TUI to that server using matching credentials. The plugin must already be configured for the project. To survive logout/reboot, run the runner under your OS service manager. It does not install a service automatically. See [operations](docs/guides/OPERATIONS.md).

## Honest boundaries

- A goal remains saved when the host stops; it cannot execute while the host or machine is unavailable.
- Supported exact integer equations use deterministic arithmetic. `1 + 1 = 3` stays unverified, regardless of what a model claims.
- General natural-language goals still depend on fallible semantic review. Passing tests alone does not prove every broad objective.
- Local JSON state, Git comparisons and leases are not a security sandbox, an immutable oracle, or exactly-once protection for external actions.
- Existing saved goals keep their previous policy; migration does not silently resume old work. Explicit finite budgets still stop autonomous pursuit.

Read the [recovery and verification contract](docs/guides/RELIABILITY.md) and [implementation status](docs/relentless/IMPLEMENTATION.md) before unattended use.

## Develop and validate

```sh
npm ci
npm run release:check
```

The checks include TypeScript, unit/integration tests, an adversarial evaluation corpus, documentation consistency and installation of the packed package in a clean consumer. GitHub Actions additionally exercises Windows, Linux, Node versions, plugin compatibility and real-host canaries. Follow the live badges for the current commit; historical counts are not a release guarantee.

- [Documentation index](docs/README.md)
- [Architecture and source map](docs/guides/ARCHITECTURE.md)
- [Ten next-stage feature designs](docs/guides/ROADMAP.md)
- [Changelog](CHANGELOG.md) · [Security boundaries](SECURITY.md)

Built on [ByBrawe/opencode-goal](https://github.com/ByBrawe/opencode-goal). Upstream attribution, MIT license and repository history are preserved. Independent community plugin; no affiliation with OpenCode is implied.
