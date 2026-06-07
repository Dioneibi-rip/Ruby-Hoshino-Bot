import fs from 'fs'
import path from 'path'
function resolvePluginPath(text) {
const key = text.endsWith('.js') ? text : `${text}.js`
if (global.plugins?.[key]) return path.join('plugins', key)
const match = Object.keys(global.plugins || {}).find((name) => name === key || name.endsWith(`/${key}`))
return match ? path.join('plugins', match) : null
}
const handler = async (m, {conn, usedPrefix, command, text}) => {
const ar = Object.keys(global.plugins || {})
const ar1 = ar.map((v) => v.replace(/\.js$/, ''))
if (!text) return conn.reply(m.chat, `${global.emoji || '✦'} Ingrese el nombre de algún plugin existente\n\n*—◉ Ejemplo*\n*◉ ${usedPrefix + command}* Main/info-infobot\n\n*—◉ Lista de plugins existentes:*\n*◉* ${ar1.map((v) => ' ' + v).join`\n*◉*`}`, m)
const pluginPath = resolvePluginPath(text)
if (!pluginPath) return conn.reply(m.chat, `${global.emoji2 || '✘'} No se encontró ningún plugin llamado "${text}".\n\n*—◉ Lista de plugins existentes:*\n*◉* ${ar1.map((v) => ' ' + v).join`\n*◉*`}`, m)
await conn.sendMessage(m.chat, {document: await fs.promises.readFile(pluginPath), mimetype: 'application/javascript', fileName: path.basename(pluginPath)}, {quoted: m})
}
handler.help = ['getplugin']
handler.tags = ['owner']
handler.command = ['getplugin', 'plugin']
handler.rowner = true
export default handler
