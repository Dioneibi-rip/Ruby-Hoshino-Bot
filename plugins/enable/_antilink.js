import { shouldSilenceChatForBot, normalizeSessionJid } from '../../src/core/session-utils.js'

const linkRegex = /(?:https?:\/\/)?(?:(?:chat\.whatsapp\.com\/[A-Za-z0-9]{20,})|(?:(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+))/i

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
if (!m.isGroup) return
if (isAdmin || isOwner || m.fromMe || isROwner) return
if (!m.text) return

let chat = global.db.data.chats[m.chat]
if (!chat) return

if (shouldSilenceChatForBot(chat, normalizeSessionJid(conn))) return
if (!chat.antiLink && !chat.antilink) return
if (!linkRegex.test(m.text)) return

if (isBotAdmin) {
try {
const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`
if (m.text.includes(linkThisGroup)) return
} catch (e) {}
}

let user = m.sender
let mention = `@${user.split('@')[0]}`

let aviso = `*「 ENLACE DETECTADO 」*\n\n`
aviso += `《✧》${mention} Rompiste las reglas del Grupo serás eliminado...`

if (isBotAdmin) {
await conn.sendMessage(m.chat, { delete: m.key })
await conn.sendMessage(m.chat, { text: aviso, mentions: [user] }, { quoted: m })
try {
await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
} catch (e) {}
} else {
return m.reply(`😓 *Ups...* El antilink está activo, pero necesito ser *Admin* para poder sacar a la gente que manda links.`)
}

m.__pluginHalt = true
return !0
}
