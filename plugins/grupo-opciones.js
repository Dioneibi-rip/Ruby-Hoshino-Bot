const handler = async (m, { conn }) => {
  const chat = global.db.data.chats[m.chat] || {};
  const metadata = await conn.groupMetadata(m.chat).catch(_ => null) || {};
  const groupName = metadata.subject || 'este Grupo';

  const status = (option) => option ? '✅' : '❌';

  const primaryBot = chat.botPrimario ? `@${chat.botPrimario.split('@')[0]}` : 'Sin establecer';

  const avatar = "https://files.catbox.moe/1k2k6p.jpg";

  const text = `╭━━━[ *CONFIGURACIÓN* ]━━━⬣
┃
┃ ✨ Grupo: *${groupName}*
┃ 🤖 Bot Primario: *${primaryBot}*
┃
┠───═[ *SEGURIDAD* ]═───⬣
┃
┃ ${status(chat.antiLink)} ◈ Antilink
┃ ${status(chat.antiLink2)} ◈ Antilink2
┃ ${status(chat.antiBot)} ◈ Antibot
┃ ${status(chat.antiBot2)} ◈ Antisubbots
┃ ${status(chat.antitoxic)} ◈ Antitoxic
┃ ${status(chat.antitraba)} ◈ Antitraba
┃ ${status(chat.antifake)} ◈ Antifake
┃
┠───═[ *AUTOMATIZACIÓN* ]═───⬣
┃
┃ ${status(chat.welcome)} ◈ Welcome
┃ ${status(chat.detect)} ◈ detect
┃ ${status(chat.autolevelup)} ◈ autolevelup
┃ ${status(chat.autoresponder)} ◈ autoresponder
┃ ${status(chat.reaction)} ◈ reaction
┃
┠───═[ *GESTIÓN Y CONTENIDO* ]═───⬣
┃
┃ ${status(chat.modoadmin)} ◈ modoadmin
┃ ${status(chat.autoAceptar)} ◈ autoAceptar
┃ ${status(chat.autoRechazar)} ◈ autoRechazar
┃ ${status(chat.nsfw)} ◈ nsfw
┃
╰━━━━━━━━━━━━━━━━━━⬣

> *Activa o desactiva una opción con, por ejemplo: #antilink*`.trim();

  await conn.sendMessage(m.chat, {
    text,
    contextInfo: {
      mentionedJid: [chat.botPrimario],
      externalAdReply: {
        title: `❖ ${groupName} ❖`,
        body: '(◍•ᴗ•◍) 𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝙲𝙸𝙾́𝙽 𝙳𝙴𝙻 𝙶𝚁𝚄𝙿𝙾',
        thumbnailUrl: avatar,
        mediaType: 1,
        showAdAttribution: true,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m });
};

handler.help = ['configuraciongrupo'];
handler.tags = ['grupo'];
handler.command = ['config', 'opciones', 'nable'];
handler.register = true;
handler.group = true;

export default handler;