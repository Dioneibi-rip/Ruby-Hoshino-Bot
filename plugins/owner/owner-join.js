const inviteRegex = /(?:https?:\/\/)?(?:chat\.|wa\.)?whatsapp\.com\/(?:invite\/|joinchat\/)?([0-9A-Za-z_-]{20,32})(?:[?&#][^\s]*)?/i

function extractInviteCode(text = '') {
const match = String(text || '').trim().match(inviteRegex)
return match?.[1] || null
}

let handler = async (m, { conn, text, isOwner }) => {
if (!text) return m.reply(`${emoji} Debes enviar una invitación para que *${botname}* se una al grupo.`)

const code = extractInviteCode(text)
if (!code) return m.reply(`${emoji2} Enlace de invitación no válido.`)

if (!isOwner) {
const message = `${emoji} Invitación a un grupo:\n${text}\n\nPor: @${m.sender.split('@')[0]}`
await conn.sendMessage(`${suittag}@s.whatsapp.net`, { text: message, mentions: [m.sender] }, { quoted: m }).catch((error) => {
console.error('[join] no pude reenviar la invitación al owner:', error)
})
return m.reply(`${emoji} El link del grupo ha sido enviado, gracias por tu invitación. ฅ^•ﻌ•^ฅ`)
}

try {
const groupJid = await conn.groupAcceptInvite(code)
const suffix = groupJid ? `\nID: ${groupJid}` : ''
return m.reply(`${emoji} Me he unido exitosamente al grupo.${suffix}`)
} catch (error) {
console.error('[join] groupAcceptInvite falló:', error)
const reason = error?.output?.payload?.message || error?.message || 'Error desconocido'
return m.reply(`${msm} Error al unirme al grupo: ${reason}`)
}
}

handler.help = ['invite', 'join']
handler.tags = ['owner', 'tools']
handler.command = ['invite', 'join']

export default handler
