import { resolveInteractionTarget } from '../../src/core/identity-utils.js'

let confirmation = {}

async function loadMarriages() {
  return global.db?.getSection?.('marriages') || {}
}

function isUserMarried(marriages, user) {
  return Boolean(global.db.getUser(user)?.marry || marriages[user]?.partner)
}

function getPartner(marriages, user) {
  return global.db.getUser(user)?.marry || marriages[user]?.partner || ''
}

const handler = async (m, { conn, command, participants, usedPrefix }) => {
  // Convierte LID → JID real usando la lista de participantes
  const normalizeToJid = (rawJid) => {
    if (!rawJid || typeof rawJid !== 'string') return rawJid
    if (!rawJid.endsWith('@lid')) return rawJid
    const pInfo = participants?.find(p => p?.lid === rawJid)
    return pInfo?.id || rawJid
  }

  const isPropose = /^marry$/i.test(command)
  const isDivorce = /^divorce$/i.test(command)
  const marriages = await loadMarriages()

  try {
    let proposerJid = normalizeToJid(m.sender)
    global.db.getUser(proposerJid)

    if (isPropose) {
      // ── Obtener el destinatario y luego NORMALIZARLO ──
      const rawTarget = await resolveInteractionTarget(m, conn)
      const proposeeJid = normalizeToJid(rawTarget)

      // Sin destinatario o es el mismo
      if (!proposeeJid || proposeeJid === proposerJid) {
        if (isUserMarried(marriages, proposerJid)) {
          let partner = getPartner(marriages, proposerJid)
          let partnerName = conn.getName(partner) || `@${partner.split('@')[0]}`
          return await conn.reply(m.chat, `《✧》 Ya estás casado con *${partnerName}*\n> Puedes divorciarte con el comando: *${usedPrefix}divorce*`, m)
        } else {
          throw new Error(`Debes mencionar a alguien para proponer o aceptar matrimonio.\n> Ejemplo » *${usedPrefix + command} @Usuario*`)
        }
      }

      if (isUserMarried(marriages, proposerJid)) {
        let partner = getPartner(marriages, proposerJid)
        throw new Error(`Ya estás casado con @${partner.split('@')[0]}.`)
      }
      if (isUserMarried(marriages, proposeeJid)) {
        throw new Error(`@${proposeeJid.split('@')[0]} ya está casado(a).`)
      }
      if (proposerJid === proposeeJid) {
        throw new Error('¡No puedes proponerte matrimonio a ti mismo!')
      }

      // Cancelar propuesta previa si existe
      if (confirmation[proposeeJid]) {
        clearTimeout(confirmation[proposeeJid].timeout)
        delete confirmation[proposeeJid]
      }

      // Guardar propuesta usando el JID NORMALIZADO
      let proposerName = conn.getName(proposerJid) || `@${proposerJid.split('@')[0]}`
      let proposeeName = conn.getName(proposeeJid) || `@${proposeeJid.split('@')[0]}`

      confirmation[proposeeJid] = {
        proposer: proposerJid,
        timeout: setTimeout(() => {
          conn.sendMessage(m.chat, {
            text: `*《✧》Se acabó el tiempo. La propuesta de matrimonio de @${proposerJid.split('@')[0]} fue cancelada.*`,
            mentions: [proposerJid]
          })
          delete confirmation[proposeeJid]
        }, 120_000)
      }

      await conn.sendMessage(m.chat, {
        text: `♡ ${proposeeName}, el usuario ${proposerName} te ha propuesto matrimonio. ¿Aceptas? •(=^●ω●^=)•\n\n` +
          `⚘ *Responde a este mensaje con:*\n` +
          `> ✐ "Si" para aceptar\n` +
          `> ✐ "No" para rechazar\n\n` +
          `⏳ Tienes 2 minutos para responder.`,
        mentions: [proposerJid, proposeeJid]
      }, { quoted: m })

    } else if (isDivorce) {
      if (!isUserMarried(marriages, proposerJid)) throw new Error('No estás casado con nadie.')

      let partner = getPartner(marriages, proposerJid)

      if (typeof global.db.divorcePair === 'function') {
        global.db.divorcePair(proposerJid)
      } else {
        let userDb = global.db.getUser(proposerJid)
        let partnerDb = global.db.getUser(partner)
        if (userDb) delete userDb.marry
        if (partnerDb) delete partnerDb.marry
      }
      await global.db.write?.()

      await conn.reply(m.chat, `✐ ${conn.getName(proposerJid)} y ${conn.getName(partner)} se han divorciado.`, m, { mentions: [proposerJid, partner] })
    }
  } catch (error) {
    await conn.reply(m.chat, `《✧》 ${error.message}`, m, { mentions: m.mentionedJid || [] })
    return false
  }
}

// ── Intercepta "Si"/"No" ──
handler.before = async (m, { conn }) => {
  if (m.isBaileys) return
  if (!(m.sender in confirmation)) return
  if (!m.text) return

  const { proposer, timeout } = confirmation[m.sender]
  const proposeeJid = m.sender

  // Rechazo
  if (/^(no)$/i.test(m.text.trim())) {
    clearTimeout(timeout)
    delete confirmation[proposeeJid]
    return conn.sendMessage(m.chat, {
      text: `*《✧》@${proposeeJid.split('@')[0]} ha rechazado tu propuesta de matrimonio.*`,
      mentions: [proposer, proposeeJid]
    }, { quoted: m })
  }

  // Aceptación
  if (/^(si|yes)$/i.test(m.text.trim())) {
    clearTimeout(timeout)
    delete confirmation[proposeeJid]

    const fecha = Date.now()
    if (typeof global.db.setMarriagePair === 'function') {
      global.db.setMarriagePair(proposer, proposeeJid, fecha)
    } else {
      let user1 = global.db.getUser(proposer)
      let user2 = global.db.getUser(proposeeJid)
      if (user1) user1.marry = proposeeJid
      if (user2) user2.marry = proposer
    }
    await global.db.write?.()

    let proposerName = conn.getName(proposer) || `@${proposer.split('@')[0]}`
    let proposeeName = conn.getName(proposeeJid) || `@${proposeeJid.split('@')[0]}`

    await conn.sendMessage(m.chat, {
      text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n\n` +
        `¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n` +
        `*•.¸♡ Esposo(a):* ${proposeeName}\n` +
        `*•.¸♡ Esposo(a):* ${proposerName}\n\n` +
        `\`Disfruten de su luna de miel\`\n\n` +
        `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
      mentions: [proposer, proposeeJid]
    }, { quoted: m })
  }
}

handler.tags = ['fun']
handler.help = ['marry *@usuario*', 'divorce']
handler.command = ['marry', 'divorce']
handler.group = true

export default handler