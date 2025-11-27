import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

const styleText = (text) => {
    const map = {
        'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
        'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return text.split('').map(char => map[char] || char).join('');
}

let handler = m => m

handler.before = async function (m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return
    let chat = global.db.data.chats[m.chat]
    let usuario = m.sender.split('@')[0]
    
    let fkontak = null;
    try {
        const res = await fetch('https://i.postimg.cc/6562JdR7/Hoshino-Ruby-(2).jpg');
        const thumb2 = await res.buffer();
        fkontak = {
            key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
            message: {
                locationMessage: {
                    name: styleText('Notificaciones del Grupo'),
                    jpegThumbnail: thumb2
                }
            },
            participant: '0@s.whatsapp.net'
        };
    } catch (e) {
        console.error(e)
    }

    let text = ''
    let mentions = [m.sender]


    const footer = `‿︵‿︵‿︵୨˚̣̣̣͙୧ - - ୨˚̣̣̣͙୧‿︵‿︵‿︵`

    if (chat.detect && m.messageStubType == 21) {
        text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐡𝐚𝐧𝐠𝐞𝐝 𝐍𝐚𝐦𝐞.   𖤝        
꒰꒰ 🐻‍❄️ 𝐍𝐞𝐰 𝐍𝐚𝐦𝐞 Ი꯭ᰍ
> 🏷️ ${styleText(m.messageStubParameters[0])}`

    } else if (chat.detect && m.messageStubType == 22) {
        text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐡𝐚𝐧𝐠𝐞𝐝 𝐈𝐜𝐨𝐧.   𖤝        
꒰꒰ 🖼️ 𝐍𝐞𝐰 𝐈𝐦𝐚𝐠𝐞 Ი꯭ᰍ
> 🫧 ${styleText("Aesthetic Mode On")}`

    } else if (chat.detect && m.messageStubType == 23) {
        text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐑𝐞𝐯𝐨𝐤𝐞𝐝 𝐋𝐢𝐧𝐤.   𖤝        
꒰꒰ 🔗 𝐒𝐭𝐚𝐭𝐮𝐬 Ი꯭ᰍ
> 🚫 ${styleText("Old link is dead")}`

    } else if (chat.detect && m.messageStubType == 25) {
        let type = m.messageStubParameters[0] == 'on' ? '𝐀𝐝𝐦𝐢𝐧𝐬 𝐎𝐧𝐥𝐲' : '𝐀𝐥𝐥 𝐔𝐬𝐞𝐫𝐬'
        text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐄𝐝𝐢𝐭 𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬.   𖤝        
꒰꒰ ⚙️ 𝐈𝐧𝐟𝐨 𝐆𝐫𝐨𝐮𝐩 Ი꯭ᰍ
> 🔓 ${styleText(type)}`

    } else if (chat.detect && m.messageStubType == 26) {
        let type = m.messageStubParameters[0] == 'on' ? '🔒 𝐂𝐥𝐨𝐬𝐞𝐝' : '🔓 𝐎𝐩𝐞𝐧'
        text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐂𝐡𝐚𝐭 𝐒𝐭𝐚𝐭𝐮𝐬.   𖤝        
꒰꒰ 💬 𝐌𝐞𝐬𝐬𝐚𝐠𝐞𝐬 Ი꯭ᰍ
> ${styleText(type)}`

    } else if (chat.detect2 && m.messageStubType == 27) {
        let nuevo = m.messageStubParameters[0]
        mentions.push(nuevo)
        text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐍𝐞𝐰 𝐌𝐞𝐦𝐛𝐞𝐫.   𖤝        
꒰꒰ 🧸 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 Ი꯭ᰍ
> 👋 @${nuevo.split('@')[0]}`

    } else if (chat.detect && m.messageStubType == 29) {
        let nuevoAdmin = m.messageStubParameters[0]
        mentions.push(nuevoAdmin)
        text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐍𝐞𝐰 𝐀𝐝𝐦𝐢𝐧.   𖤝        
꒰꒰ 👑 𝐏𝐫𝐨𝐦𝐨𝐭𝐞𝐝 Ი꯭ᰍ
> 🫡 @${nuevoAdmin.split('@')[0]}`

    } else if (chat.detect && m.messageStubType == 30) {
        let exAdmin = m.messageStubParameters[0]
        mentions.push(exAdmin)
        text = `
       𖥔    　     *@${usuario}* ࣪      ˖ؚ
ㅤだ ㅤׄㅤ *#* ㅤִㅤ✿ㅤׄ﹕ 𝐃𝐞𝐦𝐨𝐭𝐞𝐝 𝐔𝐬𝐞𝐫.   𖤝        
꒰꒰ 📉 𝐅𝐞𝐥𝐥 𝐎𝐟𝐟 Ი꯭ᰍ
> 😔 @${exAdmin.split('@')[0]}`
    }

    if (text) {
        await conn.sendMessage(m.chat, { 
            text: text, 
            mentions: mentions
        }, { quoted: fkontak || m })
    }
}

export default handler