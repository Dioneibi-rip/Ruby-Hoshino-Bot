import { isChatBannedForBot, normalizeSessionJid } from '../../src/core/session-utils.js'
export async function all(m) {
    if (!m.chat.endsWith('.net') || m.fromMe || m.key.remoteJid.endsWith('status@broadcast')) return
    if (isChatBannedForBot(global.db.getChat(m.chat), normalizeSessionJid(this))) return
    if (global.db.getUser(m.sender).banned) return
    if (m.isBaileys) return
    let msgs = global.db.getSection('msgs')
    if (!(m.text in msgs)) return
    let _m = this.serializeM(JSON.parse(JSON.stringify(msgs[m.text]), (_, v) => {
        if (
            v !== null &&
            typeof v === 'object' &&
            'type' in v &&
            v.type === 'Buffer' &&
            'data' in v &&
            Array.isArray(v.data)) {
            return Buffer.from(v.data)
        }
        return v
    }))
    await _m.copyNForward(m.chat, true)
}