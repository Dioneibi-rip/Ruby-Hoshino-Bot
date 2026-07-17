import { jidNormalizedUser } from '@whiskeysockets/baileys'

export function normalizeJid(jid) {
if (!jid || typeof jid !== 'string') return ''
const raw = String(jid).trim()
if (!raw) return ''
const normalizedByBaileys = jidNormalizedUser(raw) || raw
const lower = String(normalizedByBaileys).trim().toLowerCase()
const match = lower.match(/^([^@]+)@([^@]+)$/)
if (!match) return lower.replace(/:\d+(?=@|$)/, '')
let user = match[1].replace(/:\d+$/, '')
let server = match[2]
if (server === 'c.us') server = 's.whatsapp.net'
const digits = user.replace(/\D/g, '')
if (digits && ['s.whatsapp.net', 'lid', 'hosted.lid'].includes(server)) return `${digits}@s.whatsapp.net`
return `${user}@${server}`
}

global.normalizeJid = normalizeJid

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


export async function resolveIdentityJids(conn, jids = [], participantsByLid = null) {
const list = Array.isArray(jids) ? jids : []
const out = []
for (const jid of list) {
const normalized = await normalizeIdentityJid(conn, jid, participantsByLid)
if (normalized) out.push(normalized)
}
return [...new Set(out)]
}

global.resolveIdentityJids = resolveIdentityJids

export async function resolveInteractionTarget(m, conn = null, options = {}) {
const { participantsByLid = null } = options
const rawTarget = Array.isArray(m?.mentionedJid) && m.mentionedJid[0]
? m.mentionedJid[0]
: m?.quoted?.sender || m?.quoted?.participant || m?.quoted?.key?.participant || m?.sender || ''
const jid = await normalizeIdentityJid(conn, rawTarget, participantsByLid)
return jid || rawTarget
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
global.resolveInteractionTarget = resolveInteractionTarget


export async function resolveIdentityName(conn, jid, options = {}) {
const { participantsByLid = null, fallback = 'Usuario' } = options
const normalized = await normalizeIdentityJid(conn, jid, participantsByLid)
const identityJid = normalized || jid || ''
if (!identityJid) return fallback
try {
const name = await conn?.getName?.(identityJid)
if (typeof name === 'string' && name.trim()) return name.trim()
} catch {}
return fallback || `@${String(identityJid).split('@')[0]}`
}

export function buildParticipantsByLid(participants = []) {
const map = new Map()
for (const participant of participants || []) {
if (participant?.lid) map.set(participant.lid, participant)
if (participant?.id) map.set(participant.id, participant)
if (participant?.jid) map.set(participant.jid, participant)
}
return map
}

global.resolveIdentityName = resolveIdentityName
global.buildParticipantsByLid = buildParticipantsByLid
