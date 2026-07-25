import { buildParticipantsByLid, normalizeIdentityJid, resolveTarget, resolveIdentityName, normalizeJid } from '../../core/identity-utils.js'

const handler = async (m, { conn, participants = [], groupMetadata }) => {
  // 1. Forzar la obtención de la metadata de forma segura (como en baltop)
  const metadata = await conn.groupMetadata(m.chat).catch(() => groupMetadata || {})
  const actualParticipants = metadata?.participants || participants || []

  const participantsByLid = buildParticipantsByLid(actualParticipants)
  const target = await resolveTarget(m, conn, { participantsByLid, errorMessage: '' })

  if (target) {
    const targetJid = await normalizeIdentityJid(conn, target, participantsByLid)
    if (!targetJid || !global.db.userExists(targetJid)) {
      return conn.reply(m.chat, '☢️ Objetivo no encontrado en la base de datos económica.', m)
    }

    await global.db.updateUser(targetJid, { coin: 0, bank: 0 })
    await global.db.write?.()
    const targetName = await resolveIdentityName(conn, targetJid, { participantsByLid, fallback: `@${String(targetJid).split('@')[0]}` })
    return conn.reply(
      m.chat,
      `☢️ *BOTÓN NUCLEAR ACTIVADO*\n\nLos fondos de ${targetName} han sido confiscados.\n💸 Cartera: *0*\n🏦 Banco: *0*`,
      m,
      { mentions: [targetJid] },
    )
  }

  // 2. Extraer y normalizar los JIDs usando el mismo método que baltop
  const groupParticipants = [...new Set(
    actualParticipants
      .flatMap(participant => [participant?.id, participant?.jid, participant?.lid])
      .map(normalizeJid) // Limpieza estricta de IDs
      .filter(Boolean)
  )]

  const targets = new Set()
  for (const jid of groupParticipants) {
    // 3. Verificar los IDs limpios en la base de datos
    if (global.db.userExists(jid)) targets.add(jid)
  }

  if (!targets.size) {
    return conn.reply(m.chat, '☢️ No encontré usuarios del grupo con economía registrada para resetear.', m)
  }

  for (const jid of targets) await global.db.updateUser(jid, { coin: 0, bank: 0 })
  await global.db.write?.()

  return conn.reply(
    m.chat,
    `☢️ *COLAPSO ECONÓMICO TOTAL*\n\nToda la economía del grupo ha colapsado y los fondos han sido confiscados.\n👥 Usuarios afectados: *${targets.size}*\n💸 Cartera y banco fueron reducidos a *0*.`,
    m,
  )
}

handler.help = ['reseteconomy [@usuario]']
handler.tags = ['owner']
handler.command = ['reseteconomy', 'resetearconomia', 'reseteco']
handler.group = true
handler.rowner = true

export default handler