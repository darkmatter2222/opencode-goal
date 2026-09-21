# OpenCode Relentless — reliability and developer experience design

The feature branch now includes a development implementation. See [IMPLEMENTATION.md](IMPLEMENTATION.md) for shipped behavior and remaining design work. The documents below preserve the original audit and planning evidence.

Reviewed fork: [darkmatter2222/opencode-goal](https://github.com/darkmatter2222/opencode-goal), commit `586e7ce3cf3a9105c7389310cc929ec1ed5e2bad` (package version 1.3.33, including unreleased changes).

Start with [DESIGN.md](DESIGN.md). It supersedes the baseline's persistence policy: an impossible goal remains unfinished and scheduled indefinitely. The model cannot put the overall goal to sleep or change its success criteria.

- [COMMANDS-AND-CONTINUITY.md](COMMANDS-AND-CONTINUITY.md): detailed command usage, native TUI integration, indefinite retry protocol and truthful status design.
- [DESIGN.md](DESIGN.md): architecture, current-fork findings, command redesign, ten feature designs, implementation sequence, acceptance gates.
- [baseline-1.3.31/AUDIT.md](baseline-1.3.31/AUDIT.md): detailed original 38-finding source audit. Historical fork-status statements and proposed automatic waiting policy are superseded by DESIGN.md.
- [SOURCE-REVIEW.csv](SOURCE-REVIEW.csv): current production-source hashes and comparison to the audited 1.3.31 source.
- [fork-probes.json](fork-probes.json): seven reproduced current-fork policies/defects.
- [probe-fork.mjs](probe-fork.mjs): runnable reproductions, deliberately asserting existing behavior.
- [fork-tests.log](fork-tests.log): unchanged fork's suite: 324 tests, 322 passed, two platform skips, zero failures on Linux.

Historical probes assert upstream behavior and must be run against the pinned upstream source, not the modified Relentless runtime:

```sh
node docs/relentless/probe-fork.mjs
```

Green audit probes mean the observed defect/policy mismatch was reproduced. They are not passing tests of the proposed redesign. No real-provider, installed-user-host, power-loss, or infinite-duration test was performed.
