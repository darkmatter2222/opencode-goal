# Installation and migration

[Documentation home](../README.md) · [Commands](COMMANDS.md)

## Requirements

- Node.js 20 or newer; release checks cover Node 20 and 24.
- OpenCode available in your terminal. The package declares OpenCode >=1.4.0 and plugin API >=1.4.0 <2; native menu support is capability-detected.
- Git for cloning and stronger workspace-change detection. Non-Git projects can run, but do not receive the same candidate-change protection.
- A working model/provider configuration in OpenCode. Relentless does not install a model or supply credentials.

## Source installation

```sh
git clone --branch feat/relentless https://github.com/darkmatter2222/opencode-goal.git
cd opencode-goal
npm ci
npm run build
node -e "console.log(require('node:url').pathToFileURL(process.cwd()).href)"
```

The final command prints a platform-correct package URL. Examples:

| Platform | Example URL |
|---|---|
| Linux | `file:///home/ryan/src/opencode-goal` |
| macOS | `file:///Users/ryan/src/opencode-goal` |
| Windows | `file:///C:/src/opencode-goal` |

Use the generated URL, especially when paths contain spaces. Point to the **package directory**, not `src/index.ts`. OpenCode can select the package's server entrypoint; compatible hosts can also discover its TUI entrypoint.

Back up your existing configuration. In the applicable `opencode.json` or `opencode.jsonc`, replace only the upstream `@bybrawe/opencode-goal` entry with the local package URL. Preserve other plugins and settings.

```json
{
  "plugin": ["file:///C:/src/opencode-goal"]
}
```

The example is a minimal configuration, not a replacement for a larger existing file. Do not load both plugins: they own the same `/goal` command and `opencode_goal_*` tools.

Restart OpenCode completely and check:

```text
/goal help
/goal doctor
/goal-new -- Inspect this project and explain its test commands
/goal status
/goal pause
```

The last command stops autonomous pursuit. A paused goal remains saved.

## Update the checkout

Pause active work and stop the host before changing the loaded package. From the checkout:

```sh
git pull --ff-only
npm ci
npm run build
```

Restart the host and inspect `/goal status` and `/goal doctor`. A `git pull --ff-only` failure means local history diverged; inspect it rather than discarding local changes.

## Saved goals and compatibility

New public-plugin goals are persistent. Edits preserve their policy; newly queued goals store it through activation and restart. Goals already saved by upstream are not silently migrated, resumed or relabeled.

To replace a legacy goal deliberately, inspect `/goal contract`, save its exact objective, requirements and limits, then `/goal stop` and create a new goal with those requirements. Keep the archived original for traceability. No automatic state rewrite is required to try the beta.

Programmatic consumers can call the public plugin with `{ persistent: false }` to create goals using upstream bounded policy. This is a JavaScript plugin option, not a new OpenCode JSON setting or slash flag.

## Installer versus source checkout

The packaged installer knows how to migrate the upstream registration to `@darkmatter2222/opencode-relentless`. This source beta does not imply an available npm release. Use the local URL until a release is published and verified. Do not run an old upstream `npx` command expecting it to install Relentless.

## Roll back

1. Pause goals and stop the host.
2. Back up `.opencode/goals/` (including its `history/` subdirectory) and `.opencode/goal-sequences/` from the project, plus your OpenCode configuration.
3. Restore the previous plugin entry or previously tested checkout; do not load both versions.
4. Restart OpenCode and inspect saved goals before resuming work.

Cross-version state semantics can differ. Retain backups and do not assume an older plugin understands every new recovery field. Removing the plugin or stopping a goal does not roll back project edits or external effects.
