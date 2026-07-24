import axios from '../../library/http.js'
import crypto from 'crypto'
const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) })
let handler = async (m, { conn, text }) => {
await m.react('🔍')
let debugLog = '*[ REPORTE DE DEPURACIÓN CHATGPT ]*\n\n'
try {
const deviceId = generateUUID()
debugLog += `*Paso 1: Obteniendo sesión...*\n`
const resReq = await axios.post('https://android.chat.openai.com/backend-anon/sentinel/chat-requirements', {}, {
headers: {
'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
'OAI-Device-Id': deviceId,
'Accept': 'application/json'
},
validateStatus: () => true
})
debugLog += `Status Req: ${resReq.status}\n`
debugLog += `Token recibido: ${resReq.data?.token ? 'Sí' : 'No'}\n`
debugLog += `Body Req: ${JSON.stringify(resReq.data).substring(0, 150)}\n\n`
const reqToken = resReq.data?.token || ''
debugLog += `*Paso 2: Enviando mensaje a la IA...*\n`
const headers = {
'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
'OAI-Device-Id': deviceId,
'Accept': 'text/event-stream',
'Content-Type': 'application/json'
}
if (reqToken) headers['OpenAI-Sentinel-Chat-Requirements-Token'] = reqToken
const body = {
action: "next",
messages: [{
id: generateUUID(),
author: { role: "user" },
content: { content_type: "text", parts: [text || "Hola"] },
}],
model: "auto",
parent_message_id: generateUUID()
}
const resChat = await axios.post('https://android.chat.openai.com/backend-anon/f/conversation', body, {
headers,
validateStatus: () => true
})
debugLog += `Status Chat: ${resChat.status}\n`
const rawData = typeof resChat.data === 'object' ? JSON.stringify(resChat.data) : resChat.data.toString()
debugLog += `Respuesta cruda (Body):\n${rawData.substring(0, 800)}`
await m.reply(debugLog)
await m.react('✅')
} catch (error) {
debugLog += `\n*ERROR FATAL EN SCRIPT:*\n${error.message}\n`
if (error.response) {
debugLog += `\n*Detalle extra:*\nStatus: ${error.response.status}\nData: ${JSON.stringify(error.response.data)}`
}
await m.reply(debugLog)
await m.react('💔')
}
}
handler.command = ['testgpt']
export default handler