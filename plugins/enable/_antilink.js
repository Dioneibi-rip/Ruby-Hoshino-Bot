import { shouldSilenceChatForBot, normalizeSessionJid } from '../../src/core/session-utils.js'

let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
  if (!m.isGroup) return
  if (isAdmin || isOwner || m.fromMe || isROwner) return

  // Obtener chat de forma asíncrona
  let chat = await global.db.getChat(m.chat)
  if (shouldSilenceChatForBot(chat, normalizeSessionJid(conn))) return

  // Verificar si el antilink está activo (usa antiLink o antilink según tu DB)
  if (!chat.antiLink && !chat.antilink) return

  const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text)
  if (!isGroupLink) return

  // Si el enlace es del propio grupo, no hacer nada
  if (isBotAdmin) {
    const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`
    if (m.text.includes(linkThisGroup)) return
  }

  let user = m.sender
  let mention = `@${user.split('@')[0]}`

  // Mensaje plano estilo original
  let aviso = `*「 ENLACE DETECTADO 」*\n\n`
  aviso += `《✧》${mention} Rompiste las reglas del Grupo serás eliminado...`

  if (isBotAdmin) {
    // Eliminar el mensaje con el enlace
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant
      }
    })

    // Enviar aviso y eliminar al usuario
    await conn.sendMessage(m.chat, {
      text: aviso,
      mentions: [user]
    }, { quoted: m })

    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
  } else {
    // El bot no es admin
    return m.reply(`😓 *Ups...* El antilink está activo, pero necesito ser *Admin* para poder sacar a la gente que manda links.`)
  }

  m.__pluginHalt = true
  return !0
}