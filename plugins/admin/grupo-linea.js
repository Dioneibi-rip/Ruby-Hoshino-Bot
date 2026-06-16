let handler = async (m, { conn, args }) => {
try {
let id = args?.[0]?.match(/\d+\-\d+@g.us/) || m.chat
const participantesUnicos = Object.values(conn.chats[id]?.messages || {}).map((item) => item.key.participant).filter((value, index, self) => self.indexOf(value) === index)
const listaEnLinea = participantesUnicos.map((k) => `@${k.split("@")[0]}`).join("\n") || "*✧ No hay usuarios en línea en este momento :c.*"
const mensaje = `*♡ Lista de usuarios en línea:*\n\n${listaEnLinea}\n\n> Ruby Hoshino Bot`
const urlImagen = 'https://files.catbox.moe/c5s9g0.jpg'
let thumbBuffer
try {
const res = await fetch(urlImagen)
const buf = await res.arrayBuffer()
thumbBuffer = Buffer.from(buf)
} catch (err) {
console.error('Error al descargar la imagen:', err)
}
await conn.sendMessage(m.chat, {
text: mensaje,
mentions: participantesUnicos,
externalAdReply: {
title: '🌟 Ruby Hoshino Bot | Usuarios',
body: 'Deymoon Bot MD - Desarrollado por David Chian',
...(thumbBuffer && { thumbnail: thumbBuffer }),
sourceUrl: 'https://github.com/Dioneibi-rip',
mediaType: 1,
renderLargerThumbnail: false
}
}, { quoted: m })
await m.react("✅")
} catch (error) {
console.error(error)
await m.reply(`Hubo un error al enviar la lista de usuarios.`)
}
}
handler.help = ["listonline"]
handler.tags = ["grupo"]
handler.command = ["listonline", "online", "linea", "enlinea"]
handler.group = true
handler.fail = null
export default handler