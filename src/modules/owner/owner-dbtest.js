const randomToken = () => `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
const engineName = () => global.db?.sqlite ? 'SQLite' : 'Desconocido'

let handler = async (m, { conn }) => {
const db = global.db
if (!db?.updateUser || !db?.getUser) return m.reply('❌ DB no inicializada o gestor incompatible.')
const token = randomToken()
const startedAt = Date.now()
let writeMs = 0
let readMs = 0
let persisted = false
let readValue
let errorText = ''

try {
const writeStart = Date.now()
await db.updateUser(m.sender, { extras: { db_test: token, db_test_at: startedAt } })
if (typeof db.write === 'function') await db.write()
else if (typeof db.flush === 'function') await db.flush()
writeMs = Date.now() - writeStart

const readStart = Date.now()
if (typeof db.getRecord === 'function') {
const fresh = await db.getRecord('users', m.sender, { bypassCache: true })
readValue = fresh?.extras?.db_test
} else {
const fresh = db.getUser(m.sender)
readValue = fresh?.extras?.db_test
}
readMs = Date.now() - readStart
persisted = readValue === token
} catch (error) {
errorText = error?.message || String(error)
}

const lines = [
'🧪 *DB Live Audit*',
'',
`• Motor activo: *${engineName()}*`,
`• Escritura: *${writeMs} ms*`,
`• Lectura: *${readMs} ms*`,
`• Persistencia: *${persisted ? 'Exitosa ✅' : 'Fallida ❌'}*`,
`• Token esperado: \`${token}\``,
`• Token leído: \`${readValue ?? 'undefined'}\``
]
if (errorText) lines.push('', `• Error: \`${errorText}\``)
await conn.sendMessage(m.chat, { text: lines.join('\n') }, { quoted: m })
}

handler.help = []
handler.tags = ['owner']
handler.command = ['dbtest']
handler.rowner = true
handler.owner = true
handler.hidden = true

export default handler
