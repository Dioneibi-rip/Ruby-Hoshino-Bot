import { JOBS, normalizeJobInput, getJobData, getJobTenureDays } from '../../library/rpg-jobs.js'
import { buildParticipantsByLid, normalizeIdentityJid } from '../../core/identity-utils.js'

const JOB_LIST = Object.values(JOBS).filter((job) => job?.key && job.key !== 'ninguno')
const PICK_WORDS = new Set(['elegir', 'set', 'escoger', 'seleccionar', 'tomar', 'cambiar'])
const LIST_WORDS = new Set(['lista', 'list', 'jobs', 'empleos', 'menu'])
const INFO_WORDS = new Set(['actual', 'status', 'info', 'ver'])

function currencyName(conn) {
  const jid = conn?.user?.jid || global.conn?.user?.jid || ''
  return global.db?.data?.settings?.[jid]?.moneda || 'Coins'
}

function renderJobs(usedPrefix, conn) {
  const options = JOB_LIST.map((job, index) => [
    `*${index + 1}.* ${job.emoji} *${job.name}*`,
    `   Clave: \`${job.key}\``,
    `   ${job.description}`,
  ].join('\n'))

  return [
    '💼 *BOLSA DE TRABAJO*',
    '',
    options.join('\n\n'),
    '',
    '✦ Para guardar un empleo de forma permanente:',
    `• *${usedPrefix}trabajo elegir <trabajo>*`,
    `• *${usedPrefix}trabajo <número>*`,
    `• *${usedPrefix}trabajo <trabajo>*`,
    '',
    `✦ Después usa *${usedPrefix}trabajar* para ganar ${currencyName(conn)}.`,
  ].join('\n')
}

async function normalizeSender(conn, m, participants = []) {
  const sender = String(m?.sender || '').trim()
  if (!sender.endsWith('@lid') || !m?.isGroup) return sender
  const participantsByLid = buildParticipantsByLid(participants)
  return await normalizeIdentityJid(conn, sender, participantsByLid) || sender
}

function resolveJobKey(input = '') {
  const text = String(input || '').trim()
  const index = Number.parseInt(text, 10)
  if (Number.isInteger(index) && String(index) === text && index >= 1 && index <= JOB_LIST.length) return JOB_LIST[index - 1].key
  const key = normalizeJobInput(text)
  return key && key !== 'ninguno' ? key : null
}

function snapshotUser(user = {}) {
  return {
    coin: Number(user.coin) || 0,
    job: typeof user.job === 'string' ? user.job : 'Ninguno',
    jobSince: Number(user.jobSince) || 0,
    jobXp: Number(user.jobXp) || 0,
  }
}

async function persistUserPatch(jid, patch) {
  if (!global.db?.updateUser) throw new Error('Base de datos no disponible para updateUser')
  const writer = typeof global.db.updateUserAsync === 'function' ? global.db.updateUserAsync : global.db.updateUser
  const result = await writer.call(global.db, jid, patch)
  return result
}

const handler = async (m, { conn, usedPrefix, args = [], participants = [] }) => {
  const jid = await normalizeSender(conn, m, participants)
  if (!jid) return conn.reply(m.chat, '❌ No pude identificar tu usuario para guardar el trabajo.', m)

  const action = String(args[0] || '').trim().toLowerCase()
  if (!action || LIST_WORDS.has(action)) return conn.reply(m.chat, renderJobs(usedPrefix, conn), m)

  const currentUser = typeof global.db?.getUserAsync === 'function' ? await global.db.getUserAsync(jid, { bypassCache: true }) : global.db?.getUser?.(jid) || {}
  const current = snapshotUser(currentUser)

  if (INFO_WORDS.has(action)) {
    const activeJob = getJobData(current)
    const tenure = getJobTenureDays(current)
    return conn.reply(
      m.chat,
      `💼 Tu trabajo actual: ${activeJob.emoji} *${activeJob.name}*\n✦ Antigüedad: *${tenure} día(s)*\n✦ XP laboral: *${current.jobXp.toLocaleString()}*`,
      m,
    )
  }

  const requested = PICK_WORDS.has(action) ? args.slice(1).join(' ') : args.join(' ')
  const selectedKey = resolveJobKey(requested)
  if (!selectedKey) {
    return conn.reply(m.chat, `✘ Trabajo inválido: *${requested || 'sin dato'}*.\nUsa *${usedPrefix}trabajo lista* para ver opciones disponibles.`, m)
  }

  const selected = JOBS[selectedKey]
  if (current.job === selectedKey) return conn.reply(m.chat, `✅ Ya tienes ese trabajo: ${selected.emoji} *${selected.name}*.`, m)

  const patch = {
    job: selectedKey,
    jobSince: Date.now(),
    jobXp: current.jobXp,
    coin: current.coin,
  }

  await persistUserPatch(jid, patch)
  return conn.reply(m.chat, `✅ Trabajo guardado: ${selected.emoji} *${selected.name}*.\n✦ El cambio fue sellado en la base de datos antes de responder.`, m)
}

handler.help = ['trabajo lista', 'trabajo elegir <trabajo>', 'trabajo <número>', 'trabajo info']
handler.tags = ['economy']
handler.command = ['trabajo', 'job', 'empleo']
handler.group = true
handler.register = true

export default handler
