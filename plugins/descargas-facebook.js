import fetch from 'node-fetch'

const handler = async (m, { text, conn, args, usedPrefix, command }) => {
  const emoji = '🌸'
  const emoji2 = '❌'
  const msm = '⚠️'
  const done = '✅'
  const rwait = '⏳'

  if (!args[0]) {
    return conn.reply(
      m.chat,
      `${emoji} 𝐏𝐨𝐫 𝐟𝐚𝐯𝐨𝐫, 𝐢𝐧𝐠𝐫𝐞𝐬𝐚 𝐮𝐧 𝐞𝐧𝐥𝐚𝐜𝐞 𝐝𝐞 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 🌐\n\n✨ Ejemplo:\n> *${usedPrefix + command} https://www.facebook.com/...*`,
      m
    )
  }

  try {
    await m.react(rwait)

    const apiUrl = `https://ruby-core.vercel.app/api/download/facebook?url=${encodeURIComponent(args[0])}`
    const res = await fetch(apiUrl)
    const json = await res.json()

    if (!json.status || !json.download) {
      await m.react('⚠️')
      return conn.reply(m.chat, `${emoji2} No se pudo obtener el video, verifica el enlace por favor >w<`, m)
    }

    const { title, description, siteName } = json.metadata
    const videoUrl = json.download

    const caption = `
ㅤֺㅤ۪ㅤ   ׄ  ＼ㅤ｜ㅤ／  ׄ  ㅤִㅤ۫ 
> ꜒📺ᮀ࠘࿑  *\`𝐓𝐈𝐓𝐔𝐋𝐎\`*: ${title || 'Sin título'}
> ꜒📝ᮀ࠘࿑  *\`𝐃𝐄𝐒𝐂𝐑𝐈𝐏𝐂𝐈𝐎́𝐍\`*: ${description || 'Sin descripción'}
> ꜒🌐ᮀ࠘࿑  *\`𝐎𝐑𝐈𝐆𝐄𝐍\`*: ${siteName || 'Facebook'}
> ꜒👩🏻‍💻ᮀ࠘࿑  *\`𝐀𝐏𝐈\`*: Ruby Core by Dioneibi
╰┈➤ *Hai~! 💕 Aquí tienes tu video listo, Onee-san~!* 🍰
`.trim()

    await conn.sendMessage(
      m.chat,
      {
        video: { url: videoUrl },
        caption,
        fileName: 'facebook_video.mp4',
        mimetype: 'video/mp4',
        contextInfo: {
          externalAdReply: {
            title: '🌸 Ruby Hoshino Downloader 🌸',
            body: 'Descarga directa desde Facebook 💕',
            thumbnailUrl: 'https://telegra.ph/file/95c0cc90d069fea2cdf0d.png',
            sourceUrl: 'https://ruby-core.vercel.app/',
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    )

    await m.react(done)
  } catch (e) {
    console.error(e)
    await m.react('⚠️')
    return conn.reply(m.chat, `${msm} Hubo un error al procesar el video >_<`, m)
  }
}

handler.help = ['facebook', 'fb']
handler.tags = ['descargas']
handler.command = ['facebook', 'fb']
handler.group = true
handler.register = true
handler.coin = 2

export default handler
