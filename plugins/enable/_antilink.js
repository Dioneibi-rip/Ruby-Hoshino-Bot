import { shouldSilenceChatForBot, normalizeSessionJid } from '../../src/core/session-utils.js'

let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
  if (!m.isGroup) return
  if (isAdmin || isOwner || m.fromMe || isROwner) return

  // Obtener datos del chat de forma directa (sincrónica)
  let chat = global.db.data.chats[m.chat]
  if (!chat) return // chat no existe, salir

  // Respetar silencio por bot baneado o no primario
  if (shouldSilenceChatForBot(chat, normalizeSessionJid(conn))) return

  // Verificar si el antilink está activo (ambas variantes)
  if (!chat.antiLink && !chat.antilink) return

  const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text)
  if (!isGroupLink) return

  // Si el enlace es del propio grupo, no actuar
  if (isBotAdmin) {
    try {
      const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`
      if (m.text.includes(linkThisGroup)) return
    } catch (e) {
      // Si falla obtener el código, continuamos (el enlace no es del grupo)
    }
  }

  let user = m.sender
  let mention = `@${user.split('@')[0]}`

  // Mensaje de aviso plano
  let aviso = `*「 ENLACE DETECTADO 」*\n\n`
  aviso += `《✧》${mention} Rompiste las reglas del Grupo serás eliminado...`

  if (isBotAdmin) {
    // Eliminar mensaje con el enlace
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant
      }
    })
    // Avisar y expulsar
    await conn.sendMessage(m.chat, { text: aviso, mentions: [user] }, { quoted: m })
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
  } else {
    // El bot no es admin
    return m.reply(`😓 *Ups...* El antilink está activo, pero necesito ser *Admin* para poder sacar a la gente que manda links.`)
  }

  m.__pluginHalt = true
  return !0
}