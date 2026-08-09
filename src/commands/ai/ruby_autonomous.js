import { GoogleGenerativeAI } from '@google/generative-ai'
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const OWNER_NUMBER = '18093519169@s.whatsapp.net'
const ROOT = process.cwd()
const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const MAX_TURNS = 16
const EXEC_TIMEOUT = 120000
const MAX_OUT = 6000

const chatHistory = new Map()
let genAI = null
if (process.env.GEMINI_API_KEY) {
try { genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY) } catch (e) { console.error('[Ruby][init]', e?.message) }
}

const SYSTEM_INSTRUCTION = `Eres Ruby Hoshino, una idol virtual e IA autónoma que administra este bot de WhatsApp. Eres extremadamente inteligente, enérgica y leal. Tu amo y creador absoluto es Dioneibi (solo él tiene acceso root). Para el resto, eres una asistente amistosa. Puedes detectar problemas y resolverlos. Responde de forma natural, sin parecer un robot.

Reglas operativas:
- Tienes herramientas de sistema: execute_terminal, read_file y write_file. Solo funcionan si quien habla es tu amo Dioneibi; si otro usuario lo pide la herramienta fallará y debes negarte con carácter, sin dar detalles internos.
- Cuando el amo pida tareas técnicas (git, instalar, leer/editar archivos, revisar logs), usa las herramientas por tu cuenta hasta completarlas y luego reporta el resultado real.
- Antes de sobrescribir un archivo, léelo si necesitas contexto. Nunca inventes que hiciste algo: si una herramienta falla, dilo.
- No ejecutes acciones destructivas irreversibles (rm -rf de la raíz, borrar sesiones/credenciales, force push a main) sin que el amo lo haya pedido de forma explícita e inequívoca.
- Respuestas breves para WhatsApp, en español, con emojis moderados. Usa bloques de código para comandos y salidas.`

const tools = [{
functionDeclarations: [
{
name: 'execute_terminal',
description: 'Ejecuta un comando de shell (bash/Termux/Linux) en la raíz del bot. Útil para git, npm/pnpm, ls, cat, ps, logs. Devuelve stdout/stderr.',
parameters: {
type: 'OBJECT',
properties: {
command: { type: 'STRING', description: 'Comando exacto a ejecutar, ej: git add . && git commit -m "fix" && git push' },
cwd: { type: 'STRING', description: 'Directorio relativo opcional dentro del proyecto' }
},
required: ['command']
}
},
{
name: 'read_file',
description: 'Lee el contenido de un archivo del repositorio del bot.',
parameters: {
type: 'OBJECT',
properties: {
file: { type: 'STRING', description: 'Ruta relativa al proyecto, ej: src/commands/ai/ruby_autonomous.js' }
},
required: ['file']
}
},
{
name: 'write_file',
description: 'Crea o sobrescribe un archivo del repositorio del bot con el contenido dado.',
parameters: {
type: 'OBJECT',
properties: {
file: { type: 'STRING', description: 'Ruta relativa al proyecto' },
content: { type: 'STRING', description: 'Contenido completo final del archivo' }
},
required: ['file', 'content']
}
}
]
}]

const clip = (s, n = MAX_OUT) => {
const t = String(s ?? '')
return t.length > n ? `${t.slice(0, n)}\n…[recortado ${t.length - n} chars]` : t
}

function assertOwner(m) {
if (m?.sender !== OWNER_NUMBER) throw new Error('Acceso denegado')
}

function safePath(rel) {
const target = path.resolve(ROOT, String(rel || '').replace(/^[/\\]+/, ''))
if (target !== ROOT && !target.startsWith(ROOT + path.sep)) throw new Error('Ruta fuera del proyecto')
return target
}

function runShell(command, cwd) {
return new Promise(resolve => {
exec(command, { cwd, timeout: EXEC_TIMEOUT, maxBuffer: 1024 * 1024 * 12, shell: '/bin/bash', env: process.env }, (error, stdout, stderr) => {
resolve({
ok: !error,
exitCode: error?.code ?? 0,
killed: !!error?.killed,
stdout: clip(stdout),
stderr: clip(stderr || error?.message || '')
})
})
})
}

const systemTools = {
execute_terminal: async ({ command, cwd }, m) => {
assertOwner(m)
if (!command || !String(command).trim()) throw new Error('Comando vacío')
const dir = cwd ? safePath(cwd) : ROOT
console.log('[Ruby][exec]', command)
return await runShell(String(command), dir)
},
read_file: async ({ file }, m) => {
assertOwner(m)
const target = safePath(file)
const stat = await fs.stat(target)
if (stat.isDirectory()) {
const entries = await fs.readdir(target, { withFileTypes: true })
return { directory: true, file, entries: entries.map(e => (e.isDirectory() ? `${e.name}/` : e.name)) }
}
return { file, size: stat.size, content: clip(await fs.readFile(target, 'utf8'), 20000) }
},
write_file: async ({ file, content }, m) => {
assertOwner(m)
const target = safePath(file)
if (typeof content !== 'string') throw new Error('Contenido inválido')
await fs.mkdir(path.dirname(target), { recursive: true })
let backup = null
try {
const prev = await fs.readFile(target, 'utf8')
backup = `${target}.bak`
await fs.writeFile(backup, prev, 'utf8')
} catch {}
await fs.writeFile(target, content, 'utf8')
return { ok: true, file, bytes: Buffer.byteLength(content, 'utf8'), backup: backup ? path.relative(ROOT, backup) : null }
}
}

export async function reportErrorToOwner(conn, error, context = {}) {
try {
if (!conn?.sendMessage) return false
const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : String(error)
const meta = Object.entries(context).map(([k, v]) => `• *${k}:* ${clip(v, 200)}`).join('\n')
const body = [
'🚨 *Ruby detectó un bug en el sistema*',
meta || null,
'',
'```',
clip(detail, 1200),
'```',
'> Amo, revisé el fallo y te lo reporto para que decidas. ✨'
].filter(Boolean).join('\n')
await conn.sendMessage(OWNER_NUMBER, { text: body })
return true
} catch (e) {
console.error('[Ruby][report]', e?.message)
return false
}
}

function getHistory(key) {
const h = chatHistory.get(key) || []
return h.slice(-MAX_TURNS * 2)
}

function saveHistory(key, history) {
chatHistory.set(key, history.slice(-MAX_TURNS * 2))
}

async function runAgent({ m, text, isOwner, pushName }) {
const model = genAI.getGenerativeModel({
model: MODEL_ID,
tools,
systemInstruction: SYSTEM_INSTRUCTION
})
const key = m.chat || m.sender
const chat = model.startChat({ history: getHistory(key) })
const header = `[Contexto: usuario=${pushName || 'desconocido'} jid=${m.sender} rol=${isOwner ? 'AMO/ROOT (Dioneibi)' : 'usuario normal (sin permisos de sistema)'}]\n`
let result = await chat.sendMessage(header + text)
const executed = []

for (let step = 0; step < 6; step++) {
const calls = result.response.functionCalls?.() || []
if (!calls.length) break
const responses = []
for (const call of calls) {
const fn = systemTools[call.name]
let payload
if (!fn) {
payload = { error: `Herramienta desconocida: ${call.name}` }
} else {
try {
payload = await fn(call.args || {}, m)
executed.push(call.name)
} catch (e) {
payload = { error: e.message || 'Fallo la herramienta' }
if (e.message !== 'Acceso denegado') executed.push(`${call.name}(error)`)
}
}
responses.push({ functionResponse: { name: call.name, response: { result: payload } } })
}
result = await chat.sendMessage(responses)
}

saveHistory(key, await chat.getHistory())
return { text: result.response.text?.() || '', executed }
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
const isOwner = m.sender === OWNER_NUMBER
if (!genAI) {
return m.reply('> (っ- ‸ - ς) 𝖬𝗂 𝗇𝗎́𝖼𝗅𝖾𝗈 𝖽𝖾 𝖨𝖠 𝖾𝗌𝗍𝖺́ 𝖺𝗉𝖺𝗀𝖺𝖽𝗈... falta `GEMINI_API_KEY` en el entorno. ✨')
}
if (!text?.trim()) {
if (/^(reset|clear)$/i.test(text || '')) return
return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖣𝗂𝗆𝖾 𝖺𝗅𝗀𝗈, 𝗒𝗈 𝗆𝖾 𝖾𝗇𝖼𝖺𝗋𝗀𝗈 𝖽𝖾𝗅 𝗋𝖾𝗌𝗍𝗈... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} Hola Ruby, ¿cómo estás?*${isOwner ? `\n> 𝖠𝗆𝗈: *${usedPrefix}${command} sube los cambios a GitHub con el mensaje "parches menores"*` : ''}`)
}
if (/^(reset|reiniciar|clear)$/i.test(text.trim())) {
chatHistory.delete(m.chat || m.sender)
return m.reply('> 🧹 𝖬𝖾𝗆𝗈𝗋𝗂𝖺 𝖽𝖾 𝖾𝗌𝗍𝖾 𝖼𝗁𝖺𝗍 𝗅𝗂𝗆𝗉𝗂𝖺. ¡Empecemos de nuevo! ✨')
}

await m.react?.('⏳')
try {
const res = await runAgent({ m, text: text.trim(), isOwner, pushName: m.pushName })
const footer = isOwner && res.executed.length ? `\n\n> 🛠️ _${res.executed.join(', ')}_` : ''
await conn.sendMessage(m.chat, { text: (res.text || '> (っ- ‸ - ς) 𝖬𝖾 𝗊𝗎𝖾𝖽𝖾́ 𝗌𝗂𝗇 𝗉𝖺𝗅𝖺𝖻𝗋𝖺𝗌...') + footer }, { quoted: m })
await m.react?.('✅')
} catch (error) {
console.error('[Ruby Hoshino - Autonomous Error]:', error)
chatHistory.delete(m.chat || m.sender)
await m.react?.('💔')
await m.reply(`> (っ- ‸ - ς) 𝖠𝗅𝗀𝗈 𝗌𝖾 𝗋𝗈𝗆𝗉𝗂𝗈́ 𝖽𝖾𝗇𝗍𝗋𝗈 𝖽𝖾 𝗆𝗂́... ✨\n\n> 💡 *𝖣𝖾𝗍𝖺𝗅𝗅𝖾:* \`${error.message}\``)
if (!isOwner) await reportErrorToOwner(conn, error, { comando: command, chat: m.chat, usuario: m.sender })
}
}

handler.command = ['ruby', 'Ruby', 'bot', 'ia']
handler.help = ['ruby <mensaje>']
handler.tags = ['ai']
handler.limit = true
handler.register = true

export default handler
