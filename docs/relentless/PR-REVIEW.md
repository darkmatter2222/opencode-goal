# PR #1 review — 2026-09-21

Reviewed head: `4772795cc961be7dff486e66ac5d5c75af1841ba`.

## Verdict

The original head is not merge-ready. CI, Release Readiness, and Real Host Progress failed. No GitHub reviews or inline review threads were present at inspection. Keep this a draft beta until the updated cross-platform checks pass; passing checks do not establish an infinite-reliability guarantee.

## Corrections in this review

- **Persistence lost on edit and queue activation:** `editGoal` recreated goals without their persistence policy, and queued goals did not store that policy. Preserve it on edit and durably carry it from enqueue through promotion.
- **Premature turn-budget exhaustion:** OpenCode emits multiple assistant/tool messages within one prompt. Count terminal assistant messages as Goal turns while charging tokens, cost and runtime for every message. The failed real-host ten-turn test had consumed its 14-turn budget after only seven mutations.
- **Literal objectives interpreted as controls:** `/goal-new -- pause` previously became `/goal pause`. Parse explicit creation throughout the wrapper chain; preserve literal text including reserved words and `--help`. Reject extra stop/control arguments without mutating the goal.
- **Workspace subprocess lifetime:** a failed Git probe returned before its parallel sibling processes exited, leaving workspace handles open on Windows. Bound every probe and drain them all before returning.
- **Test races:** wait for persisted dispatch cleanup and recovery state instead of assuming a short timer guarantees completion.
- **Stale integration expectations:** lifecycle and repeated-shell canaries still expected automatic surrender. They now assert active recovery, a future deadline and a real continuation after backoff.
- Normalize resolved SDK abort errors, and remove contradictory persistent-mode prompt text saying a dependency stops pursuit until manual resume.

## Verification

- TypeScript build/check passed.
- Unit suite: 351 tests, 349 passed, two platform skips, zero failures.
- Adversarial evaluation: 162/162, gate passed.
- Actions security gate: passed for eight workflows.
- Real OpenCode 1.18.31 repeated-shell canary passed on Linux: four shell turns, deduplicated progress, active recovery, and a subsequent request after backoff.
- Local lifecycle and ten-turn host runs were not completed: automatic approval review blocked further execution because OpenCode can contact `models.opencode.ai`. No successful result is claimed for those local runs.
- Updated GitHub Actions results must be checked separately from these local results.

## Remaining limitations

The broader gaps in IMPLEMENTATION.md remain: semantic verification is fallible, persisted dispatch leases are not external-action exactly-once receipts, and host/process recovery cannot operate through permanent machine or storage loss. This review does not certify all failure modes or production readiness. In particular, manual resume currently clears stored recovery deadlines; strict provider cooldown preservation across every control transition needs a follow-up regression and policy change.
