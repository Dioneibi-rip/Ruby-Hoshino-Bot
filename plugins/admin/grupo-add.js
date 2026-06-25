const { proto } = (await import('@whiskeysockets/baileys')).default;

let handler = async (m, { conn, participants, text, usedPrefix, command }) => {
  if (!m.isGroup) return;
  

  if (!text) {
    return m.reply(`${emoji} Por favor, ingresa el número de la persona a la que quieres invitar.\n\n*Ejemplo:*\n*${usedPrefix + command} 5211234567890*`);
  }

  const number = text.replace(/[^0-9]/g, '');
  if (isNaN(number)) {
    return m.reply('❌ El número ingresado no es válido. Asegúrate de incluir el código de país sin el símbolo "+".');
  }
  
  const userJid = `${number}@s.whatsapp.net`;

  try {
    const [result] = await conn.onWhatsApp(userJid);
    if (!result || !result.exists) {
      return m.reply(`❌ El número *${number}* no es válido o no tiene una cuenta de WhatsApp.`);
    }

    const userExists = participants.some(p => p.id === userJid);
    if (userExists) {
      return m.reply('✅ El usuario que intentas invitar ya se encuentra en el grupo.');
    }

    const groupMetadata = await conn.groupMetadata(m.chat);
    const groupName = groupMetadata.subject;
    const inviteCode = await conn.groupInviteCode(m.chat);
    const inviteUrl = 'https://chat.whatsapp.com/' + inviteCode;

    const messageText = `👋 ¡Hola! Te han invitado a unirte al grupo de WhatsApp "${groupName}".\n\nHaz clic en el siguiente enlace para unirte:\n\n${inviteUrl}`;

    await conn.sendMessage(userJid, { text: messageText });

    m.reply(`✅ ¡Listo! Se envió el enlace de invitación a @${number}.`, null, { mentions: [userJid] });

  } catch (e) {
    console.error("Error al enviar invitación:", e);
    m.reply(`❌ Ocurrió un error al enviar la invitación.\n\n*Detalle del error:*\n${e.message || e}`);
  return false;
  }
};

handler.help = ['invitar <número>', 'add <número>'];
handler.tags = ['group'];
handler.command = ['add', 'agregar', 'añadir', 'invite', 'invitar'];

handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
