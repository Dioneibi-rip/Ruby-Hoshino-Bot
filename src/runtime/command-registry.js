import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_COMMANDS_DIR = path.resolve(__dirname, '../commands')
const DEFAULT_MANIFEST_PATH = path.join(DEFAULT_COMMANDS_DIR, 'manifest.json')

function normalizeCommand(value) {
return String(value || '').trim().toLowerCase()
}

function unique(values) {
return [...new Set(values.map(normalizeCommand).filter(Boolean))]
}

function parseArrayLiteral(source = '') {
const out = []
const re = /["'`]([^"'`]+)["'`]/g
let match
while ((match = re.exec(source))) out.push(match[1])
return out
}

function parseBooleanProperty(source, property) {
const re = new RegExp(`(?:handler|plugin|command)\\.${property}\\s*=\\s*(true|false)`, 'i')
const match = source.match(re)
return match ? match[1] === 'true' : false
}

function parseStringProperty(source, property) {
const re = new RegExp("(?:handler|plugin|command)\\." + property + "\\s*=\\s*([\"'`])([^\"'`]+)\\1", "i")
const match = source.match(re)
return match?.[2] || ''
}

function parseCommandDeclaration(source = '') {
const assignment = source.match(/(?:handler|plugin|command)\.command\s*=\s*([^\n;]+)/i)
if (!assignment) return []
const raw = assignment[1].trim()
if (raw.startsWith('[')) return parseArrayLiteral(raw)
const quoted = raw.match(/^["'`]([^"'`]+)["'`]$/)
if (quoted) return [quoted[1]]
return []
}

function parseHelp(source = '') {
const assignment = source.match(/(?:handler|plugin|command)\.help\s*=\s*([^\n;]+)/i)
return assignment ? parseArrayLiteral(assignment[1]) : []
}

function parseTags(source = '') {
const assignment = source.match(/(?:handler|plugin|command)\.tags\s*=\s*([^\n;]+)/i)
return assignment ? parseArrayLiteral(assignment[1]) : []
}

function deriveCategory(filePath, commandsDir) {
const relative = path.relative(commandsDir, filePath).replace(/\\/g, '/')
const [category] = relative.split('/')
return category && category !== path.basename(relative) ? category : 'general'
}

async function walkCommands(dir) {
let entries
try {
entries = await fs.readdir(dir, { withFileTypes: true })
} catch (error) {
if (error?.code === 'ENOENT') return []
throw error
}
entries.sort((a, b) => a.name.localeCompare(b.name))
const found = []
for (const entry of entries) {
const full = path.join(dir, entry.name)
if (entry.isDirectory()) found.push(...await walkCommands(full))
else if (entry.isFile() && entry.name.endsWith('.js')) found.push(full)
}
return found
}

export class CommandRegistry {
constructor({ commandsDir = DEFAULT_COMMANDS_DIR, manifestPath = DEFAULT_MANIFEST_PATH } = {}) {
this.commandsDir = commandsDir
this.manifestPath = manifestPath
this.commands = new Map()
this.files = new Map()
this.loadedAt = 0
}

async load({ force = false } = {}) {
if (!force && this.loadedAt && this.commands.size) return this
this.commands.clear()
this.files.clear()
const manifest = await this.readManifest()
const entries = manifest.length ? manifest : await this.scanCommands()
for (const entry of entries) this.register(entry)
this.loadedAt = Date.now()
return this
}

async readManifest() {
try {
const raw = await fs.readFile(this.manifestPath, 'utf8')
const parsed = JSON.parse(raw)
const entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.commands) ? parsed.commands : []
return entries.map((entry) => this.normalizeEntry(entry)).filter(Boolean)
} catch (error) {
if (error?.code === 'ENOENT') return []
throw error
}
}

async scanCommands() {
const files = await walkCommands(this.commandsDir)
const entries = []
for (const absolutePath of files) {
const source = await fs.readFile(absolutePath, 'utf8')
const commands = unique(parseCommandDeclaration(source))
if (!commands.length) continue
const aliases = unique([...commands.slice(1), ...parseHelp(source).map((item) => String(item).split(/\s+/)[0])])
const tags = parseTags(source)
entries.push(this.normalizeEntry({
name: commands[0],
commands,
aliases,
category: tags[0] || deriveCategory(absolutePath, this.commandsDir),
permissions: {
owner: parseBooleanProperty(source, 'owner') || parseBooleanProperty(source, 'rowner'),
group: parseBooleanProperty(source, 'group'),
admin: parseBooleanProperty(source, 'admin'),
botAdmin: parseBooleanProperty(source, 'botAdmin'),
premium: parseBooleanProperty(source, 'premium'),
register: parseBooleanProperty(source, 'register')
},
description: parseStringProperty(source, 'description'),
file: path.relative(this.commandsDir, absolutePath).replace(/\\/g, '/')
}))
}
return entries
}

normalizeEntry(entry = {}) {
const commands = unique([entry.name, ...(entry.commands || []), ...(entry.aliases || [])])
if (!commands.length || !entry.file) return null
const absolutePath = path.isAbsolute(entry.file) ? entry.file : path.resolve(this.commandsDir, entry.file)
return {
name: commands[0],
commands,
aliases: unique(entry.aliases || commands.slice(1)),
category: entry.category || 'general',
permissions: entry.permissions || {},
description: entry.description || '',
file: path.relative(this.commandsDir, absolutePath).replace(/\\/g, '/'),
path: absolutePath,
url: pathToFileURL(absolutePath).href
}
}

register(entry) {
const meta = this.normalizeEntry(entry)
if (!meta) return false
this.files.set(meta.file, meta)
for (const command of meta.commands) this.commands.set(command, meta)
return true
}

get(command) {
return this.commands.get(normalizeCommand(command)) || null
}

has(command) {
return this.commands.has(normalizeCommand(command))
}

list() {
return [...this.files.values()]
}
}

export const commandRegistry = new CommandRegistry()
export default commandRegistry
