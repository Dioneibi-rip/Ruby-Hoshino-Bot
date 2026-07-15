//código creado por Felix-Dev 
//si lo quieres usar deja creditos

import axios from '../../infra/http.js'
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
'Accept-Language': 'id-ID,in;q=0.9',
'X-Device-Tier': 'upper_mid',
'X-OpenAI-Target-Path': '/backend-anon/sentinel/chat-requirements',
'ChatGPT-Account-Id': 'default',
'ChatGPT-Residency-Region': 'no_constraint',
'Accept': 'application/json',
'Content-Type': 'application/json'
},
timeout: 15000
})
const cookies = parseCookies(res.headers['set-cookie'])
const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
let oaiSc = cookies['oai-sc']
if (!oaiSc && res.data?.token) oaiSc = `0${res.data.token}`
const cookie = oaiSc && !cookieStr.includes('oai-sc') ? `oai-sc=${oaiSc}; ${cookieStr}` : cookieStr
return { cookie, deviceId, parentMessageId: generateUUID() }
} catch (error) {
throw new Error(`𝖤𝗋𝗋𝗈𝗋 𝟦𝟢𝟥/𝟦𝟤𝟫: 𝖫⍺ 𝖨𝖯 𝗉𝗎𝖾𝖽𝖾 𝖾𝗌𝗍⍺𝗋 𝖻𝗅𝗈𝗊𝗎𝖾⍺𝖽⍺ 𝗈 𝗌𝗂𝗇 𝖼𝗈𝗇𝖾𝗑𝗂𝗈́𝗇. (${error.message})`)
}
}
async function chatgpt(prompt, auth = null, chatId = null) {
auth = auth || await getSession()
if (!auth.deviceId) auth.deviceId = generateUUID()
if (!auth.parentMessageId) auth.parentMessageId = generateUUID()
const isAuthorized = !!(auth.authorization || auth.token)
const baseUrl = isAuthorized ? 'https://android.chat.openai.com/backend-api' : 'https://android.chat.openai.com/backend-anon'
const currentMessageId = generateUUID()
const headers = {
'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
'OAI-Package-Name': 'com.openai.chatgpt',
'OAI-Client-Type': 'android',
'OAI-Device-Id': auth.deviceId,
'Accept-Language': 'id-ID,in;q=0.9',
'X-Device-Tier': 'upper_mid',
'X-OpenAI-Target-Path': isAuthorized ? '/backend-api/f/conversation' : '/backend-anon/f/conversation',
'ChatGPT-Account-Id': isAuthorized ? (auth.accountId || 'default') : 'default',
'ChatGPT-Residency-Region': 'no_constraint',
'Content-Type': 'application/json',
'Accept': 'text/event-stream',
'Cookie': auth.cookie,
'X-Sentinel-Payload': JSON.stringify({
bot_token: {
failure_reason: "-2: Standard Integrity API error (-2): The Play Store app is either not installed or not the official version.",
failure_detail: "[qdb0.j(SourceFile:9)]"
}
})
}
if (isAuthorized) headers['Authorization'] = auth.authorization || `Bearer ${auth.token}`
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
fork_from_shared_post: false,
enable_message_followups: true,
force_use_sse: true,
force_use_search: null,
force_paragen: false,
supported_encodings: ["v1"],
supports_buffering: true,
timezone: "America/Santo_Domingo",
timezone_offset_min: 240,
system_hints: [],
is_onboarding_conversation: false,
no_auth_ad_preferences: { personalization_enabled: true, history_enabled: true },
client_prepare_state: "none",
stream: true
}
if (chatId) {
body.conversation_id = chatId
body.parent_message_id = auth.parentMessageId
}
try {
const streamReq = await axios.post(`${baseUrl}/f/conversation`, body, {
headers,
responseType: 'stream',
timeout: 30000
})
return new Promise(async (resolve, reject) => {
let text = '', buf = '', lastPath = null, lastOp = null, finalChatId = chatId, currentAssistantMsgId = null
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
const p = data.p !== undefined ? data.p : lastPath
const o = data.o !== undefined ? data.o : lastOp
if (data.p !== undefined) lastPath = data.p
if (data.o !== undefined) lastOp = data.o
if (o === 'add' && data.v?.message?.author?.role === 'assistant') {
currentAssistantMsgId = data.v.message.id
if (data.v.message.content?.parts?.[0]) text = data.v.message.content.parts[0]
} else if (o === 'patch' && Array.isArray(data.v)) {
for (const op of data.v) {
if (op.o === 'append' && op.p?.startsWith('/message/content/parts/')) text += op.v
}
} else if (o === 'append' && p?.startsWith('/message/content/parts/') && typeof data.v === 'string') {
text += data.v
}
} catch (e) {}
}
}
}
const finishProcessing = () => {
if (!text) return reject(new Error('𝖫⍺ 𝖨𝖠 𝗇𝗈 𝖽𝖾𝗏𝗈𝗅𝗏𝗂𝗈́ 𝗇𝗂𝗇𝗀𝗎́𝗇 𝗍𝖾𝗑𝗍𝗈.'))
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
data.on('error', (err) => reject(new Error(err.message)))
} else if (data && typeof data[Symbol.asyncIterator] === 'function') {
try {
for await (const chunk of data) processChunk(chunk)
finishProcessing()
} catch (err) {
reject(new Error(err.message))
}
} else {
reject(new Error(`𝖥𝗈𝗋𝗆⍺𝗍𝗈 𝖽𝖾𝗌𝖼𝗈𝗇𝗈𝖼𝗂𝖽𝗈 𝖾𝗇 𝗅⍺ 𝗋𝖾𝗌𝗉𝗎𝖾𝗌𝗍⍺.`))
}
})
} catch (error) {
throw new Error(`𝖤𝗋𝗋𝗈𝗋 ⍺𝗅 𝖼𝗈𝗇𝖾𝖼𝗍⍺𝗋 𝖼𝗈𝗇 𝗅⍺ 𝖨𝖠: ${error.message}`)
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
console.error('[chatgpt handler error]:', error.message)
await m.react?.('💔')
const errorReport = `> (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖼𝗈𝗇 𝗅⍺ 𝖨𝖠... ✨\n\n> 💡 *𝖣𝖾𝗍⍺𝗅𝗅𝖾:* \`${error.message}\``
await m.reply(errorReport)
}
}
handler.command = ['chatgpt', 'gpt', 'ia']
handler.help = ['chatgpt <pregunta>']
handler.tags = ['ai']
handler.limit = true
handler.register = true
export default handler