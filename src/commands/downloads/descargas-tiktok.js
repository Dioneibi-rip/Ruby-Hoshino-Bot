import axios from '../../library/http.js'
import { enqueueMediaJob, getMediaQueueConnection } from '../../library/queue.js'
import { assertRemoteFileSize, replyIfMediaTooLarge } from '../../library/media-size.js'

const tiktokRegex = /^(https?:\/\/)?(www\.|vm\.|vt\.|m\.|t\.)?tiktok\.com\/.+/i
const formatDate = timestamp => new Date(Number(timestamp || 0) * 1000).toLocaleString('es-ES', { timeZone: 'America/Mexico_City' })
const caption = result => `_💌  ᩭ✎Tiktok sin marca de agua descargado con éxito_\n\n「${result.title || '✧ 𝑺𝒊𝒏 𝒕𝒊𝒕𝒖𝒍𝒐 ✧'}」\n\n❀ 𝘼𝙐𝙏𝙊𝙍: ${result.author?.nickname || 'Desconocido'}\n❀ 𝘿𝙐𝙍𝘼𝘾𝙄𝙊𝙉: ${result.duration || 0}s\n❀ 𝙑𝙄𝙎𝙏𝘼𝙎: ${result.play_count || 0}\n❀ 𝙇𝙄𝙆𝙀𝙎: ${result.digg_count || 0}\n❀ 𝘾𝙊𝙈𝙀𝙉𝙏𝘼𝙍𝙄𝙊𝙎: ${result.comment_count || 0}\n❀ 𝘾𝙊𝙈𝙋𝘼𝙍𝙏𝙄𝘿𝙊𝙎: ${result.share_count || 0}\n❀ 𝙁𝙀𝘾𝙃𝘼: ${formatDate(result.create_time)}`

const searchTikTok = async keywords => {
  const { data: response } = await axios.post('https://www.tikwm.com/api/feed/search', new URLSearchParams({ keywords, count: '10', cursor: '0', HD: '1' }), { timeout: 15000, headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: 'current_language=en', 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' } })
  return (response?.data?.videos || []).filter(video => video.play)
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const input = args.join(' ').trim()
  if (!input) return conn.reply(m.chat, `*< DESCARGAS - TIKTOK />*\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Dᴇ Vɪᴅᴇᴏ O Uɴ Tᴇxᴛᴏ Dᴇ Bᴜ́sᴏᴜᴇᴅᴀ.*\n\n*💌 Eᴊᴇᴍᴘʟᴏ:* _${usedPrefix + command} https://vm.tiktok.com/ZM6UHJYtE/_\n_${usedPrefix + command} edit de Ruby_`.trim(), m)
  try {
    if (tiktokRegex.test(input)) {
      const payload = await global.rcanal(`_💌 @${m.sender.split('@')[0]} ᩭ✎Enviando Video, espere un momento..._`, m)
      await conn.relayMessage(m.chat, payload, {})
      return enqueueMediaJob('tiktok', { chat: m.chat, url: input, message: { key: m.key, message: m.message, sender: m.sender, chat: m.chat } }, { conn })
    }
    
    await m.react('🕒')
    const results = await searchTikTok(input)
    const selected = results[Math.floor(Math.random() * results.length)]
    if (!selected) return conn.reply(m.chat, '❌ No se encontraron videos para esa búsqueda.', m)
    
    await assertRemoteFileSize(selected.play, { label: 'video de TikTok' })
    const { data: video } = await axios.get(selected.play, { responseType: 'arraybuffer', timeout: 30000 })
    const result = { ...selected, author: selected.author || {} }
    
    await conn.sendMessage(m.chat, { video: Buffer.from(video), mimetype: 'video/mp4', fileName: 'tiktok.mp4', caption: caption(result) }, { quoted: m })
    await m.react('🌸')
  } catch (error) {
    console.error(error);
    if (await replyIfMediaTooLarge(conn, m.chat, error, m, { label: 'video de TikTok' })) return;
    return conn.reply(m.chat, `❌ 𝑬𝒓𝒓𝒐𝒓 𝒂𝒍 𝒅𝒆𝒔𝒄𝒂𝒓𝒈𝒂𝒓:\n${error.message}`, m)
  }
}

handler.help = ['tiktok', 'tt'].map(value => `${value} *<link|texto>*`)
handler.tags = ['descargas']
handler.command = ['tiktok', 'tt', 'tiktokdl', 'ttdl']
handler.group = true
handler.register = true

export default handler

async function tiktokdl(url) {
  const { data } = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`)
  return data
}

global.queueHandlers ||= new Map()
global.queueHandlers.set('tiktok', async data => {
  const conn = getMediaQueueConnection()
  const m = data.message
  try {
    const result = (await tiktokdl(data.url))?.data
    if (!result?.play) return conn.reply(data.chat, '🌸 ❌ 𝑼𝒑𝒔… 𝒏𝒐 𝒑𝒖𝒅𝒆 𝒐𝒃𝒕𝒆𝒏𝒆𝒓 𝒆𝒍 𝒗𝒊𝒅𝒆𝒐.', m)
    
    await assertRemoteFileSize(result.play, { label: 'video de TikTok' })
    await conn.sendFile(data.chat, result.play, 'tiktok.mp4', caption(result), m)
    await conn.sendMessage(data.chat, { react: { text: '🌸', key: m.key } })
  } catch (error) {
    console.error(error)
    if (await replyIfMediaTooLarge(conn, data.chat, error, m, { label: 'video de TikTok' })) return;
    return conn.reply(data.chat, `❌ 𝑬𝒓𝒓𝒐𝒓 𝒂𝒍 𝒅𝒆𝒔𝒄𝒂𝒓𝒈𝒂𝒓:\n${error.message}`, m)
  }
})