import type { PluginModule } from "@opencode-ai/plugin"
import OpenCodeGoalPlugin from "./index.js"

const plugin = {
  id: "@darkmatter2222/opencode-relentless",
  server: OpenCodeGoalPlugin,
} satisfies PluginModule & { id: string }

export default plugin
