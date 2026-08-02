import { buildAiPromptWithContext, rememberAiExchange } from '../../core/ai-context.js'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
const btoa2 = str => Buffer.from(str, 'utf8').toString('base64')
const atob2 = b64 => Buffer.from(b64, 'base64').toString('utf8')
const sessions = {}
function walkDeep(node, visit, depth = 0, maxDepth = 7) {
if (depth > maxDepth) return
if (visit(node, depth) === false) return
if (Array.isArray(node)) {
for (const x of node) walkDeep(x, visit, depth + 1, maxDepth)
} else if (node && typeof node === 'object') {
for (const k of Object.keys(node)) walkDeep(node[k], visit, depth + 1, maxDepth)
}
}
function cleanUrlCandidate(s, { stripSpaces = false } = {}) {
if (typeof s !== 'string') return ''
let t = s.trim().replace(/^['"]|['"]$/g, '').replace(/\\u003d/gi, '=').replace(/\\u0026/gi, '&').replace(/\\u002f/gi, '/').replace(/\\\//g, '/').replace(/\\/g, '').replace(/[\\'"\]\)>,.]+$/g, '')
if (stripSpaces) t = t.replace(/\s+/g, '')
return t
}
const looksLikeImageUrl = u => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(u) || /googleusercontent\.com|ggpht\.com/i.test(u)
function extractImageUrlsFromText(text) {
const out = new Set()
if (typeof text !== 'string' || !text) return []
const regex = /https:\/\/[\w\-.]+(?:googleusercontent\.com|ggpht\.com)[^\s"'<>)]+|https:\/\/[^\s"'<>)]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s"'<>)]*)?/gi
for (const m of (text.match(regex) || [])) {
const u = cleanUrlCandidate(m)
if (/googleusercontent\.com\/image_generation_content\/0$/.test(u)) continue
out.add(u)
}
return Array.from(out)
}
function isLikelyText(s) {
if (typeof s !== 'string') return false
const t = s.trim()
if (!t || t.length < 2 || /^https?:\/\//i.test(t) || /^\/\/www\./i.test(t) || /maps\/vt\/data/i.test(t)) return false
if (/^c_[0-9a-f]{6,}$/i.test(t) || (/^[A-Za-z0-9_\-+/=]{16,}$/.test(t) && !/\s/.test(t))) return false
if (/^\{.*\}$/.test(t) || /^\[.*\]$/.test(t)) return false
return t.length >= 8 || /\s/.test(t)
}
function pickBestTextFromAny(parsed) {
const found = []
walkDeep(parsed, n => { if (typeof n === 'string' && isLikelyText(n)) found.push(n.trim()) })
found.sort((a, b) => b.length - a.length)
return found[0] || ''
}
function findInnerPayloadString(outer) {
const candidates = []
const add = s => { if (typeof s === 'string' && s.trim()) candidates.push(s.trim()) }
add(outer?.[0]?.[2]); add(outer?.[2]); add(outer?.[0]?.[0]?.[2])
walkDeep(outer, n => { if (typeof n === 'string') { const t = n.trim(); if ((t.startsWith('[') || t.startsWith('{')) && t.length > 20) add(t) } }, 0, 5)
for (const s of candidates) { try { JSON.parse(s); return s } catch {} }
return null
}
function parseStream(data) {
if (typeof data !== 'string' || !data.trim()) throw new Error('Respuesta vacía')
if (/<html|<!doctype/i.test(data)) throw new Error('Gemini devolvió HTML')
const chunks = Array.from(data.matchAll(/^\d+\r?\n([\s\S]+?)\r?\n(?=\d+\r?\n|$)/gm)).map(m => m[1]).reverse()
if (!chunks.length) throw new Error('Respuesta inválida')
let best = { text: '', resumeArray: null, parsed: null }
for (const c of chunks) {
try {
const outer = JSON.parse(c)
const inner = findInnerPayloadString(outer)
if (!inner) continue
const parsed = JSON.parse(inner)
const text = pickBestTextFromAny(parsed)
const resumeArray = Array.isArray(parsed?.[1]) ? parsed[1] : null
if (!best.parsed || (text && text.length > (best.text?.length || 0))) best = { text, resumeArray, parsed }
} catch {}
}
if (!best.parsed) throw new Error('Respuesta inválida')
const urls = new Set(extractImageUrlsFromText(data))
walkDeep(best.parsed, (n, depth) => {
if (depth > 6) return false
if (typeof n !== 'string') return
const u = cleanUrlCandidate(n, { stripSpaces: true })
if (/^https:\/\//i.test(u) && looksLikeImageUrl(u)) urls.add(u)
}, 0, 7)
return { text: (best.text || '').replace(/\*\*(.+?)\*\*/g, '*$1*').trim(), resumeArray: best.resumeArray, images: Array.from(urls) }
}
async function getAnonCookie() {
const r = await fetch('https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&hl=en-US&rt=c', { 
method: 'POST', 
redirect: 'manual', 
headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': UA }, 
body: 'f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&' 
})
const setCookie = r.headers.get('set-cookie')
if (!setCookie) throw new Error('Sin cookies de Gemini')
return setCookie.split(';')[0]
}
async function getXsrfToken(cookieHeader) {
try {
const res = await fetch('https://gemini.google.com/app', { headers: { 'user-agent': UA, cookie: cookieHeader, accept: 'text/html' } })
const html = await res.text()
return html.match(/"SNlM0e":"([^"]+)"/)?.[1] || html.match(/"at":"([^"]+)"/)?.[1] || null
} catch { return null }
}
async function askGemini(prompt) {
let lastErr = null
for (let attempt = 1; attempt <= 3; attempt++) {
try {
const cookie = await getAnonCookie()
const xsrf = await getXsrfToken(cookie)
const params = { 'f.req': JSON.stringify([null, JSON.stringify([[prompt.trim()], ['en-US'], null])]) }
if (xsrf) params.at = xsrf
const response = await fetch('https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?hl=en-US&rt=c', { 
method: 'POST', 
headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': UA, 'x-same-domain': '1', cookie }, 
body: new URLSearchParams(params) 
})
if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
const parsed = parseStream(await response.text())
return { text: parsed.text, images: parsed.images }
} catch (e) { 
lastErr = e; 
if (attempt < 3) await new Promise(r => setTimeout(r, 700)) 
}
}
throw lastErr || new Error('Error desconocido')
}
let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text) return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖯𝗈𝗋 𝖿⍺𝗏𝗈𝗋 𝗂𝗇𝗀𝗋𝖾𝗌⍺ 𝗎𝗇⍺ 𝗉𝗋𝖾𝗀𝗎𝗇𝗍⍺ 𝗉⍺𝗋⍺ 𝖦𝖾𝗆𝗂𝗇𝗂... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} ¿𝖰𝗎𝗂𝖾́𝗇 𝖾𝗋𝖾𝗌?*`)
await m.react('⏳')
const userId = m.sender || m.chat
sessions[userId] = sessions[userId] || {}
try {
const prompt = buildAiPromptWithContext('gemini', userId, text, { maxMessages: 8 })
let res = await askGemini(prompt)
rememberAiExchange('gemini', userId, text, res.text, { maxMessages: 8 })
if (res.images?.length) {
await conn.sendMessage(m.chat, { image: { url: res.images[0] }, caption: res.text || '🖼️' }, { quoted: m })
} else {
await conn.sendMessage(m.chat, { text: res.text || '> (っ- ‸ - ς) 𝖲𝗂𝗇 𝗋𝖾𝗌𝗉𝗎𝖾𝗌𝗍⍺...' }, { quoted: m })
}
await m.react('✅')
} catch (e) {
console.error('[Ruby Hoshino - Gemini Error]:', e)
await m.react('💔')
await m.reply(`> (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖼𝗈𝗇 𝖦𝖾𝗆𝗂𝗇𝗂... ✨\n\n> 💡 *𝖣𝖾𝗍⍺𝗅𝗅𝖾:* \`${e.message}\``)
}
}
handler.command = ['gemini', 'gemi']
handler.help = ['gemini <pregunta>']
handler.tags = ['ai']
export default handler