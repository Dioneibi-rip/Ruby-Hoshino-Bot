import fs from 'fs'
import path from 'path'

const marriagesFile = path.resolve('src/database/casados.json')
async function pathExists(file){
try{
await fs.promises.access(file)
return true
}catch{
return false
}
}

async function loadMarriages() {
return await pathExists(marriagesFile) ? JSON.parse(await fs.promises.readFile(marriagesFile, 'utf8')) : {}
}

let marriages = await loadMarriages()

function formatTime(ms) {
const totalMinutes = Math.floor(ms / (1000 * 60))
const days = Math.floor(totalMinutes / 1440)
const hours = Math.floor((totalMinutes % 1440) / 60)
const minutes = totalMinutes % 60
let result = []
if (days) result.push(`${days}d`)
if (hours) result.push(`${hours}h`)
if (minutes || (!days && !hours)) result.push(`${minutes}m`)
return result.join(' ')
}

function formatDate(timestamp) {
const d = new Date(timestamp)
return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

const handler = async (m, { conn, args }) => {
let parejas = []
const procesados = new Set()

for (let user in marriages) {
if (!procesados.has(user)) {
const partner = marriages[user]?.partner || marriages[user]
const date = marriages[user]?.date || marriages[partner]?.date
if (partner && !procesados.has(partner) && date) {
parejas.push({ user, partner, date })
procesados.add(user)
procesados.add(partner)
}
}
}

parejas.sort((a, b) => a.date - b.date)

const iconos = ['👑', '🥈', '🥉']
let page = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : 1
const perPage = 10
const start = (page - 1) * perPage
const end = start + perPage
const totalPages = Math.ceil(parejas.length / perPage)

let texto = `「✿」Top parejas casadas por tiempo de matrimonio:\n\n`

for (let i = start; i < Math.min(end, parejas.length); i++) {
const p = parejas[i]
const tiempo = formatTime(Date.now() - p.date)
const fecha = formatDate(p.date)
const nombreUser = await conn.getName(p.user)
const nombrePartner = await conn.getName(p.partner)
const icono = iconos[i] || '✰'
texto += `${icono} ${i + 1} » *${nombreUser}* ｜ *${nombrePartner}*\n\t Tiempo casados → *${tiempo}*\n\t Fecha matrimonio → *${fecha}*\n`
}

texto += `\n> • Página *${page}* de *${totalPages}*`

await conn.reply(m.chat, texto.trim(), m)
}

handler.help = ['topmarried']
handler.tags = ['fun']
handler.command = ['topparejas', 'topmarry']
handler.group = true

export default handler
