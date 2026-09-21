# Development validation — 2026-09-21

Validated on Linux, Node 24.19.0. No paid model calls or changes to the user's installed OpenCode configuration.

- TypeScript check/build: passed.
- Unit/integration suite: 341 tests; 339 passed; two platform-specific skips; zero failures.
- Evaluation corpus: weighted 162/162; gate passed.
- Packed-package smoke: clean production-only consumer imports public API/server/TUI, uses npm-linked installer, verifies `/goal` command installation and uninstalls successfully.
- GitHub Actions security gate: passed for eight workflow files.
- Runner help/argument entrypoint: exercised; a live OpenCode server/service was not available for an end-to-end canary.
- Diff whitespace check: passed.

New regressions cover 10,000 persistent failure observations, false integer arithmetic despite semantic claims, duplicate idle accounting, model dependency reports, resolved SDK errors, generated help/aliases, user pause/stop, dropped wakes, provider recovery, retry deadlines, restart without the old bootstrap barrier, simultaneous dispatchers, dead-process leases, native menu command insertion and migration of the original upstream package registration.

Existing tests that intentionally assert the upstream automatic-pause policies now explicitly choose `persistent: false`. The new tests exercise default public-plugin persistent mode. They are not disabled or changed to assert that premature stopping is correct in persistent mode.

Remaining real-host gates: OpenCode TUI versions, real provider disconnect/reconnect, slow local model generation, Windows/macOS process/service behavior, user permission prompts during recovery and process/power-loss durability. See IMPLEMENTATION.md for limits; test success is not an infinite-uptime or universal-proof guarantee.
