import axios from '../../library/http.js'
import crypto from 'crypto'
const sessions = {}
const generateUUID = () => {
if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
const r = Math.random() * 16 | 0
return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
})
}
const parseCookies = (headerInfo) => {
if (!headerInfo) return {}
const arr = Array.isArray(headerInfo) ? headerInfo : [headerInfo]
return Object.fromEntries(
arr.map(c => {
const parts = String(c).split(';')[0].split('=')
return [parts[0]?.trim(), parts.slice(1).join('=').trim()]
}).filter(p => p[0])
)
}
function cleanSpecialTags(text) {
if (!text) return ''
return text.replace(/\ue200entity\ue202([^\ue201]+)\ue201/g, (match, p1) => {
try {
const arr = JSON.parse(p1)
return arr[1] || arr[0] || ''
} catch {
return ''
}
}).replace(/\ue200[^\ue201]*\ue201/g, '').trim()
}
async function getSession() {
const deviceId = generateUUID()
try {
const res = await axios.post('https://android.chat.openai.com/backend-anon/sentinel/chat-requirements', {}, {
headers: {
'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
'OAI-Package-Name': 'com.openai.chatgpt',
'OAI-Client-Type': 'android',
'OAI-Device-Id': deviceId,
'Accept-Language': 'es-ES,es;q=0.9',
'X-Device-Tier': 'upper_mid',
'X-OpenAI-Target-Path': '/backend-anon/sentinel/chat-requirements',
'Accept': 'application/json',
'Content-Type': 'application/json'
},
timeout: 15000
})
const cookies = parseCookies(res.headers['set-cookie'])
const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
return { cookie: cookieStr, deviceId, parentMessageId: generateUUID(), chatReqToken: res.data?.token || '' }
} catch (error) {
throw new Error(`𝖫⍺ 𝖨𝖯 𝗉𝗎𝖾𝖽𝖾 𝖾𝗌𝗍⍺𝗋 𝖻𝗅𝗈𝗊𝗎𝖾⍺𝖽⍺. (${error.message})`)
}
}
async function chatgpt(prompt, auth = null, chatId = null) {
auth = auth || await getSession()
if (!auth.deviceId) auth = await getSession()
const currentMessageId = generateUUID()
const headers = {
'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
'OAI-Package-Name': 'com.openai.chatgpt',
'OAI-Client-Type': 'android',
'OAI-Device-Id': auth.deviceId,
'Accept-Language': 'es-ES,es;q=0.9',
'X-OpenAI-Target-Path': '/backend-anon/f/conversation',
'Content-Type': 'application/json',
'Accept': 'text/event-stream',
'Cookie': auth.cookie
}
if (auth.chatReqToken) {
headers['OpenAI-Sentinel-Chat-Requirements-Token'] = auth.chatReqToken
}
const body = {
action: "next",
messages: [{
id: currentMessageId,
author: { role: "user" },
content: { content_type: "text", parts: [prompt] },
status: "finished_successfully",
recipient: "all"
}],
model: "auto",
history_and_training_disabled: false,
force_use_sse: true,
parent_message_id: auth.parentMessageId
}
if (chatId) {
body.conversation_id = chatId
}
try {
const streamReq = await axios.post(`https://android.chat.openai.com/backend-anon/f/conversation`, body, {
headers,
responseType: 'stream',
timeout: 30000
})
return new Promise((resolve, reject) => {
let text = '', buf = '', finalChatId = chatId, currentAssistantMsgId = null
const processChunk = (chunk) => {
if (!chunk) return
buf += chunk.toString()
const lines = buf.split('\n')
buf = lines.pop()
for (const line of lines) {
const trimmed = line.trim()
if (!trimmed || trimmed === 'data: [DONE]') continue
if (trimmed.startsWith('data: ')) {
try {
const data = JSON.parse(trimmed.substring(6))
if (data.conversation_id) finalChatId = data.conversation_id
const msg = data.v?.message || data.message
if (msg?.author?.role === 'assistant') {
currentAssistantMsgId = msg.id
if (msg.content?.parts?.[0]) text = msg.content.parts[0]
}
} catch (e) {}
}
}
}
const finishProcessing = () => {
if (!text) return reject(new Error('𝖫⍺ 𝖨𝖠 𝗇𝗈 𝖽𝖾𝗏𝗈𝗅𝗏𝗂𝗈́ 𝗍𝖾𝗑𝗍𝗈.'))
if (currentAssistantMsgId) auth.parentMessageId = currentAssistantMsgId
resolve({ response: cleanSpecialTags(text), chatId: finalChatId, auth })
}
const data = streamReq.data
if (typeof data === 'string') {
processChunk(data)
processChunk('\n\n')
finishProcessing()
} else if (data && typeof data.on === 'function') {
data.on('data', processChunk)
data.on('end', finishProcessing)
data.on('error', (err) => reject(err))
}
})
} catch (error) {
throw new Error(error.message)
}
}
let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text?.trim()) return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖯𝗈𝗋 𝖿⍺𝗏𝗈𝗋 𝗂𝗇𝗀𝗋𝖾𝗌⍺ 𝗎𝗇⍺ 𝗉𝗋𝖾𝗀𝗎𝗇𝗍⍺ 𝗉⍺𝗋⍺ 𝗅⍺ 𝖨𝖠... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} ¿𝖢𝗎⍺́𝗇𝗍𝗈 𝖾𝗌 𝟤+𝟤?*`)
await m.react?.('⏳')
try {
const userId = m.sender || m.chat
sessions[userId] = sessions[userId] || {}
const result = await chatgpt(text.trim(), sessions[userId].auth, sessions[userId].chatId)
sessions[userId].auth = result.auth
sessions[userId].chatId = result.chatId
await conn.sendMessage(m.chat, { text: result.response }, { quoted: m })
await m.react?.('✅')
} catch (error) {
sessions[m.sender || m.chat] = {}
console.error('[chatgpt error]:', error.message)
await m.react?.('💔')
await m.reply(`> (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖼𝗈𝗇 𝗅⍺ 𝖨𝖠... ✨\n\n> 💡 *𝖣𝖾𝗍⍺𝗅𝗅𝖾:* \`${error.message}\``)
}
}
handler.command = ['chatgpt', 'gpt', 'ia']
handler.help = ['chatgpt <pregunta>']
handler.tags = ['ai']
handler.limit = true
handler.register = true
export default handler