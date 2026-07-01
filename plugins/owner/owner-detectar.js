import fs from 'fs'
import path from 'path'
async function getPluginFiles(dir) {
const entries = await fs.promises.readdir(dir, {withFileTypes: true})
const files = await Promise.all(entries.map(async (entry) => {
const fullPath = path.join(dir, entry.name)
if (entry.isDirectory()) return getPluginFiles(fullPath)
return entry.name.endsWith('.js') ? [fullPath] : []
}))
return files.flat()
}
var handler = async (m, {conn}) => {
try {
await m.react('🕒')
conn.sendPresenceUpdate('composing', m.chat)
const pluginsDir = './plugins'
const files = await getPluginFiles(pluginsDir)
let response = `✧ *Revisión de Syntax Errors:*\n\n`
let hasErrors = false
for (const file of files) {
try {
await import(path.resolve(file) + `?update=${Date.now()}`)
} catch (error) {
hasErrors = true
const stackLines = error.stack.split('\n')
const errorLineMatch = stackLines[0].match(/:(\d+):\d+/)
const errorLine = errorLineMatch ? errorLineMatch[1] : 'Desconocido'
response += `⚠︎ *Error en:* ${file}\n\n> ● Mensaje: ${error.message}\n> ● Número de línea: ${errorLine}\n\n`
}
}
if (!hasErrors) response += '❀ ¡Todo está en orden! No se detectaron errores de sintaxis'
await conn.reply(m.chat, response, m)
await m.react('✅')
} catch (err) {
await m.react('✖️')
await conn.reply(m.chat, `⚠︎ Ocurrió un error: ${err.message}`, m)
return false;
}
}
handler.command = ['detectarsyntax', 'detectar']
handler.help = ['detectarsyntax']
handler.tags = ['tools']
handler.rowner = true
export default handler
