# Relentless documentation

Start with a goal, learn controls inside OpenCode, then use these guides when you need more depth.

| I want to… | Read |
|---|---|
| Install, update or roll back | [Installation](guides/INSTALLATION.md) |
| Understand every command and option | [Command reference](guides/COMMANDS.md) |
| Find out why work is waiting | [Troubleshooting](guides/TROUBLESHOOTING.md) |
| Understand retry and completion guarantees | [Reliability contract](guides/RELIABILITY.md) |
| Run the plugin unattended | [Operations](guides/OPERATIONS.md) |
| Change the implementation | [Architecture](guides/ARCHITECTURE.md), [contributing](../CONTRIBUTING.md) |
| See what is next | [Roadmap](guides/ROADMAP.md) |
| Assess the beta | [Implementation status](relentless/IMPLEMENTATION.md), [review findings](relentless/PR-REVIEW.md) |

## Historical design evidence

[Original audit and design index](relentless/README.md) preserves the source review, probes and architecture proposals. Those documents describe the baseline or planned work; they do not override the shipped command reference or imply that every design has been implemented.

Some upstream documents outside `guides/` describe older behavior. For persistent-mode policy and source installation, use the guides above. Existing legacy goals deliberately retain bounded behavior unless explicitly replaced with a new persistent goal.
