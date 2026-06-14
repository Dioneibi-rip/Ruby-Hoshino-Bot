let handler = async (m, { conn, args }) => {
  try {
    let id = args?.[0]?.match(/\d+\-\d+@g.us/) || m.chat
    const participantesUnicos = Object.values(conn.chats[id]?.messages || {})
      .map((item) => item.key.participant)
      .filter((value, index, self) => self.indexOf(value) === index)
    const listaEnLinea = participantesUnicos
      .map((k) => `✦ @${k.split("@")[0]}`).join("\n")
      || "*✧ N᥆ һᥲᥡ ᥙsᥙᥲrі᥆s ᥱᥒ ᥣі́ᥒᥱᥲ ᥱᥒ ᥱs𝗍ᥱ m᥆mᥱᥒ𝗍᥆.* ૮(>﹏<)ა"
    const mensaje = `*♡ Lіs𝗍ᥲ ძᥱ ᥙsᥙᥲrі᥆s ᥱᥒ ᥣі́ᥒᥱᥲ:*\n\n${listaEnLinea}\n\n> ${dev}`

    const previewUrl = "https://github.com/Dioneibi-rip"
    const hiddenUrl = `\u200B${previewUrl}\u200B`

    await conn.sendMessage(m.chat, {
      text: `${mensaje}\n\n${hiddenUrl}`,
      mentions: participantesUnicos,
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