import path from 'path'

const nativeProfile = Object.freeze({
sessionId: 'primary',
botJid: '',
ownerJid: '',
botName: 'Ruby Hoshino',
customPrefix: '#',
pairingPrefix: 'RUBY-CHAN',
pairingImageUrl: '',
individualMenuImageUrl: '',
menuVideoUrl: '',
menuImageUrl: '',
welcomeImageUrl: path.join(process.cwd(), 'src', 'assets', 'greetings', 'welcome_card.jpg'),
goodbyeImageUrl: path.join(process.cwd(), 'src', 'assets', 'greetings', 'leave_card.jpg'),
welcomeEnabled: true,
goodbyeEnabled: true,
meta: {},
currencyName: 'RubyCoins',
defaultMenuVideoPath: path.join(process.cwd(), 'src', 'menu', 'ruby-hoshino-miau.mp4'),
defaultMenuDirectory: path.join(process.cwd(), 'src', 'menu'),
defaultWelcomeImagePath: path.join(process.cwd(), 'src', 'assets', 'greetings', 'welcome_card.jpg'),
defaultGoodbyeImagePath: path.join(process.cwd(), 'src', 'assets', 'greetings', 'leave_card.jpg')
})

const writableColumns = new Set([
'bot_jid',
'owner_jid',
'bot_name',
'custom_prefix',
'pairing_prefix',
'pairing_image_url',
'individual_menu_image_url',
'menu_video_url',
'menu_image_url',
'welcome_image_url',
'goodbye_image_url',
'welcome_enabled',
'goodbye_enabled',
'meta_json'
])

const patchMap = {
botJid: 'bot_jid',
ownerJid: 'owner_jid',
botName: 'bot_name',
customPrefix: 'custom_prefix',
pairingPrefix: 'pairing_prefix',
pairingImageUrl: 'pairing_image_url',
individualMenuImageUrl: 'individual_menu_image_url',
menuVideoUrl: 'menu_video_url',
menuImageUrl: 'menu_image_url',
welcomeImageUrl: 'welcome_image_url',
goodbyeImageUrl: 'goodbye_image_url',
welcomeEnabled: 'welcome_enabled',
goodbyeEnabled: 'goodbye_enabled',
meta: 'meta_json'
}

function resolveSqlite(db = global.db) {
return db?.sqlite || db
}

function normalizeSessionId(sessionId) {
return String(sessionId || 'primary').trim() || 'primary'
}

function safeJsonParse(value, fallback = {}) {
try {
if (!value) return fallback
if (typeof value === 'object') return value
return JSON.parse(value)
} catch {
return fallback
}
}

function safeJsonString(value) {
try {
return JSON.stringify(value ?? {})
} catch {
return '{}'
}
}

function toBool(value, fallback = true) {
if (typeof value === 'boolean') return value
if (value === 0 || value === '0') return false
if (value === 1 || value === '1') return true
return fallback
}

function cleanPrefix(value) {
const prefix = String(value || '').trim()
return prefix || nativeProfile.customPrefix
}

export function sanitizePairingPrefix(value) {
const prefix = String(value || '').trim().toUpperCase().replace(/-/g, '')
if (!/^[A-Z0-9]{2,10}$/.test(prefix)) return nativeProfile.pairingPrefix
return prefix
}

export function getNativeBotProfile(sessionId = 'primary') {
return { ...nativeProfile, sessionId: normalizeSessionId(sessionId), meta: { ...nativeProfile.meta } }
}

export function ensureBotProfileSchema(db = global.db) {
const sqlite = resolveSqlite(db)
if (!sqlite?.exec) return false
sqlite.exec(`
CREATE TABLE IF NOT EXISTS bot_profiles (
  session_id TEXT PRIMARY KEY,
  bot_jid TEXT,
  owner_jid TEXT,
  bot_name TEXT NOT NULL DEFAULT 'Ruby Hoshino',
  custom_prefix TEXT NOT NULL DEFAULT '#',
  pairing_prefix TEXT NOT NULL DEFAULT 'RUBY-CHAN',
  pairing_image_url TEXT,
  individual_menu_image_url TEXT,
  menu_video_url TEXT,
  menu_image_url TEXT,
  welcome_image_url TEXT,
  goodbye_image_url TEXT,
  welcome_enabled INTEGER NOT NULL DEFAULT 1,
  goodbye_enabled INTEGER NOT NULL DEFAULT 1,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_bot_profiles_bot_jid ON bot_profiles(bot_jid);
CREATE INDEX IF NOT EXISTS idx_bot_profiles_owner_jid ON bot_profiles(owner_jid);
`)
try { sqlite.exec("ALTER TABLE bot_profiles ADD COLUMN pairing_prefix TEXT NOT NULL DEFAULT 'RUBY-CHAN'") } catch {}
try { sqlite.exec("ALTER TABLE bot_profiles ADD COLUMN pairing_image_url TEXT") } catch {}
try { sqlite.exec("ALTER TABLE bot_profiles ADD COLUMN individual_menu_image_url TEXT") } catch {}
return true
}

function rowToProfile(row, sessionId) {
const fallback = getNativeBotProfile(sessionId)
if (!row) return fallback
const profile = {
...fallback,
sessionId: normalizeSessionId(row.session_id || sessionId),
botJid: row.bot_jid || fallback.botJid,
ownerJid: row.owner_jid || fallback.ownerJid,
botName: row.bot_name || fallback.botName,
customPrefix: cleanPrefix(row.custom_prefix),
pairingPrefix: sanitizePairingPrefix(row.pairing_prefix),
pairingImageUrl: row.pairing_image_url || fallback.pairingImageUrl,
individualMenuImageUrl: row.individual_menu_image_url || fallback.individualMenuImageUrl,
menuVideoUrl: row.menu_video_url || fallback.menuVideoUrl,
menuImageUrl: row.menu_image_url || fallback.menuImageUrl,
welcomeImageUrl: row.welcome_image_url || fallback.welcomeImageUrl,
goodbyeImageUrl: row.goodbye_image_url || fallback.goodbyeImageUrl,
welcomeEnabled: toBool(row.welcome_enabled, fallback.welcomeEnabled),
goodbyeEnabled: toBool(row.goodbye_enabled, fallback.goodbyeEnabled),
meta: safeJsonParse(row.meta_json, fallback.meta)
}
profile.currencyName = profile.meta?.currencyName || profile.meta?.currency_name || 'RubyCoins'
return profile
}

export function getBotProfile(sessionId = 'primary', db = global.db) {
const id = normalizeSessionId(sessionId)
try {
const sqlite = resolveSqlite(db)
if (!sqlite?.prepare) return getNativeBotProfile(id)
ensureBotProfileSchema(sqlite)
let row = sqlite.prepare('SELECT * FROM bot_profiles WHERE session_id=?').get(id)
if (!row && id.includes('@')) row = sqlite.prepare('SELECT * FROM bot_profiles WHERE bot_jid=? ORDER BY updated_at DESC LIMIT 1').get(id)
return rowToProfile(row, id)
} catch {
return getNativeBotProfile(id)
}
}

function normalizePatch(patchData = {}) {
const patch = {}
for (const [key, value] of Object.entries(patchData || {})) {
const column = patchMap[key] || key
if (!writableColumns.has(column)) continue
if (column === 'pairing_prefix') patch[column] = sanitizePairingPrefix(value)
else if (column === 'meta_json') patch[column] = safeJsonString(value)
else if (column === 'welcome_enabled' || column === 'goodbye_enabled') patch[column] = value ? 1 : 0
else if (typeof value !== 'undefined') patch[column] = value
}
return patch
}

export function upsertBotProfile(sessionId = 'primary', patchData = {}, db = global.db) {
const id = normalizeSessionId(sessionId)
try {
const sqlite = resolveSqlite(db)
if (!sqlite?.prepare) return getNativeBotProfile(id)
ensureBotProfileSchema(sqlite)
const now = Date.now()
const patch = normalizePatch(patchData)
const base = {
session_id: id,
bot_jid: patch.bot_jid || null,
owner_jid: patch.owner_jid || null,
bot_name: patch.bot_name || nativeProfile.botName,
custom_prefix: cleanPrefix(patch.custom_prefix),
pairing_prefix: sanitizePairingPrefix(patch.pairing_prefix),
pairing_image_url: patch.pairing_image_url || null,
individual_menu_image_url: patch.individual_menu_image_url || null,
menu_video_url: patch.menu_video_url || null,
menu_image_url: patch.menu_image_url || null,
welcome_image_url: patch.welcome_image_url || null,
goodbye_image_url: patch.goodbye_image_url || null,
welcome_enabled: typeof patch.welcome_enabled === 'number' ? patch.welcome_enabled : 1,
goodbye_enabled: typeof patch.goodbye_enabled === 'number' ? patch.goodbye_enabled : 1,
meta_json: patch.meta_json || '{}',
created_at: now,
updated_at: now
}
sqlite.prepare(`
INSERT INTO bot_profiles(session_id, bot_jid, owner_jid, bot_name, custom_prefix, pairing_prefix, pairing_image_url, individual_menu_image_url, menu_video_url, menu_image_url, welcome_image_url, goodbye_image_url, welcome_enabled, goodbye_enabled, meta_json, created_at, updated_at)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(session_id) DO NOTHING
`).run(base.session_id, base.bot_jid, base.owner_jid, base.bot_name, base.custom_prefix, base.pairing_prefix, base.pairing_image_url, base.individual_menu_image_url, base.menu_video_url, base.menu_image_url, base.welcome_image_url, base.goodbye_image_url, base.welcome_enabled, base.goodbye_enabled, base.meta_json, base.created_at, base.updated_at)
const entries = Object.entries(patch)
if (entries.length) {
const assignments = entries.map(([column]) => `${column}=?`).join(', ')
sqlite.prepare(`UPDATE bot_profiles SET ${assignments}, updated_at=? WHERE session_id=?`).run(...entries.map(([, value]) => value), now, id)
}
return getBotProfile(id, sqlite)
} catch {
return getNativeBotProfile(id)
}
}


export function resetBotProfile(sessionId = 'primary', db = global.db) {
const id = normalizeSessionId(sessionId)
try {
const sqlite = resolveSqlite(db)
if (!sqlite?.prepare) return getNativeBotProfile(id)
ensureBotProfileSchema(sqlite)
sqlite.prepare('DELETE FROM bot_profiles WHERE session_id=?').run(id)
return getNativeBotProfile(id)
} catch {
return getNativeBotProfile(id)
}
}

export function hydrateBotProfile(conn, db = global.db) {
const sessionId = normalizeSessionId(conn?.user?.jid || conn?.session?.id || 'primary')
let profile = getBotProfile(sessionId, db)
const identityPatch = {}
if (conn?.session?.ownerJid && !profile.ownerJid) identityPatch.ownerJid = conn.session.ownerJid
if (conn?.user?.jid && profile.botJid !== conn.user.jid) identityPatch.botJid = conn.user.jid
if (Object.keys(identityPatch).length) profile = upsertBotProfile(sessionId, identityPatch, db)
if (conn) {
conn.botProfile = profile
try {
conn.prefix = [conn.botProfile.customPrefix || nativeProfile.customPrefix, /^[#/!.@]/]
} catch (error) {
console.error('[UPSERT ERROR]:', error)
conn.botProfile = getNativeBotProfile(sessionId)
conn.prefix = [conn.botProfile.customPrefix || nativeProfile.customPrefix, /^[#/!.@]/]
}
}
return profile
}
