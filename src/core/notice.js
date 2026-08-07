const RUBY_FONT_MAP = {
a: 'ᥲ', b: 'b', c: 'ᥴ', d: 'ძ', e: 'ᥱ', f: '𝖿', g: 'g', h: 'h', i: 'і', j: 'j', k: 'k', l: 'ᥣ', m: 'm',
n: 'ᥒ', o: '᥆', p: '⍴', q: 'q', r: 'r', s: 's', t: '𝗍', u: 'ᥙ', v: 'v', w: 'w', x: 'x', y: 'y', z: 'z'
}

export const FKONTAK_DEFAULT_NAME = 'Rᥙby H᥆shіᥒ᥆'

export function toRubyFont(text = '') {
return String(text ?? '').split('').map((char) => {
const lower = char.toLowerCase()
return RUBY_FONT_MAP[lower] || char
}).join('')
}

export function buildFkontak(name = FKONTAK_DEFAULT_NAME) {
const safeName = String(name || FKONTAK_DEFAULT_NAME).replace(/[\r\n]+/g, ' ').trim() || FKONTAK_DEFAULT_NAME
const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${safeName};;;\nFN:${safeName}\nitem1.TEL;waid=0:0\nitem1.X-ABLabel:Ruby\nEND:VCARD`
return {
key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'RubyHoshinoNotice' },
message: { contactMessage: { displayName: safeName, vcard } },
participant: '0@s.whatsapp.net'
}
}

export async function replyWithFkontak(conn, m, text, { name = FKONTAK_DEFAULT_NAME, mentions = [] } = {}) {
const chat = m?.chat || m?.key?.remoteJid
if (!chat || !text) return false
const quoted = buildFkontak(name) || m
const options = mentions?.length ? { mentions } : {}
try {
if (typeof conn?.reply === 'function') return await conn.reply(chat, text, quoted, options)
if (typeof conn?.sendMessage === 'function') return await conn.sendMessage(chat, { text, ...options }, { quoted })
} catch (error) {
console.error('[notice] no se pudo enviar con fkontak:', error?.message || error)
try {
if (typeof conn?.reply === 'function') return await conn.reply(chat, text, m, options)
} catch (fallbackError) {
console.error('[notice] fallback falló:', fallbackError?.message || fallbackError)
}
}
return false
}

export function buildUnknownCommandNotice(usedPrefix = '', command = '') {
return `(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ᥴ᥆mᥲᥒძ᥆ *${usedPrefix}${command}* ᥒ᥆ sᥱ ᥱᥒᥴᥙᥱᥒ𝗍rᥲ rᥱgіs𝗍rᥲძ᥆.\n\n⍴ᥲrᥲ ᥴ᥆ᥒsᥙᥣ𝗍ᥲr ᥣᥲ ᥣіs𝗍ᥲ ᥴ᥆m⍴ᥣᥱ𝗍ᥲ ძᥱ 𝖿ᥙᥒᥴі᥆ᥒᥲᥣіძᥲძᥱs ᥙsᥲ:\n» *${usedPrefix}help*`
}

export function buildCooldownNotice({ usedPrefix = '', command = '', remaining = '' } = {}) {
return `(,,•᷄‎ࡇ•᷅ ,,)? ᥱs⍴ᥱrᥲ ᥙᥒ ⍴᥆ᥴ᥆ ᥲᥒ𝗍ᥱs ძᥱ ᥙsᥲr *${usedPrefix}${command}* ძᥱ ᥒᥙᥱv᥆.\n\n⏳ 𝗍іᥱm⍴᥆ rᥱs𝗍ᥲᥒ𝗍ᥱ: *${remaining}*`
}

export default { toRubyFont, buildFkontak, replyWithFkontak, buildUnknownCommandNotice, buildCooldownNotice, FKONTAK_DEFAULT_NAME }
