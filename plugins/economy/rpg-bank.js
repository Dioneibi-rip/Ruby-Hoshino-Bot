import db from '../../lib/database.js'
import { formatJobLine, ensureJobFields } from '../../lib/rpg-jobs.js'

let handler = async (m, { conn, usedPrefix, participants }) => {
let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender

if (who === conn.user.jid) return m.react('✖️')

let primaryJid = who
if (who.endsWith('@lid') && m.isGroup) {
const p = participants.find(x => x.lid === who)
if (p?.id) primaryJid = p.id
}

const user = global.db.getUser(primaryJid)

ensureJobFields(user)
let nombre = await conn.getName(primaryJid)
const jobLine = formatJobLine(user)

const coin = Number(user.coin || user.coins || 0)
const bank = Number(user.bank || 0)
const total = coin + bank

let texto = `
╭─〔 ᥫ᭡ 𝗜𝗡𝗙𝗢 𝗘𝗖𝗢𝗡𝗢́𝗠𝗜𝗖𝗔 ❀ 〕
│ 👤 Usuario » *${nombre}*
│ 💸 Dinero » *¥${coin.toLocaleString()} ${m.moneda}*
│ 🏦 Banco » *¥${bank.toLocaleString()} ${m.moneda}*
│ 🧾 Total » *¥${total.toLocaleString()} ${m.moneda}*
│ 💼 Trabajo » *${jobLine}*
╰─────────────────────
> 📌 Usa *${usedPrefix}deposit* para proteger tu dinero en el banco.
`.trim()

await conn.reply(m.chat, texto, m)
}

handler.help = ['bal']
handler.tags = ['rpg']
handler.command = ['bal', 'balance', 'bank']
handler.register = true
handler.group = true

export default handler
