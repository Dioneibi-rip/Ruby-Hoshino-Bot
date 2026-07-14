import WebSocket from 'ws'
import { buildAiPromptWithContext, rememberAiExchange } from '../../core/ai-context.js'
const sessions = {}
async function copilotChat(message, model = 'default', existingConv = null) {
const models = { default: 'chat', 'think-deeper': 'reasoning', 'gpt-5': 'smart' }
if (!models[model]) throw new Error(`Modelos disponibles: ${Object.keys(models).join(', ')}`)
let conversationId = existingConv
if (!conversationId) {
const res = await fetch('https://copilot.microsoft.com/c/api/conversations', { method: 'POST', headers: { origin: 'https://copilot.microsoft.com', 'user-agent': 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.6723.86 Mobile Safari/537.36' } })
const data = await res.json()
conversationId = data.id
}
return new Promise((resolve, reject) => {
const ws = new WebSocket('wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1', { headers: { origin: 'https://copilot.microsoft.com', 'user-agent': 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.6723.86 Mobile Safari/537.36' } })
const response = { text: '', citations: [], conversationId }
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
async function handler(m, { text, conn, usedPrefix, command }) {
if (!text) return m.reply(`> ヾ(˶ᵔ ᗜ ᵔ˶) 𝖯𝗈𝗋 𝖿⍺𝗏𝗈𝗋 𝗂𝗇𝗀𝗋𝖾𝗌⍺ 𝗎𝗇⍺ 𝗉𝗋𝖾𝗀𝗎𝗇𝗍⍺ 𝗉⍺𝗋⍺ 𝖢𝗈𝗉𝗂𝗅𝗈𝗍... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} ¿𝖰𝗎𝗂𝖾́𝗇 𝖾𝗋𝖾𝗌?*`)
await m.react('⏳')
const userId = m.sender || m.chat
sessions[userId] = sessions[userId] || {}
try {
const prompt = buildAiPromptWithContext('copilot', userId, text, { maxMessages: 8 })
const result = await copilotChat(prompt, 'default', sessions[userId].conversationId)
sessions[userId].conversationId = result.conversationId
rememberAiExchange('copilot', userId, text, result.text, { maxMessages: 8 })
await conn.sendMessage(m.chat, { text: result.text || '> (っ- ‸ - ς) 𝖲𝗂𝗇 𝗋𝖾𝗌𝗉𝗎𝖾𝗌𝗍⍺...' }, { quoted: m })
await m.react('✅')
} catch (error) {
console.error('[Ruby Hoshino - Copilot Error]:', error)
await m.react('💔')
await m.reply(`> (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖼𝗈𝗇 𝖢𝗈𝗉𝗂𝗅𝗈𝗍... ✨\n\n> 💡 *𝖣𝖾𝗍⍺𝗅𝗅𝖾:* \`${error.message}\``)
}
}
handler.help = ['copilot']
handler.tags = ['ai']
handler.command = ['copilot']
handler.limit = true
handler.register = true
handler.group = true
export default handler