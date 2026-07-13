import WebSocket from 'ws'
function decorateAiReply(title, text) {
const body = String(text || 'Sin respuesta.').trim()
return `╭─❖ 𓆩 ${title} 𓆪 ❖─╮
│ 🤖 𝚁𝚞𝚋𝚢 𝙰𝙸 𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚎:
├─────────────────────
${body.split('\n').map(line => `│ ${line}`.trimEnd()).join('\n')}
├─────────────────────
│ ✦ 𝙰𝚕𝚒𝚗𝚎𝚊𝚍𝚘 𝚊 𝚕𝚊 𝚒𝚣𝚚𝚞𝚒𝚎𝚛𝚍𝚊
╰─❖ 𖹭 ─────────────╯`.trim()
}

async function copilotChat(message, model = 'default') {
const models = { default: 'chat', 'think-deeper': 'reasoning', 'gpt-5': 'smart' }
if (!models[model]) throw new Error(`Modelos disponibles: ${Object.keys(models).join(', ')}`)
const res = await fetch('https://copilot.microsoft.com/c/api/conversations', { method: 'POST', headers: { origin: 'https://copilot.microsoft.com', 'user-agent': 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.6723.86 Mobile Safari/537.36' } })
const { id: conversationId } = await res.json()
return new Promise((resolve, reject) => {
const ws = new WebSocket('wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1', { headers: { origin: 'https://copilot.microsoft.com', 'user-agent': 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.6723.86 Mobile Safari/537.36' } })
const response = { text: '', citations: [] }
ws.on('open', () => {
ws.send(JSON.stringify({ event: 'setOptions', supportedFeatures: ['partial-generated-images'], supportedCards: ['weather', 'local', 'image', 'sports', 'video', 'ads', 'finance'], ads: { supportedTypes: ['text', 'product', 'multimedia'] } }))
ws.send(JSON.stringify({ event: 'send', mode: models[model], conversationId, content: [{ type: 'text', text: message }], context: {} }))
})
ws.on('message', chunk => {
try {
const parsed = JSON.parse(chunk.toString())
if (parsed.event === 'appendText') response.text += parsed.text || ''
else if (parsed.event === 'citation') response.citations.push({ title: parsed.title, icon: parsed.iconUrl, url: parsed.url })
else if (parsed.event === 'done') { resolve(response); ws.close() }
else if (parsed.event === 'error') { reject(new Error(parsed.message)); ws.close() }
} catch (error) { reject(error) }
})
ws.on('error', reject)
})
}

async function handler(m, { text, conn }) {
if (!text) return m.reply(decorateAiReply('Copilot', 'Por favor, ingresa una petición.\nEjemplo: *.copilot quién eres?*'))
const processingMsg = await conn.sendMessage(m.chat, { text: decorateAiReply('Copilot', '⏳ Procesando tu petición...') }, { quoted: m })
try {
const result = await copilotChat(text)
await conn.sendMessage(m.chat, { text: decorateAiReply('Copilot', result.text || '❌ Sin respuesta'), edit: processingMsg.key })
} catch (error) {
console.error('Error en Copilot:', error)
await conn.sendMessage(m.chat, { text: decorateAiReply('Copilot', '❌ Error al conectar con Copilot'), edit: processingMsg.key })
}
}

handler.help = ['copilot']
handler.tags = ['ai']
handler.command = ['copilot']
handler.limit = true
handler.register = true
handler.group = true

export default handler
