# Ten next-stage improvements

[Documentation home](../README.md) · [Detailed design](../relentless/DESIGN.md)

These are proposed increments, not features silently included in the beta. The ordering favors stronger correctness and recovery before visual polish.

| Priority | Idea | Developer value | Acceptance evidence |
|---|---|---|---|
| 1 | Transactional recovery journal | Explain every transition and reconstruct a lost wake after a crash | Kill at every commit/dispatch boundary; replay restores exactly the pending obligations |
| 2 | Protected verification contracts | Prevent worker edits from quietly weakening the definition of done | Attempts to change oracle definitions cannot produce a passing verdict |
| 3 | External action receipts | Retry deployments and other side effects without blindly duplicating them | Inject an accepted-but-timed-out action; reconcile its receipt before any retry |
| 4 | Provider-wide cooldown coordinator | Share rate limits and outage knowledge across goals | Many sessions honor one provider deadline with bounded, fair concurrency |
| 5 | Fresh-session handoff | Recover a damaged or exhausted conversation without losing the contract | Restart into a new host session with preserved revision, proof and unfinished work |
| 6 | Flight recorder and redacted export | Answer “why did it wait, retry, or claim success?” without log archaeology | Export a replayable timeline with credentials and sensitive fields removed |
| 7 | Contract editor and diff preview | Make objective/check changes understandable before applying them | Preview shows exact changed obligations; rejected edits leave state unchanged |
| 8 | Proof board | Show each requirement, fresh evidence and the reason it is still unproven | Every “proven” label opens the evidence and its revision/candidate binding |
| 9 | Strategy memory and recipes | Avoid repeating failed approaches; start common goals with stronger checks | A repeated failure changes the permitted strategy without changing the objective |
| 10 | Checkpoint worktrees and dependency graph | Isolate experiments and schedule independent required work | Failed experiments preserve the accepted candidate; dependencies do not create duplicate work |

The beta already includes text help, aliases, a capability-detected picker, basic proof inspection, recent notes, saved retry intent and process supervision. Each proposed feature should have a small reviewable implementation and a failure-injection acceptance test before being described as shipped.
