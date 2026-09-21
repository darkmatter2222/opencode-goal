import { GOAL_COMMANDS } from "../opencode/command-help.js"
import { formatGoalSidebar } from "./format.js"

type GoalTuiApi = {
  keymap?: { registerLayer(layer: any): unknown }
  command?: { register(factory: () => any[]): unknown }
  ui?: { DialogSelect(props: any): unknown; dialog: { replace(render: () => unknown): void; clear(): void }; toast?(value: any): void }
  client?: { tui?: { appendPrompt(value: any): Promise<unknown> } }
  slots: {
    register(plugin: {
      order?: number
      slots: {
        sidebar_content: (context: unknown, props: { session_id: string }) => unknown
      }
    }): unknown
  }
  state: {
    path: { directory: string; worktree: string }
    session: {
      status(sessionID: string): unknown
      messages(sessionID: string): ReadonlyArray<unknown>
    }
  }
}

type GoalTuiModule = {
  id: string
  tui(api: GoalTuiApi, options?: Record<string, unknown>, meta?: unknown): Promise<void>
}

const tui: GoalTuiModule["tui"] = async (api) => {
  const showMenu = () => {
    if (!api.ui?.DialogSelect) return
    api.ui.dialog.replace(() => api.ui!.DialogSelect({
      title: "Relentless — choose a goal action",
      options: GOAL_COMMANDS.map(([name, description]) => ({ title: `/goal ${name}`, value: name, description })),
      onSelect: (option: { value: string }) => {
        api.ui!.dialog.clear()
        // Insert, don't execute: argument-taking commands remain editable and
        // pause/stop cannot fire just because autocomplete highlighted a row.
        void api.client?.tui?.appendPrompt({ text: `/goal ${option.value} ` }).catch(() => {
          api.ui?.toast?.({ message: `Type /goal ${option.value}`, variant: "info" })
        })
      },
    }))
  }
  if (api.ui?.DialogSelect && api.keymap?.registerLayer) {
    api.keymap.registerLayer({ commands: [{ name: "relentless.menu", title: "Goal actions", desc: "Discover goal commands and usage", namespace: "palette", category: "Relentless", slashName: "goal-menu", run: showMenu }], bindings: [] })
  } else if (api.ui?.DialogSelect && api.command?.register) {
    api.command.register(() => [{ value: "relentless.menu", title: "Goal actions", description: "Discover goal commands and usage", category: "Relentless", slash: { name: "goal-menu" }, onSelect: showMenu }])
  }
  api.slots.register({
    order: 340,
    slots: {
      sidebar_content: (_context, props) => {
        // Host session state is intentionally touched so normal status/message
        // transitions re-evaluate this read-only filesystem projection.
        api.state.session.status(props.session_id)
        api.state.session.messages(props.session_id).length
        const root = api.state.path.directory || api.state.path.worktree
        return formatGoalSidebar(root, props.session_id)
      },
    },
  })
}

const plugin: GoalTuiModule = {
  id: "opencode-goal",
  tui,
}

export default plugin
