import fs from "fs"
import path from "path"
import { startSubBotWorker, normalizeSubBotJid, subBotSessionId, getSubBotWorkerRecords, hasValidSession, purgeStaleSubBotSession } from '../../src/core/subbot-worker-manager.js'

async function pathExists(file) {
  try {
    await fs.promises.access(file)
    return true
  } catch {
    return false
  }
}

function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60)
  const minutes = Math.floor((duration / (1000 * 60)) % 60)
  return `${minutes < 10 ? '0' : ''}${minutes} m y ${seconds < 10 ? '0' : ''}${seconds} s `
}

let handler = async (m, { conn, args, command }) => {
  const user = global.db.getUser(m.sender)
  const time = user.Subs + 120000
  if (Date.now() - user.Subs < 120000) return conn.reply(m.chat, `🌟 Debes esperar ${msToTime(time - Date.now())} para volver a vincular un *Sub-Bot.*`, m)

  const activeWorkers = getSubBotWorkerRecords({ statuses: ['online', 'starting', 'reconnecting'] })
  const limiteSubBots = global.subbotlimitt || 26
  if (activeWorkers.length >= limiteSubBots) {
    return m.reply(`🥀 Se ha alcanzado o superado el límite de *Sub-Bots* activos (${activeWorkers.length}/${limiteSubBots}).\n\nNo se pueden crear más conexiones hasta que un Sub-Bot se desconecte.`)
  }

  const who = m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender)
  const subBotJid = normalizeSubBotJid(who)
  const id = subBotSessionId(subBotJid)
  const legacyId = `${subBotJid.split('@')[0]}`
  const newPathRubyJadiBot = path.join(`./${jadi}/`, id)
  const legacyPathRubyJadiBot = path.join(`./${jadi}/`, legacyId)
  const pathRubyJadiBot = (await pathExists(newPathRubyJadiBot)) || !(await pathExists(legacyPathRubyJadiBot)) ? newPathRubyJadiBot : legacyPathRubyJadiBot

  const existingWorker = global.subBotWorkers instanceof Map ? global.subBotWorkers.get(id) : null
  if (existingWorker?.status === 'online') {
    return conn.reply(m.chat, `🔥 Ya tienes un *Sub-Bot* activo y estable.`, m)
  }
  if ((await pathExists(pathRubyJadiBot)) && hasValidSession(pathRubyJadiBot)) {
    purgeStaleSubBotSession(id, pathRubyJadiBot)
  }

  await fs.promises.mkdir(pathRubyJadiBot, { recursive: true })
  startSubBotWorker({
    folderPath: pathRubyJadiBot,
    subBotJid,
    subBotId: id,
    conn,
    request: { chat: m.chat, sender: m.sender, key: m.key, message: m.message },
    args: [...args],
    command
  })
  user.Subs = Date.now()
}
handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler
