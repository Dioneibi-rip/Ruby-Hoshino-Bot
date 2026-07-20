import { downloadMegaFile, formatBytes } from '../../library/mega-core.js'

let handler = async (m, { conn, text }) => {
try {
if (!text) return conn.reply(m.chat, `${emoji} Por favor, envía un link de MEGA para descargar el archivo.`, null, { quoted: fkontak })

m.react(rwait)
const file = await downloadMegaFile(text, { maxSize: 300 * 1024 * 1024 })
const caption = `╭─〔 ✦ 𝑴𝑬𝑮𝑨 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫 ✦ 〕─╮\n│ 🗂️ 𝑵𝒐𝒎𝒃𝒓𝒆: ${file.name}\n│ ⚖️ 𝑷𝒆𝒔𝒐: ${formatBytes(file.size)}\n│ 🧬 𝑬𝒔𝒕𝒂𝒅𝒐: Descifrado con éxito\n╰─ 𓆩💎 𝑹𝒖𝒃𝒚 𝑯𝒐𝒔𝒉𝒊𝒏𝒐 💎𓆪 ─╯`
const fileExtension = file.name.includes('.') ? `.${file.name.split('.').pop().toLowerCase()}` : ''
const mimeTypes = {
'.mp4': 'video/mp4',
'.pdf': 'application/pdf',
'.zip': 'application/zip',
'.rar': 'application/x-rar-compressed',
'.7z': 'application/x-7z-compressed',
'.jpg': 'image/jpeg',
'.jpeg': 'image/jpeg',
'.png': 'image/png'
}
const mimetype = mimeTypes[fileExtension] || 'application/octet-stream'
await conn.sendFile(m.chat, file.buffer, file.name, caption, m, null, { mimetype, asDocument: true })
} catch (error) {
return m.reply(`${msm} Ocurrió un error: ${error.message}`)
}
}

handler.help = ['mega']
handler.tags = ['descargas']
handler.command = ['mega', 'mg']
handler.group = true
handler.register = true

export default handler
