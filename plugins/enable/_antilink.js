import { shouldSilenceChatForBot, normalizeSessionJid } from '../../src/core/session-utils.js'

let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
  if (!m.isGroup) return

  // 🔧 Para pruebas: comenté owner y rowner (NO dejes así en producción)
  if (isAdmin || m.fromMe /* || isOwner || isROwner */) return

  let chat = await global.db.getChat(m.chat)
  if (shouldSilenceChatForBot(chat, normalizeSessionJid(conn))) return

  // Verifica si antilink está activado
  if (!chat.antiLink && !chat.antilink) {
    console.log('⚠️ Antilink desactivado en este grupo')
    return
  }

  const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text)
  console.log('Enlace detectado?', !!isGroupLink, m.text)

  if (!isGroupLink) return

  // Si el enlace es del propio grupo, no hacer nada
  if (isBotAdmin) {
    const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`
    if (m.text.includes(linkThisGroup)) return
  }

  let user = m.sender
  let mention = `@${user.split('@')[0]}`

  let aviso = `*「 ENLACE DETECTADO 」*\n\n`
  aviso += `《✧》${mention} Rompiste las reglas del Grupo serás eliminado...`

  if (isBotAdmin) {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant
      }
    })

    await conn.sendMessage(m.chat, {
      text: aviso,
      mentions: [user]
    }, { quoted: m })

    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
  } else {
    return m.reply(`😓 *Ups...* El antilink está activo, pero necesito ser *Admin* para poder sacar a la gente que manda links.`)
  }

  m.__pluginHalt = true
  return !0
}