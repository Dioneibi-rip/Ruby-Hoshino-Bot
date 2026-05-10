import fetch from 'node-fetch'

const STYLE_MAP = {
'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
'0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
}

const styleText = (text) => text.split('').map((char) => STYLE_MAP[char] || char).join('')

let detectThumbPromise = null
async function getDetectThumb() {
  if (!detectThumbPromise) {
    detectThumbPromise = fetch('https://i.postimg.cc/6562JdR7/Hoshino-Ruby-(2).jpg')
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((buf) => (buf ? Buffer.from(buf) : null))
      .catch(() => null)
  }
  return detectThumbPromise
}

function buildDetectMessage(m, usuario) {
  const stubType = m.messageStubType

  if (stubType === 21) {
    return {
      text: `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐚𝐦𝐛𝐢𝐨́ 𝐞𝐥 𝐍𝐨𝐦𝐛𝐫𝐞   𖤝        
꒰꒰ 📝 𝐀𝐡𝐨𝐫𝐚 𝐬𝐞 𝐥𝐥𝐚𝐦𝐚 Ი꯭ᰍ
> ${styleText(m.messageStubParameters?.[0] || '')}`,
      mentions: [m.sender],
    }
  }

  if (stubType === 22) {
    return {
      text: `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐚𝐦𝐛𝐢𝐨́ 𝐥𝐚 𝐈𝐦𝐚𝐠𝐞𝐧   𖤝        
꒰꒰ 🖼️ 𝐅𝐨𝐭𝐨 𝐀𝐜𝐭𝐮𝐚𝐥𝐢𝐳𝐚𝐝𝐚 Ი꯭ᰍ
> 🫧 ${styleText('El icono del grupo ha cambiado')}`,
      mentions: [m.sender],
    }
  }

  if (stubType === 24) {
    return {
      text: `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐚𝐦𝐛𝐢𝐨́ 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐜𝐢𝐨́𝐧   𖤝        
꒰꒰ 📑 𝐈𝐧𝐟𝐨 𝐀𝐜𝐭𝐮𝐚𝐥𝐢𝐳𝐚𝐝𝐚 Ი꯭ᰍ
> 📝 ${styleText('La descripción del grupo es nueva')}`,
      mentions: [m.sender],
    }
  }

  if (stubType === 23) {
    return {
      text: `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐑𝐞𝐬𝐭𝐚𝐛𝐥𝐞𝐜𝐢𝐨́ 𝐄𝐧𝐥𝐚𝐜𝐞   𖤝        
꒰꒰ 🔗 𝐋𝐢𝐧𝐤 𝐀𝐧𝐮𝐥𝐚𝐝𝐨 Ი꯭ᰍ
> 🚫 ${styleText('El enlace anterior ya no sirve')}`,
      mentions: [m.sender],
    }
  }

  if (stubType === 25) {
    const type = m.messageStubParameters?.[0] === 'on' ? '𝐒𝐨𝐥𝐨 𝐀𝐝𝐦𝐢𝐧𝐬' : '𝐓𝐨𝐝𝐨𝐬'
    return {
      text: `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐀𝐥𝐭𝐞𝐫𝐨́ 𝐀𝐣𝐮𝐬𝐭𝐞𝐬   𖤝        
꒰꒰ ⚙️ 𝐀𝐡𝐨𝐫𝐚 𝐄𝐝𝐢𝐭𝐚𝐧 Ი꯭ᰍ
> 🔓 ${styleText(type)}`,
      mentions: [m.sender],
    }
  }

  if (stubType === 26) {
    const closed = m.messageStubParameters?.[0] === 'on'
    const action = closed ? '𝐂𝐞𝐫𝐫𝐨́ 𝐞𝐥 𝐆𝐫𝐮𝐩𝐨' : '𝐀𝐛𝐫𝐢𝐨́ 𝐞𝐥 𝐆𝐫𝐮𝐩𝐨'
    const msg = closed ? 'Solo Admins escriben' : 'Todos pueden escribir'
    return {
      text: `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ ${action}   𖤝        
꒰꒰ 💬 𝐄𝐬𝐭𝐚𝐝𝐨 𝐝𝐞𝐥 𝐂𝐡𝐚𝐭 Ი꯭ᰍ
> 📣 ${styleText(msg)}`,
      mentions: [m.sender],
    }
  }

  if (stubType === 29) {
    const nuevoAdmin = m.messageStubParameters?.[0]
    if (!nuevoAdmin) return null
    return {
      text: `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐃𝐢𝐨 𝐀𝐝𝐦𝐢𝐧 𝐚   𖤝        
> 🫡 @${nuevoAdmin.split('@')[0]}
꒰꒰ 👑 𝐍𝐮𝐞𝐯𝐨 𝐀𝐝𝐦𝐢𝐧 Ი꯭ᰍ`,
      mentions: [m.sender, nuevoAdmin],
    }
  }

  if (stubType === 30) {
    const exAdmin = m.messageStubParameters?.[0]
    if (!exAdmin) return null
    return {
      text: `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐐𝐮𝐢𝐭𝐨́ 𝐀𝐝𝐦𝐢𝐧 𝐚   𖤝        
> 😔 @${exAdmin.split('@')[0]}
꒰꒰ 📉 𝐃𝐞𝐠𝐫𝐚𝐝𝐚𝐝𝐨 Ი꯭ᰍ`,
      mentions: [m.sender, exAdmin],
    }
  }

  return null
}

let handler = m => m
handler.before = async function (m, { conn }) {
  if (!m.messageStubType || !m.isGroup) return

  const chat = global.db.data.chats[m.chat]
  if (!chat.detect) return

  const usuario = m.sender.split('@')[0]
  const payload = buildDetectMessage(m, usuario)
  if (!payload?.text) return

  const thumb = await getDetectThumb()
  const quoted = thumb
    ? {
      key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: {
        locationMessage: {
          name: styleText('Notificaciones del Grupo'),
          jpegThumbnail: thumb,
        },
      },
      participant: '0@s.whatsapp.net',
    }
    : m

  await conn.sendMessage(m.chat, {
    text: payload.text,
    mentions: payload.mentions,
  }, { quoted })
}

export default handler
