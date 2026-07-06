import { jidNormalizedUser } from '@whiskeysockets/baileys'

export async function normalizeIdentityJid(conn, jid, participantsByLid = null) {
if (!jid || typeof jid !== 'string') return ''
let normalized = jidNormalizedUser(jid) || jid
if (normalized.endsWith('@lid') || normalized.endsWith('@hosted.lid')) {
const participant = participantsByLid?.get?.(normalized) || participantsByLid?.get?.(jid)
if (participant?.jid) normalized = jidNormalizedUser(participant.jid) || participant.jid
else {
const mapped = await conn?.signalRepository?.lidMapping?.getPNForLID?.(normalized).catch(() => null)
if (mapped) normalized = jidNormalizedUser(mapped) || mapped
}
}
return normalized
}

export async function resolveTarget(m, conn = null, options = {}) {
const { participantsByLid = null, errorMessage = 'Debes mencionar o responder al mensaje del usuario. 🧐' } = options
const rawTarget = Array.isArray(m?.mentionedJid) && m.mentionedJid[0]
? m.mentionedJid[0]
: m?.quoted?.sender || m?.quoted?.participant || m?.quoted?.key?.participant || ''
if (!rawTarget) {
if (errorMessage && typeof m?.reply === 'function') await m.reply(errorMessage)
return null
}
const jid = await normalizeIdentityJid(conn, rawTarget, participantsByLid)
return jid || rawTarget
}

global.resolveTarget = resolveTarget
