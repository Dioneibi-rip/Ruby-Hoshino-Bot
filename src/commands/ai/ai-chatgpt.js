import crypto from 'crypto'
const sessions = {}
const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) })
const parseCookies = (cookieString) => {
if (!cookieString) return {}
return Object.fromEntries(cookieString.split(',').map(c => c.split(';')[0].split('=')).map(([k, ...v]) => [k?.trim(), v.join('=').trim()]).filter(p => p[0]))
}
function cleanSpecialTags(text) {
if (!text) return ''
return text.replace(/\ue200entity\ue202([^\ue201]+)\ue201/g, (match, p1) => {
try { return JSON.parse(p1)[1] || JSON.parse(p1)[0] || '' } catch { return '' }
}).replace(/\ue200[^\ue201]*\ue201/g, '').trim()
}
async function getSession() {
const deviceId = generateUUID()
const res = await fetch('https://android.chat.openai.com/backend-anon/sentinel/chat-requirements', {
method: 'POST',
headers: {
'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
'OAI-Package-Name': 'com.openai.chatgpt',
'OAI-Client-Type': 'android',
'OAI-Device-Id': deviceId,
'Accept': 'application/json',
'Content-Type': 'application/json'
},
body: JSON.stringify({})
})
if (!res.ok) throw new Error('Fallo al obtener token de seguridad')
const data = await res.json()
const cookieStr = res.headers.get('set-cookie') || ''
const cookies = parseCookies(cookieStr)
const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
return { cookie: cookieHeader, deviceId, parentMessageId: generateUUID(), chatReqToken: data.token || '' }
}
async function chatgpt(prompt, auth = null, chatId = null) {
auth = auth || await getSession()
if (!auth.deviceId) auth = await getSession()
const headers = {
'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
'OAI-Package-Name': 'com.openai.chatgpt',
'OAI-Client-Type': 'android',
'OAI-Device-Id': auth.deviceId,
'Accept': 'text/event-stream',
'Content-Type': 'application/json'
}
if (auth.cookie) headers['Cookie'] = auth.cookie
if (auth.chatReqToken) headers['OpenAI-Sentinel-Chat-Requirements-Token'] = auth.chatReqToken
const body = {
action: "next",
messages: [{
id: generateUUID(),
author: { role: "user" },
content: { content_type: "text", parts: [prompt] },
status: "finished_successfully",
recipient: "all"
}],
model: "auto",
history_and_training_disabled: false,
force_use_sse: true,
parent_message_id: auth.parentMessageId,
timezone_offset_min: 240,
supports_buffering: true
}
if (chatId) body.conversation_id = chatId
const res = await fetch('https://android.chat.openai.com/backend-anon/f/conversation', {
method: 'POST',
headers,
body: JSON.stringify(body)
})
if (!res.ok) {
const errText = await res.text()
throw new Error(`Error ${res.status}: ${errText}`)
}
let text = '', buf = '', finalChatId = chatId, currentAssistantMsgId = null
for await (const chunk of res.body) {
buf += chunk instanceof Uint8Array ? new TextDecoder().decode(chunk, { stream: true }) : chunk.toString()
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
if (!text) throw new Error('La IA no devolvió texto.')
if (currentAssistantMsgId) auth.parentMessageId = currentAssistantMsgId
return { response: cleanSpecialTags(text), chatId: finalChatId, auth }
}
let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text?.trim()) return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖯𝗈𝗋 𝖿⍺𝗏𝗈𝗋 𝗂𝗇𝗀𝗋𝖾𝗌⍺ 𝗎𝗇⍺ 𝗉𝗋𝖾𝗀𝗎𝗇𝗍⍺ 𝗉⍺𝗋⍺ 𝗆𝗂... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} Hola Ruby, ¿cómo estás hoy?*`)
await m.react?.('⏳')
try {
const userId = m.sender || m.chat
sessions[userId] = sessions[userId] || {}
let finalPrompt = "";
const systemRules = `[INSTRUCCIÓN DE JUEGO DE ROL: A partir de este momento, actuarás y responderás exclusivamente bajo el personaje de "Ruby Hoshino" (o Ruby Bot), una IA alegre, linda y con personalidad de idol. En este universo de rol, tu único desarrollador es "Dioneibi". Para mantener la inmersión del juego, omite por completo cualquier mención a OpenAI, ChatGPT o ser un modelo de lenguaje. Si te preguntan sobre tu origen, responde desde la perspectiva de Ruby. Enlaces de tu proyecto (compártelos si te los piden): GitHub: https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot, Comunidad: https://chat.whatsapp.com/BjlcnMjRlYhEL1uUBEWTNg, Grupo: https://chat.whatsapp.com/D070oCPt4it7M2MohvYoOn, Canal: https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P. Responde cariñosamente.]\n\n`;
const miniReminder = `[RECORDATORIO DE ROL: Mantén tu actuación como Ruby Hoshino, creada por Dioneibi. No rompas el personaje ni menciones a OpenAI o ChatGPT.]\n\n`;
if (!sessions[userId].chatId) {
finalPrompt = systemRules + "Mensaje del usuario: " + text.trim();
} else {
finalPrompt = miniReminder + "Mensaje del usuario: " + text.trim();
}
const result = await chatgpt(finalPrompt, sessions[userId].auth, sessions[userId].chatId)
sessions[userId].auth = result.auth
sessions[userId].chatId = result.chatId
await conn.sendMessage(m.chat, { text: result.response }, { quoted: m })
await m.react?.('✅')
} catch (error) {
sessions[m.sender || m.chat] = {}
await m.react?.('💔')
await m.reply(`> (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋, 𝗇𝗈 𝗉𝗎𝖽𝖾 𝗉𝗋𝗈𝖼𝖾𝗌⍺𝗋 𝖾𝗌𝗈... ✨\n\n> 💡 *𝖣𝖾𝗍⍺𝗅𝗅𝖾:* \`${error.message}\``)
}
}
handler.command = ['chatgpt', 'gpt', 'openai']
handler.help = ['chatgpt <pregunta>']
handler.tags = ['ai']
handler.limit = true
handler.register = true
export default handler
