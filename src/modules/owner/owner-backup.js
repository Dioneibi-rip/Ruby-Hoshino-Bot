function sanitizeSnapshot(value) {
return JSON.parse(JSON.stringify(value ?? {}, (_key, item) => typeof item === 'bigint' ? item.toString() : item))
}

async function createDatabaseBackup() {
if (!global.db) throw new Error('La base de datos global no está inicializada')
if (typeof global.db.write === 'function') await global.db.write().catch(() => {})
if (typeof global.db.flush === 'function') await global.db.flush().catch(() => {})
const snapshot = typeof global.db.snapshot === 'function'
? await global.db.snapshot()
: {
users: global.db.getSection?.('users') || global.db.data?.users || {},
chats: global.db.getSection?.('chats') || global.db.data?.chats || {},
settings: global.db.getSection?.('settings') || global.db.data?.settings || {},
stats: global.db.getSection?.('stats') || global.db.data?.stats || {},
}
return sanitizeSnapshot({
createdAt: new Date().toISOString(),
engine: global.db.filename ? 'sqlite' : 'unknown',
filename: global.db.filename || null,
dbName: global.db.dbName || null,
snapshot,
})
}

let handler = async (m, { conn }) => {
await m.reply(`${emoji} Generando respaldo compatible de ${packname}...`)
try {
await m.react(rwait)
const d = new Date()
const date = d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
const backup = await createDatabaseBackup()
const payload = Buffer.from(JSON.stringify(backup, null, 2), 'utf8')
const stamp = d.toISOString().replace(/[:.]/g, '-')
await conn.reply(m.chat, `*• Fecha:* ${date}\n*• Motor:* ${backup.engine}`, m)
await conn.sendMessage(m.sender, {
document: payload,
mimetype: 'application/json',
fileName: `ruby-hoshino-db-backup-${stamp}.json`,
}, { quoted: fkontak })
await m.react(done)
} catch (e) {
console.error('[backup]', e)
await m.react(error)
conn.reply(m.chat, `${msm} Ocurrió un error generando el respaldo.`, m)
return false
}
}

handler.help = ['copia']
handler.tags = ['owner']
handler.command = ['backup', 'respaldo', 'copia']
handler.rowner = true

export default handler
