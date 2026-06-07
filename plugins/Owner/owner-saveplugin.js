import fs from 'fs'
import path from 'path'
let handler = async (m, {text}) => {
if (!text) return m.reply(`${global.emoji || '✦'} Por favor, ingrese el nombre del plugin.`)
if (!m.quoted || !m.quoted.text) return m.reply(`${global.emoji2 || '✘'} Responda al mensaje con el contenido del plugin.`)
const cleanName = text.endsWith('.js') ? text : `${text}.js`
const ruta = cleanName.includes('/') ? path.join('plugins', cleanName) : path.join('plugins', 'Other', cleanName)
try {
await fs.promises.mkdir(path.dirname(ruta), {recursive: true})
await fs.promises.writeFile(ruta, m.quoted.text)
m.reply(`${global.emoji || '✦'} Guardando plugin en ${ruta}`)
} catch (error) {
m.reply(`${global.msm || '✘'} Ocurrió un error al guardar el plugin: ${error.message}`)
}
}
handler.help = ['saveplugin']
handler.tags = ['owner']
handler.command = ['saveplugin']
handler.owner = true
export default handler
