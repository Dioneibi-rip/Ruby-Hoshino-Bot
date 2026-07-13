import axios from '../../infra/http.js'
const CHATGPT_ENDPOINT = 'https://chatgptgratuit.app/wp-admin/admin-ajax.php'

function decorateAiReply(title, text) {
const body = String(text || 'Sin respuesta.').trim()
return `╭─❖ 𓆩 ${title} 𓆪 ❖─╮
│ 🧠 𝚁𝚞𝚋𝚢 𝙰𝙸 𝚕𝚘 𝚑𝚊 𝚜𝚞𝚜𝚞𝚛𝚛𝚊𝚍𝚘:
├─────────────────────
${body.split('\n').map(line => `│ ${line}`.trimEnd()).join('\n')}
├─────────────────────
│ ✦ 𝙿𝚎𝚐𝚊𝚍𝚘 𝚊 𝚕𝚊 𝚙𝚊𝚛𝚎𝚍 • 𝚁𝚞𝚋𝚢 𝙷𝚘𝚜𝚑𝚒𝚗𝚘
╰─❖ 𖹭 ─────────────╯`.trim()
}

function extractText(payload) {
if (typeof payload === 'string') return payload
const candidates = [
payload?.data?.message,
payload?.data?.reply,
payload?.data?.response,
payload?.data?.content,
payload?.message,
payload?.reply,
payload?.response,
payload?.content,
payload?.answer,
payload?.text,
]
for (const value of candidates) if (typeof value === 'string' && value.trim()) return value
const seen = new Set()
const stack = [payload]
while (stack.length) {
const node = stack.shift()
if (!node || seen.has(node)) continue
if (typeof node === 'object') seen.add(node)
if (typeof node === 'string' && node.trim().length > 1) return node
if (Array.isArray(node)) stack.push(...node)
else if (typeof node === 'object') stack.push(...Object.values(node))
}
return ''
}

async function askChatGPTGratuit(message) {
const form = new URLSearchParams()
form.set('action', 'aipkit_frontend_chat_message')
form.set('_ajax_nonce', 'ba71ebc353')
form.set('bot_id', '2617')
form.set('session_id', `ruby-${Date.now()}`)
form.set('conversation_uuid', `ruby-${Date.now()}-${Math.random().toString(16).slice(2)}`)
form.set('post_id', '1788')
form.set('message', message)
const { data } = await axios.post(CHATGPT_ENDPOINT, form, {
headers: {
Accept: 'application/json, text/javascript, */*; q=0.01',
'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
Origin: 'https://chatgptgratuit.app',
Referer: 'https://chatgptgratuit.app/',
'X-Requested-With': 'XMLHttpRequest'
},
timeout: 45000
})
return extractText(data)
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text?.trim()) return m.reply(decorateAiReply('ChatGPT', `Uso: *${usedPrefix}${command} <pregunta>*`))
await m.react?.('⏳')
try {
const answer = await askChatGPTGratuit(text.trim())
await conn.sendMessage(m.chat, { text: decorateAiReply('ChatGPT', answer) }, { quoted: m })
await m.react?.('✅')
} catch (error) {
console.error('[chatgpt]', error)
await m.react?.('💔')
await m.reply(decorateAiReply('ChatGPT', 'No pude conectar con ChatGPT. Intenta nuevamente en unos minutos.'))
}
}

handler.command = ['chatgpt', 'gpt', 'ia']
handler.help = ['chatgpt <pregunta>']
handler.tags = ['ai']
handler.limit = true
handler.register = true

export default handler
