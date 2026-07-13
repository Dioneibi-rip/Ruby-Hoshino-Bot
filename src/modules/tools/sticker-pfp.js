import { normalizeIdentityJid } from '../../core/identity-utils.js'

let handler = async (m, { conn }) => {
let target = m.mentionedJid?.[0] || m.quoted?.sender || (m.fromMe ? conn.user.jid : m.sender)
const who = await normalizeIdentityJid(conn, target)
const name = await conn.getName(who)
const pp = await conn.profilePictureUrl(who, 'image').catch(() => 'https://files.catbox.moe/xr2m6u.jpg')
await conn.sendFile(m.chat, pp, 'profile.jpg', `*Foto de perfil de ${name || `@${who.split('@')[0]}`}*`, m, false, { mentions: [who] })
}

handler.help = ['pfp @user'];
handler.tags = ['sticker'];
handler.command = ['pfp', 'getpic'];

export default handler;