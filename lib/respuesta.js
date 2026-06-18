const newsletterJid = '120363335626706839@newsletter'
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'
const handler = async (type, conn, m, comando) => {
const msg = {
rowner: '「💙」 *ᴇsᴛᴀ ғᴜɴᴄɪᴏ́ɴ ᴇsᴛᴀ ʀᴇsᴇʀᴠᴀᴅᴀ ᴘᴀʀᴀ ᴍɪ ᴀᴄᴛᴜᴀʟ ᴅᴜᴇɴ̃ᴏ ᴅɪᴏɴᴇɪʙɪ~ 💫*\n\n> sᴏʟᴏ ǫᴜɪᴇɴ ᴍᴇ ᴅɪᴏ ᴠɪᴅᴀ ᴘᴜᴇᴅᴇ ᴜsᴀʀʟᴀ.',
 owner: '「💙」 *sᴏʟᴏ ᴍɪ ᴅᴜᴇɴ̃ᴏ ᴛɪᴇɴᴇ ᴘᴇʀᴍɪsᴏ ᴘᴀʀᴀ ᴇᴊᴇᴄᴜᴛᴀʀ ᴇsᴛᴏ.*',
 mods: '「🧸」 *ᴄᴏᴍᴀɴᴅᴏ ᴇxᴄʟᴜsɪᴠᴏ ᴘᴀʀᴀ ʟᴏs ᴀʏᴜᴅᴀɴᴛᴇs ᴅᴇ ʀᴜʙʏ.*',
 premium: '「🔹」 *ᴀᴄᴄᴇsᴏ sᴏʟᴏ ᴘᴀʀᴀ ᴜsᴜᴀʀɪᴏs ᴘʀᴇᴍɪᴜᴍ, ʟᴏ sɪᴇɴᴛᴏ.*',
 group: '「👥」 *ᴇsᴛᴀ ғᴜɴᴄɪᴏ́ɴ sᴏ́ʟᴏ ғᴜɴᴄɪᴏɴᴀ ᴇɴ ɢʀᴜᴘᴏs, ¡ɪɴᴠɪᴛᴀᴍᴇ ᴀ ᴜɴᴏ!*',
 private: '「📩」 *ᴜsᴀ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ᴇɴ ᴘʀɪᴠᴀᴅᴏ ᴄᴏɴᴍɪɢᴏ, ᴘᴏʀғɪs 💙.*',
 admin: '「🎀」 *sᴏʟᴏ ʟᴏs ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs ᴅᴇʟ ɢʀᴜᴘᴏ ᴘᴜᴇᴅᴇɴ ᴜsᴀʀ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ.*',
 botAdmin: '「🔐」 *ɴᴇᴄᴇsɪᴛᴏ sᴇʀ ᴀᴅᴍɪɴ ᴘᴀʀᴀ ʜᴀᴄᴇʀ ᴇsᴏ... ¿ᴍᴇ ᴀʏᴜᴅᴀs?*',
 unreg: '「💭」 *ɴᴏ ᴇsᴛᴀ́s ʀᴇɢɪsᴛʀᴀᴅᴏ ᴀᴜ́ɴ, ʀᴜʙʏ ɴᴏ ᴛᴇ ʀᴇᴄᴏɴᴏᴄᴇ...*\n\n✧ Usa: */reg tu_nombre.edad*\n✧ Ejemplo: */reg Dioneibi.15*',
 nsfw: '「🚫」 *ᴇʟ ᴄᴏɴᴛᴇɴɪᴅᴏ ɴsғᴡ ᴇsᴛᴀ́ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ ᴘᴀʀᴀ ᴘʀᴏᴛᴇɢᴇʀ ᴛᴜ ᴋᴏᴋᴏʀᴏ 💙.*',
 restrict: '「🕊️」 *ᴇsᴛᴀ ᴏᴘᴄɪᴏ́ɴ ᴇsᴛᴀ́ ʟɪᴍɪᴛᴀᴅᴀ ᴘᴏʀ ᴍɪ ᴄʀᴇᴀᴅᴏʀ.*\ɴ> ᴄᴏɴᴛᴀᴄᴛᴀ ᴄᴏɴ ᴇ́ʟ sɪ ᴅᴇsᴇᴀs ᴀᴄᴛɪᴠᴀʀʟᴀ.'
}[type]
if (msg) {
const b64 = Buffer.from(global.icons).toString('base64')
const matchedUrl = 'https://github.com/Dioneibi-rip'
await conn.relayMessage(m.chat, {
extendedTextMessage: {
text: `${matchedUrl}\n${msg}`,
matchedText: matchedUrl,
description: '꒰🧺 ᑲіᥱᥒ᥎ᥱᥒіძ᥆ ᥲᥣ sᥙ́ρᥱr ᑲ᥆𝗍 ძᥱ ᥕһᥲ𝗍sᥲρρ ꒱',
title:'⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥'',
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
await m.react('✖️')
}
return true
}
export default handler