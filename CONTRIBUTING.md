# Contributing to OpenCode Relentless

[Documentation](docs/README.md) · [Architecture](docs/guides/ARCHITECTURE.md) · [Security](SECURITY.md)

## Local setup

```sh
git clone --branch feat/relentless https://github.com/darkmatter2222/opencode-goal.git
cd opencode-goal
npm ci
npm run build
```

Use a disposable project to try runtime changes. Point its OpenCode configuration at your local package URL; do not accidentally load both upstream Goal and Relentless.

## Checks

```sh
npm run check
npm test
npm run eval
npm run docs:check
npm run package:smoke
```

`npm run release:check` runs the complete local gate. The unit suite includes storage, concurrency, ownership, verification, persistent-mode regressions and bounded-mode compatibility. Evaluation exercises adversarial scenarios; package smoke packs and installs a clean production consumer.

Real-host canaries are separate from unit tests. They use deterministic fixture providers, but the installed OpenCode host can still perform external metadata/bootstrap requests. They require a compatible CLI, network permissions and OS support. Do not describe a blocked or incomplete host run as passed.

GitHub Actions covers Linux/Windows, Node 20/24 release smoke, minimum/current plugin API compatibility, lifecycle, progress, compaction, semantic completion, restart and coexistence. Investigate failed job logs; a passing local Linux suite does not establish Windows compatibility.

## Make a change reviewable

1. Explain the observable failure or developer problem.
2. Identify the state transition, ownership boundary or verification rule affected.
3. Add a regression that fails for the original problem, using bounded waits for observable state rather than arbitrary sleeps.
4. Preserve pause/stop authority, revision checks, provider deadlines and finite user budgets.
5. Update in-product help and the current guides together.
6. Run the relevant checks, then the full gate before release.

The command catalog in `src/opencode/command-help.ts` drives help, aliases and menu options. Run `npm run docs:update` after changing it, then `npm run docs:check`. That check also verifies local links in current guides; it does not certify external sites or historical audit documents.

Keep source changes in `src/`; `dist/` is generated. Commit lockfile changes when changing dependencies. Do not commit credentials, live-provider logs or private workspace contents. Keep upstream attribution and license intact.

## Regression design

For a recovery defect, test both the failure and the eventual permitted wake. Also test an explicit pause/control arriving in the middle. For a completion defect, include forged, missing, stale and revision-mismatched evidence. For concurrency, await the persisted outcome and release resources before deleting the fixture.

Legacy-mode tests should request `{ persistent: false }` explicitly when their expected result is bounded pause/block/wait behavior. Do not change those tests to assert endless retries and lose compatibility coverage.

## Release process

1. Review the exact commit and wait for all applicable checks.
2. Confirm documentation matches shipped behavior and package contents include linked user guides.
3. Update version/changelog and inspect `npm pack --dry-run`.
4. Configure the repository's `npm-release` environment and npm publishing identity as a maintainer.
5. Use the manual prerelease workflow only when intentionally publishing; it targets the `beta` dist-tag.
6. Verify the installed package from a clean consumer after publication.

A merge is not publication. The beta must not be advertised as an infinite-uptime or exactly-once execution system. Keep larger unimplemented architecture in the roadmap, not the shipped-feature list.
