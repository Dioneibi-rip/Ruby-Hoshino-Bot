import { smsg } from './lib/simple.js'
import { format } from 'util'
import * as ws from 'ws'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import failureHandler from './lib/respuesta.js'

const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const jidLocal = (jid = '') => String(jid || '').split('@')[0].split(':')[0]
const normalizeJid = (jid = '') => {
  const raw = String(jid || '').trim()
  if (!raw) return ''
  if (raw.endsWith('@lid') || raw.endsWith('@s.whatsapp.net') || raw.endsWith('@g.us')) return raw
  const digits = raw.replace(/\D/g, '')
  return digits ? `${digits}@s.whatsapp.net` : raw
}

const STALE_MESSAGE_WINDOW_MS = 10 * 60 * 1000
const GROUP_METADATA_CACHE_TTL_MS = 2 * 60 * 1000

global.groupMetadataCache = global.groupMetadataCache || new Map()
global.uptimeStart = global.uptimeStart || Date.now()

function normalizeAdmin(participant) {
  if (!participant) return false
  const a = participant.admin ?? participant.role ?? participant.isAdmin ?? false
  if (a === true || a === 'admin') return 'admin'
  if (['creator', 'superadmin', 'owner'].includes(a) || participant.isSuperAdmin || participant.isCreator) return 'superadmin'
  return false
}

function buildParticipantIndex(participants = [], decodeJid = (x) => x) {
  const index = new Map()
  const normalized = participants.map((p) => {
    const jid = normalizeJid(p?.jid || p?.id || p?.participant || '')
    const lid = String(p?.lid || p?.pn_lid || p?.phoneNumberLid || '').trim()
    const phone = normalizeJid(p?.phoneNumber || '')
    const item = { ...p, jid, id: jid || p?.id, lid, phoneNumber: phone, admin: normalizeAdmin(p) }

    for (const k of [item.jid, item.id, item.lid, item.phoneNumber]) {
      if (!k) continue
      index.set(k, item)
      index.set(jidLocal(k), item)
      try {
        const d = decodeJid(k)
        if (d) {
          index.set(d, item)
          index.set(jidLocal(d), item)
        }
      } catch {}
    }
    return item
  })
  return { participants: normalized, index }
}

function resolveParticipant(index, jid = '', decodeJid = (x) => x) {
  if (!jid) return null
  const keys = [jid, jidLocal(jid)]
  try {
    const d = decodeJid(jid)
    if (d) keys.push(d, jidLocal(d))
  } catch {}
  for (const k of keys) {
    if (!k) continue
    const hit = index.get(k)
    if (hit) return hit
  }
  return null
}

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || []
  this.uptime = this.uptime || Date.now()
  if (!chatUpdate?.messages?.length) return

  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return

  const rawTimestamp = typeof m.messageTimestamp === 'object' ? Number(m.messageTimestamp?.low || m.messageTimestamp) : Number(m.messageTimestamp)
  const messageTime = Number.isFinite(rawTimestamp) && rawTimestamp > 0 ? rawTimestamp * 1000 : Date.now()
  if ((Date.now() - messageTime) > STALE_MESSAGE_WINDOW_MS && !m?.message?.protocolMessage) return

  await this.pushMessage(chatUpdate.messages).catch(console.error)
  if (global.db && global.db.data == null) await global.loadDatabase()

  try {
    m = smsg(this, m) || m
    if (!m) return

    const opts = this.opts || global.opts || {}
    let sender = m.isGroup ? (m.key?.participant || m.sender) : (m.key?.remoteJid || m.sender)

    let groupMetadata = {}
    if (m.isGroup) {
      const cached = global.groupMetadataCache.get(m.chat)
      if (cached && (Date.now() - cached.ts) < GROUP_METADATA_CACHE_TTL_MS) {
        groupMetadata = cached.data || {}
      } else {
        const fresh = this.chats?.[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(() => null) || {}
        groupMetadata = fresh
        if (Object.keys(fresh).length) global.groupMetadataCache.set(m.chat, { data: fresh, ts: Date.now() })
      }
    }

    const { participants, index } = buildParticipantIndex(groupMetadata?.participants || [], this.decodeJid?.bind(this) || ((x) => x))

    // Resolver LID -> PN/JID para sender, quoted y mentions
    const senderP = resolveParticipant(index, sender, this.decodeJid?.bind(this) || ((x) => x))
    if (senderP?.jid) {
      sender = senderP.jid
      m.sender = senderP.jid
      if (m.key) m.key.participant = senderP.jid
    }

    if (m.quoted?.sender) {
      const qp = resolveParticipant(index, m.quoted.sender, this.decodeJid?.bind(this) || ((x) => x))
      if (qp?.jid) {
        m.quoted.sender = qp.jid
        if (m.quoted.key) m.quoted.key.participant = qp.jid
      }
    }

    if (Array.isArray(m.mentionedJid)) {
      m.mentionedJid = m.mentionedJid.map((jid) => resolveParticipant(index, jid, this.decodeJid?.bind(this) || ((x) => x))?.jid || jid)
    }

    if (!global.db.data.users[sender]) global.db.data.users[sender] = {}
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    if (!global.db.data.settings[this.user.jid]) global.db.data.settings[this.user.jid] = {}

    const userGroup = m.isGroup ? resolveParticipant(index, sender, this.decodeJid?.bind(this) || ((x) => x)) || {} : {}
    const botGroup = m.isGroup ? resolveParticipant(index, this.user.jid, this.decodeJid?.bind(this) || ((x) => x)) || {} : {}

    const isRAdmin = normalizeAdmin(userGroup) === 'superadmin'
    const isAdmin = isRAdmin || normalizeAdmin(userGroup) === 'admin'
    const isBotAdmin = ['admin', 'superadmin'].includes(normalizeAdmin(botGroup))

    // Guardamos flags confiables para plugins
    m.isAdmin = isAdmin
    m.isBotAdmin = isBotAdmin

    const senderNum = jidLocal(sender)
    const isROwner = global.owner.map(([n]) => String(n).replace(/\D/g, '')).includes(senderNum)
    const isOwner = isROwner
    const isMods = isOwner || global.mods.map(v => v.replace(/\D/g, '')).includes(senderNum)
    const _user = global.db.data.users[sender]
    const isPrems = isROwner || global.prems.map(v => v.replace(/\D/g, '')).includes(senderNum) || _user?.premium === true

    const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
    for (const name in global.plugins) {
      const plugin = global.plugins[name]
      if (!plugin || plugin.disabled || typeof plugin !== 'function') continue

      const str2Regex = s => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
      const _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
      const match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] :
        Array.isArray(_prefix) ? _prefix.map(p => { const re = p instanceof RegExp ? p : new RegExp(str2Regex(p)); return [re.exec(m.text), re] }) :
          typeof _prefix === 'string' ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] : [[[], new RegExp]])
        .find(p => p[1])

      if (!(match && match[0])) continue
      const usedPrefix = (match[0] || '')[0]
      if (!usedPrefix || ['>', '=>', '$'].includes(usedPrefix)) continue

      const noPrefix = m.text.replace(usedPrefix, '')
      const [command, ...args] = noPrefix.trim().split` `.filter(Boolean)
      if (!command) continue

      const cmd = command.toLowerCase()
      const isAccept = plugin.command instanceof RegExp ? plugin.command.test(cmd)
        : Array.isArray(plugin.command) ? plugin.command.some(c => c instanceof RegExp ? c.test(cmd) : c === cmd)
          : typeof plugin.command === 'string' ? plugin.command === cmd : false
      if (!isAccept) continue

      const fail = plugin.fail || global.dfail
      if (plugin.botAdmin && !isBotAdmin) { fail('botAdmin', m, this); continue }
      if (plugin.admin && !isAdmin) { fail('admin', m, this); continue }
      if (plugin.owner && !isOwner) { fail('owner', m, this); continue }
      if (plugin.mods && !isMods) { fail('mods', m, this); continue }
      if (plugin.premium && !isPrems) { fail('premium', m, this); continue }

      try {
        await plugin.call(this, m, { match, usedPrefix, noPrefix, args, command: cmd, text: args.join(' '), conn: this, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename: join(___dirname, name) })
      } catch (e) {
        console.error(e)
        m.reply(format(e))
      }
      break
    }
  } catch (e) {
    console.error(e)
  }
}

global.dfail = (type, m, conn) => { failureHandler(type, conn, m) }
const file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.green('Actualizando "handler.js"'))
  if (global.conns && global.conns.length > 0) {
    const users = [...new Set(global.conns.filter((conn) => conn.user && conn.ws && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED))]
    for (const userr of users) { try { userr.subreloadHandler(false) } catch {} }
  }
})