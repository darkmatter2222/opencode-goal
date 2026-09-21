# Relentless implementation status

Development beta, 2026-09-21. This is an implementation branch, not an infinite-uptime certification.

## Implemented

- Public-plugin goals default to persistent pursuit. Upstream bounded behavior remains an explicit compatibility option; existing persisted goals are not silently reactivated or migrated.
- No-progress, repeated blockers, empty responses, model-requested dependency waits, provider limits and fatal-provider classifications retain enabled goals with recovery intent.
- Provider cooldown floors survive pause/resume, edits and later recovery observations. Repeated resume of an active goal does not clear its lease or launch another request. Retry is scoped to the selected session.
- Persisted recovery deadlines, equal-jitter exponential backoff, dispatch Retry-After handling, periodic host-status reconciliation, SDK error normalization and bounded waits.
- Cross-instance dispatch lease metadata and generation-checked writes. User pause/clear and changed revisions win over late completion.
- Periodic recovery for missing idle events; last-child wake; compaction barrier reconciliation; persistent restart uses the same core scheduler rather than a separate bootstrap dispatcher.
- Command catalog generating help and aliases, contextual usage, typo guidance, why/proof/attempts/retry, safe pause/stop output and native action picker where the host API supports it.
- Headless authenticated loopback host runner, directory initialization and crash restart with backoff. OS service installation remains an explicit deployment task.
- Exact integer arithmetic verifier; proof retention at the merge; full current host evidence supplied to semantic review; Git candidate content fence; improved dirty-file content markers; bounded optional toasts; multi-round assistant ownership.
- Renamed package, known-upstream installer migration, pinned dependency lock and manual prerelease publishing workflow.

## Deliberate limits and remaining planned work

The durable scheduler currently builds on the existing atomic JSON store and compare-and-swap generations. It is **not yet** the proposed transactional SQLite journal/outbox, externally fenced action broker or permanent action-receipt ledger. Ambiguous requests are conservatively held while the host reports busy/unknown; the plugin does not claim exactly-once external effects. A hung host that never updates its busy status still needs host-level recovery. Local dispatch leases expire; they are not OS-level write fences against an uncooperative worker.

Git candidate checks cover tracked and nonignored files, excluding plugin control state. Non-Git workspaces, ignored files and remote side effects do not have an immutable snapshot guarantee. Very large/unreadable workspaces can make the marker unavailable. The integer oracle accepts a deliberately narrow exact equation grammar, not every paraphrase of an arithmetic objective.

The model still has ordinary workspace permissions. No OS sandbox or immutable external verifier store was provisioned. Semantic review remains fallible. Protected oracle definitions, external verification adapters, stable snapshot execution, formal scheduler model checking, rich contract-diff staging, a full flight recorder/export, strategy memory, recipes, checkpoint worktrees, provider-wide cooldown coordination, fresh-session relay and dependency graph are still planned. The new `/goal-attempts` view shows existing bounded checkpoint history; it does not pretend to be a permanent attempt journal.

The native menu is capability-detected and inserts commands; bare `/goal` uses reliable textual help. Nested argument autocomplete is not invented or patched into host internals. The new proof surface reuses the existing audit report. A complete custom proof-board route and editable goal form are not shipped in this beta.

The runner must own the server used by the TUI. Starting an unrelated second host does not automatically transfer an already-running session's tool process. Password and OS service setup are external deployment configuration, not something the package silently changes.

No live user host, real-provider outage, Windows service lifecycle or OS power-loss test has been performed in this environment. Unit/integration and packed-package validation results are recorded in the development report. Keep this on the feature branch until the exact release candidate passes its checks. The first review follow-up passed real-host lifecycle, ten-turn semantic completion, progress and restart checks in GitHub Actions; consult the current PR for later commits. See the [current guides](../README.md).
