#!/usr/bin/env node
import { spawn, type ChildProcess } from "node:child_process"
import { resolve } from "node:path"
import { randomBytes } from "node:crypto"

/** Foreground supervisor suitable for systemd/launchd/Task Scheduler. No shell evaluation. */
export async function runHost(args = process.argv.slice(2)): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: opencode-relentless-runner [--directory path] [--port 4097]\nKeeps an authenticated loopback OpenCode server running and restarts it after crashes.\nInstall Relentless in that project's OpenCode configuration first. Attach a TUI to this server to create/manage goals.\nFor execution after logout/reboot, run this command under your OS service manager. Ctrl+C stops the host, not the persisted goals.")
    return
  }
  let directory = process.cwd(), port = 4097
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--directory" && args[i + 1]) directory = resolve(args[++i]!)
    else if (args[i] === "--port" && args[i + 1]) port = Number(args[++i])
    else throw new Error(`Unknown/missing runner argument: ${args[i]}. Use --help.`)
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port must be an integer from 1 to 65535")
  const password = process.env.OPENCODE_SERVER_PASSWORD
  if (!password) throw new Error("Set OPENCODE_SERVER_PASSWORD before starting the runner; use the same credential when attaching OpenCode. The runner never prints it.")
  const username = process.env.OPENCODE_SERVER_USERNAME || "opencode"
  let stopping = false, child: ChildProcess | undefined, killTimer: ReturnType<typeof setTimeout> | undefined
  let wake: (() => void) | undefined
  const stop = () => {
    stopping = true
    wake?.()
    child?.kill("SIGTERM")
    killTimer = setTimeout(() => child?.kill("SIGKILL"), 5_000)
    killTimer.unref()
  }
  process.once("SIGINT", stop); process.once("SIGTERM", stop)
  let failures = 0
  try {
    while (!stopping) {
      const start = Date.now()
      console.log(`Relentless host: http://127.0.0.1:${port} · ${directory}`)
      child = spawn(process.env.OPENCODE_EXECUTABLE || "opencode", ["serve", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: directory, env: process.env, stdio: "inherit", shell: false })
      let warming = false, healthFailures = 0
      // A directory-scoped read initializes the plugin even without a TUI.
      const warm = setInterval(() => {
        if (warming || stopping) return
        warming = true
        const url = new URL(`http://127.0.0.1:${port}/session`); url.searchParams.set("directory", directory)
        void fetch(url, { headers: { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` }, signal: AbortSignal.timeout(5_000) })
          .then(response => {
            if (!response.ok) { healthFailures++; console.error(`Relentless host initialization: HTTP ${response.status}`) }
            else healthFailures = 0
          })
          .catch(() => { healthFailures++ }).finally(() => {
            warming = false
            if (healthFailures >= 12 && !stopping) {
              console.error("Host health unavailable for repeated checks; restarting the owned host.")
              child?.kill("SIGTERM")
              const owned = child
              const timer = setTimeout(() => owned?.kill("SIGKILL"), 5_000); timer.unref()
              healthFailures = 0
            }
          })
      }, 5_000)
      await new Promise<void>(resolveExit => {
        child!.once("error", error => { console.error(`Host unavailable: ${error.message}`); resolveExit() })
        child!.once("exit", () => resolveExit())
      })
      clearInterval(warm)
      if (killTimer) clearTimeout(killTimer)
      child = undefined
      if (stopping) break
      failures = Date.now() - start > 60_000 ? 1 : failures + 1
      const cap = Math.min(300_000, 15_000 * 2 ** Math.min(5, failures - 1))
      const delay = Math.floor(cap * (0.5 + randomBytes(4).readUInt32BE() / 0xffffffff * 0.5))
      console.error(`Host exited. Goals remain saved; restart in ${Math.ceil(delay / 1000)}s.`)
      await new Promise<void>(resolveWait => { const timer = setTimeout(resolveWait, delay); wake = () => { clearTimeout(timer); resolveWait() } })
      wake = undefined
    }
  } finally {
    process.removeListener("SIGINT", stop); process.removeListener("SIGTERM", stop)
    if (killTimer) clearTimeout(killTimer)
  }
}
