# Security boundaries and reporting

Relentless is a workflow plugin running with OpenCode's project permissions. It is not an operating-system sandbox or a substitute for authorization.

- An executor with unrestricted shell/filesystem access can alter local state, tests or configuration. Local verification files are not immutable external oracles.
- Goal checks execute commands in the project. Review checks and workspace trust before enabling unattended execution.
- Provider credentials belong in OpenCode's normal configuration/secret mechanism. The runner requires an authenticated loopback server and does not print its password.
- Pause/stop prevents new autonomous scheduling but does not guarantee instant termination of every descendant process or undo external effects.
- A dispatch lease does not make external actions exactly once. Use idempotency and authoritative receipts for consequential side effects.

For a suspected vulnerability, use the repository's private vulnerability reporting facility if enabled. If unavailable, open a minimal issue asking for a private reporting channel without including credentials, exploit payloads, private source or affected-user data. Describe affected versions and provide a sanitized reproduction through the agreed channel.

This development beta has no published security-support SLA or bounty commitment. See the [reliability contract](docs/guides/RELIABILITY.md) for known design boundaries.
