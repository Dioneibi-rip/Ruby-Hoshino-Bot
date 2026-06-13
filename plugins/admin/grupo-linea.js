let handler = async (m, { conn, args }) => {
try {
let id = args?.[0]?.match(/\d+\-\d+@g.us/) || m.chat
const participantesUnicos = Object.values(conn.chats[id]?.messages || {}).map((item) => item.key.participant).filter((value, index, self) => self.indexOf(value) === index)
const listaEnLinea = participantesUnicos.map((k) => `✦ @${k.split("@")[0]}`).join("\n") || "*✧ N᥆ һᥲᥡ ᥙsᥙᥲrі᥆s ᥱᥒ ᥣі́ᥒᥱᥲ ᥱᥒ ᥱs𝗍ᥱ m᥆mᥱᥒ𝗍᥆.* ૮(>﹏<)ა"
const mensaje = `*♡ Lіs𝗍ᥲ ძᥱ ᥙsᥙᥲrі᥆s ᥱᥒ ᥣі́ᥒᥱᥲ:*\n\n${listaEnLinea}\n\n> ${dev}`
await conn.sendMessage(m.chat, {
text: mensaje,
mentions: participantesUnicos,
contextInfo: {
externalAdReply: {
title: "✦ U s ᥙ ᥲ r і ᥆ s  O ᥒ ᥣ і ᥒ ᥱ ✦",
body: "R ᥙ ᑲ ᥡ  H ᥆ s һ і ᥒ ᥆  B ᥆ 𝗍 🌸",
thumbnailUrl: "https://i.pinimg.com/736x/cb/42/c2/cb42c2d460451b8c968511fec658b40d.jpg",
sourceUrl: "https://github.com/Dioneibi-rip",
mediaType: 1,
renderLargerThumbnail: true
}
}
}, { quoted: m })
await m.react("✅")
} catch (error) {
console.error(error)
await m.reply(`${msm} *Hᥙᑲ᥆ ᥙᥒ ᥱrr᥆r ᥲᥣ ᥱᥒ᥎іᥲr ᥣᥲ ᥣіs𝗍ᥲ ძᥱ ᥙsᥙᥲrі᥆s.* (╥﹏╥)`)
}
}
handler.help = ["listonline"]
handler.tags = ["grupo"]
handler.command = ["listonline", "online", "linea", "enlinea"]
handler.group = true
handler.fail = null
export default handler