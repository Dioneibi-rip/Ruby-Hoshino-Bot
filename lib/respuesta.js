const newsletterJid = '120363335626706839@newsletter'
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'

const handler = async (type, conn, m, comando) => {
  const msg = {
    rowner: '「 🌌 」 *¡A-Ah! (⁄ ⁄•⁄ω⁄•⁄ ⁄) ᴇsᴛᴀ ғᴜɴᴄɪᴏ́ɴ ᴇs ᴇxᴄʟᴜsɪᴠᴀ ᴘᴀʀᴀ ᴍɪ ᴄʀᴇᴀᴅᴏʀ ᴄᴇʟᴇsᴛɪᴀʟ,* `ᴅɪᴏɴᴇɪʙɪ-sᴀᴍᴀ` *~ 💫*\n\n> 🎀 `sᴏʟᴏ ǫᴜɪᴇɴ ᴍᴇ ᴅɪᴏ ᴠɪᴅᴀ ᴘᴜᴇᴅᴇ ᴜsᴀʀʟᴀ.` ฅ(•ㅅ•❀)ฅ',
    owner: '「 👑 」 *¡Nʏᴀᴀ~! (≧◡≦) sᴏʟᴏ ᴍɪ* `ᴅᴜᴇɴ̃ᴏ ʏ ᴘʀᴏɢʀᴀᴍᴀᴅᴏʀᴇs` *ᴛɪᴇɴᴇɴ ᴘᴇʀᴍɪsᴏ ᴘᴀʀᴀ ᴇᴊᴇᴄᴜᴛᴀʀ ᴇsᴛᴏ~ 💕*',
    mods: '「 🧸 」 *Uɢᴜᴜ~ (,,>﹏<,,) ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ᴇs ᴇxᴄʟᴜsɪᴠᴏ ᴘᴀʀᴀ ʟᴏs* `ᴀʏᴜᴅᴀɴᴛᴇs ᴍᴀ́ɢɪᴄᴏs` *ᴅᴇ ʀᴜʙʏ. ✨*',
    premium: '「 💎 」 *¡Eʜʜ~? (o_O) ᴇsᴛᴀ ʜᴀʙɪʟɪᴅᴀᴅ ᴇs sᴏʟᴏ ᴘᴀʀᴀ* `ᴜsᴜᴀʀɪᴏs ᴘʀᴇᴍɪᴜᴍ-ᴅᴇsᴜ` *~ ʟᴏ sɪᴇɴᴛᴏ ᴍᴜᴄʜᴏ.* 🌸',
    group: '「 🐾 」 *¡Oɴɪɪ-ᴄʜᴀɴ! (ง ื▿ ื)ว ᴇsᴛᴀ ғᴜɴᴄɪᴏ́ɴ sᴏ́ʟᴏ ᴘᴜᴇᴅᴇ ᴜsᴀʀsᴇ ᴇɴ* `ɢʀᴜᴘᴏs` *... ¡Iɴᴠɪ́ᴛᴀᴍᴇ ᴀ ᴜɴᴏ!* 🍡',
    private: '「 💌 」 *Sʜʜ~ ( ˘ ³˘)♥︎ ᴜsᴀ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ᴇɴ* `ᴘʀɪᴠᴀᴅᴏ` *ᴄᴏɴᴍɪɢᴏ, ᴘᴏʀғɪs... sᴏʟᴏ ᴛᴜ́ ʏ ʏᴏ 💙.*',
    admin: '「 🛡️ 」 *¡Kʏᴀʜ~! ( Ò﹏Ó) sᴏʟᴏ ʟᴏs* `ᴀᴅᴍɪɴ-sᴇɴᴘᴀɪ` *ᴅᴇʟ ɢʀᴜᴘᴏ ᴘᴜᴇᴅᴇɴ ᴜsᴀʀ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ.* 🎀',
    botAdmin: '「 🔧 」 *¡E-ᴇsᴘᴇʀᴀ! (｡•́︿•̀｡)* `ɴᴇᴄᴇsɪᴛᴏ sᴇʀ ᴀᴅᴍɪɴ` *ᴘᴀʀᴀ ʜᴀᴄᴇʀ ᴇsᴏ... ¿ᴍᴇ ᴀʏᴜᴅᴀs ᴀ ᴅᴇsᴀᴛᴀʀ ᴍɪ ᴘᴏᴅᴇʀ?* 💫',
    unreg: '「 📝 」 *¡A-ᴀʀᴇ! ɴᴏ ᴇsᴛᴀ́s ʀᴇɢɪsᴛʀᴀᴅᴏ ᴀᴜ́ɴ,* `ʀᴜʙʏ ɴᴏ ᴛᴇ ʀᴇᴄᴏɴᴏᴄᴇ...` *( ╥ω╥ )*\n\n> ✧ *Usa:* `/reg tu_nombre.edad`\n> ✧ *Ejemplo:* `/reg Dioneibi.15` 🍒',
    nsfw: '「 🚫 」 *¡B-ʙᴀᴋᴀ! (///￣ ￣///) ᴇʟ ᴄᴏɴᴛᴇɴɪᴅᴏ* `ɴsғᴡ` *ᴇsᴛᴀ́ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ ᴘᴀʀᴀ ᴘʀᴏᴛᴇɢᴇʀ ᴛᴜ ᴘᴜʀᴏ ᴋᴏᴋᴏʀᴏ 💙.*',
    restrict: '「 📵 」 *¡Oᴜʜ~! (￣▽￣*)ゞ ᴇsᴛᴀ ᴏᴘᴄɪᴏ́ɴ ᴇsᴛᴀ́* `ʟɪᴍɪᴛᴀᴅᴀ` *ᴘᴏʀ ᴍɪ ᴄʀᴇᴀᴅᴏʀ.*\n\n> 💌 `ᴄᴏɴᴛᴀᴄᴛᴀ ᴄᴏɴ ᴇ́ʟ sɪ ᴅᴇsᴇᴀs ᴀᴄᴛɪᴠᴀʀʟᴀ.`'
  }[type]

  if (msg) {
    const b64 = Buffer.from(global.icons).toString('base64')
    const matchedUrl = 'https://github.com/Dioneibi-rip'
    
    await conn.relayMessage(m.chat, {
      extendedTextMessage: {
        text: `${matchedUrl}\n\n${msg}`,
        matchedText: matchedUrl,
        description: '꒰ 🧺 ᑲіᥱᥒ᥎ᥱᥒіძ᥆ ᥲᥣ sᥙ́ρᥱr ᑲ᥆𝗍 ძᥱ ᥕһᥲ𝗍sᥲρρ ꒱',
        title: '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥',
        previewType: 'shadow',
        jpegThumbnail: b64,
        contextInfo: {
          quotedMessage: m.message,
          participant: m.sender,
          stanzaId: m.id,
          remoteJid: m.chat,
          isForwarded: true,
          forwardingScore: 999,
          forwardedNewsletterMessageInfo: {
            newsletterJid,
            newsletterName,
            serverMessageId: -1
          }
        }
      }
    }, { quoted: m })
    
    await m.react('🎀')
  }
  
  return true
}

export default handler