import assert from 'node:assert/strict'
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GOAL_COMMANDS } from '../dist/opencode/command-help.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const commandPath = path.join(root, 'docs/guides/COMMANDS.md')
const marker = /<!-- command-catalog:start -->[\s\S]*?<!-- command-catalog:end -->/
const cell = text => text.replaceAll('|', '\\|')
const rows = GOAL_COMMANDS.map(([name, description, args]) => `| \`/goal ${name}${args ? ` ${args}` : ''}\` | \`/goal-${name}\` | ${cell(description)} |`)
const table = `<!-- command-catalog:start -->\n| Command | Shortcut | Purpose |\n|---|---|---|\n${rows.join('\n')}\n<!-- command-catalog:end -->`
// Git may check out Markdown as CRLF on Windows; content must compare identically.
let commands = (await readFile(commandPath, 'utf8')).replaceAll('\r\n', '\n')
assert.ok(marker.test(commands), 'command reference must contain catalog markers')
if (process.argv.includes('--write')) {
  commands = commands.replace(marker, table)
  await writeFile(commandPath, commands)
}
assert.equal(commands.match(marker)[0], table, 'command catalog drift: run npm run docs:update')

const guides = (await readdir(path.join(root, 'docs/guides'))).filter(name => name.endsWith('.md')).map(name => `docs/guides/${name}`)
const files = ['README.md', 'README.tr.md', 'CONTRIBUTING.md', 'SECURITY.md', 'docs/README.md', ...guides]
let links = 0
for (const file of files) {
  const content = await readFile(path.join(root, file), 'utf8')
  // Check current hand-authored inline local links. External URLs and anchors
  // alone are not network-validated by this offline check.
  for (const match of content.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1]
    if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) continue
    const relative = decodeURIComponent(target.split('#')[0])
    const absolute = path.resolve(root, path.dirname(file), relative)
    assert.ok(absolute === root || absolute.startsWith(root + path.sep), `${file}: link escapes repository: ${target}`)
    const found = await stat(absolute).catch(() => null)
    assert.ok(found, `${file}: broken local link ${target}`)
    links++
  }
}
console.log(`Documentation PASS: ${GOAL_COMMANDS.length} catalog commands, ${files.length} current documents, ${links} local links`)
