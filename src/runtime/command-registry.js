import { promises as fs } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const DEFAULT_COMMANDS_DIR = path.resolve(process.cwd(), 'src', 'commands')
const MANIFEST_FILE = 'manifest.json'
const COMMAND_ASSIGNMENT = /(?:handler|module\.exports)\s*\.\s*command\s*=\s*([^\n;]+)/m
const FIELD_ASSIGNMENT_CACHE = new Map()
const FIELD_ASSIGNMENT = (field) => {
let regex = FIELD_ASSIGNMENT_CACHE.get(field)
if (!regex) {
regex = new RegExp(`(?:handler|module\\.exports)\\s*\\.\\s*${field}\\s*=\\s*([^\\n;]+)`, 'm')
FIELD_ASSIGNMENT_CACHE.set(field, regex)
}
return regex
}
const SCAN_BATCH_SIZE = 32

function normalizeArray(value) {
if (value == null) return []
if (Array.isArray(value)) return value.map(item => String(item).trim().toLowerCase()).filter(Boolean)
return [String(value).trim().toLowerCase()].filter(Boolean)
}

function parseLiteral(source = '') {
const text = String(source || '').trim()
if (!text) return null
try {
return Function(`"use strict"; return (${text})`)()
} catch {
const quoted = text.match(/^['"`](.*)['"`]$/s)
return quoted ? quoted[1] : null
}
}

function parseBoolean(source = '') {
const value = parseLiteral(source)
return value === true
}

function parseMetadataFromSource(source = '', filePath = '') {
const commandValue = parseLiteral(source.match(COMMAND_ASSIGNMENT)?.[1] || '')
const commands = normalizeArray(commandValue)
if (!commands.length) return null
const tags = normalizeArray(parseLiteral(source.match(FIELD_ASSIGNMENT('tags'))?.[1] || ''))
const help = normalizeArray(parseLiteral(source.match(FIELD_ASSIGNMENT('help'))?.[1] || ''))
const category = tags[0] || path.basename(path.dirname(filePath)).toLowerCase()
return {
name: path.basename(filePath),
commands,
aliases: commands.slice(1),
category,
permissions: {
owner: parseBoolean(source.match(FIELD_ASSIGNMENT('owner'))?.[1] || ''),
admin: parseBoolean(source.match(FIELD_ASSIGNMENT('admin'))?.[1] || ''),
botAdmin: parseBoolean(source.match(FIELD_ASSIGNMENT('botAdmin'))?.[1] || ''),
group: parseBoolean(source.match(FIELD_ASSIGNMENT('group'))?.[1] || ''),
private: parseBoolean(source.match(FIELD_ASSIGNMENT('private'))?.[1] || ''),
register: parseBoolean(source.match(FIELD_ASSIGNMENT('register'))?.[1] || ''),
needsParticipants: parseBoolean(source.match(FIELD_ASSIGNMENT('needsParticipants'))?.[1] || '')
},
help,
filePath,
fileUrl: pathToFileURL(filePath).href
}
}

async function walkJavaScriptFiles(dir) {
try {
const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true })
return entries
.filter(entry => entry.isFile() && entry.name.endsWith('.js'))
.map(entry => path.join(entry.parentPath || entry.path || dir, entry.name))
} catch {
return []
}
}

export class CommandRegistry {
constructor({ commandsDir = DEFAULT_COMMANDS_DIR, manifestPath = path.join(commandsDir, MANIFEST_FILE) } = {}) {
this.commandsDir = commandsDir
this.manifestPath = manifestPath
this.commands = new Map()
this.files = new Map()
this.loadedAt = 0
}

async init({ force = false } = {}) {
if (!force && this.loadedAt && this.commands.size) return this
this.commands.clear()
this.files.clear()
const manifest = await this.loadManifest()
if (manifest.length) this.registerMany(manifest)
else await this.scanCommands()
this.loadedAt = Date.now()
global.commandsMap = this.commands
return this
}

async loadManifest() {
try {
const raw = await fs.readFile(this.manifestPath, 'utf8')
const parsed = JSON.parse(raw)
return Array.isArray(parsed) ? parsed : Array.isArray(parsed.commands) ? parsed.commands : []
} catch {
return []
}
}

registerMany(entries = []) {
for (const entry of entries) this.register(entry)
}

register(entry = {}) {
const filePath = path.isAbsolute(entry.filePath || entry.path || '') ? entry.filePath || entry.path : path.join(this.commandsDir, entry.filePath || entry.path || '')
const commands = normalizeArray(entry.commands || entry.command || entry.name)
if (!commands.length || !filePath) return false
const metadata = {
name: entry.name || path.basename(filePath),
commands,
aliases: normalizeArray(entry.aliases).length ? normalizeArray(entry.aliases) : commands.slice(1),
category: String(entry.category || entry.tags?.[0] || path.basename(path.dirname(filePath))).toLowerCase(),
permissions: entry.permissions || {},
help: normalizeArray(entry.help),
filePath,
fileUrl: pathToFileURL(filePath).href
}
this.files.set(filePath, metadata)
for (const command of new Set([...commands, ...metadata.aliases])) this.commands.set(command, metadata)
return true
}

async scanCommands() {
const files = await walkJavaScriptFiles(this.commandsDir)
for (let index = 0; index < files.length; index += SCAN_BATCH_SIZE) {
const batch = files.slice(index, index + SCAN_BATCH_SIZE)
const sources = await Promise.all(batch.map(filePath => fs.readFile(filePath, 'utf8').catch(() => '')))
for (let offset = 0; offset < batch.length; offset++) {
const metadata = parseMetadataFromSource(sources[offset], batch[offset])
if (metadata) this.register(metadata)
}
if (index + SCAN_BATCH_SIZE < files.length) await new Promise(resolve => setImmediate(resolve))
}
return this
}

get(command = '') {
return this.commands.get(String(command || '').toLowerCase()) || null
}

has(command = '') {
return this.commands.has(String(command || '').toLowerCase())
}

all() {
return [...new Set(this.commands.values())]
}
}

export const commandRegistry = new CommandRegistry()
export default commandRegistry
