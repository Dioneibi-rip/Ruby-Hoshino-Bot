let handler = async (m, { conn, text, usedPrefix, command }) => {
  let chat = global.db.data.chats[m.chat];
  if (!chat) chat = global.db.data.chats[m.chat] = {};

  if (text) {
    chat.byeText = text;
    m.reply('${emoji2} El mensaje de despedida se ha configurado correctamente para este grupo.');
  } else {
    let bye = chat.byeText || 'No hay ningún mensaje configurado.';
    m.reply(`✳️ El mensaje de despedida actual de este grupo es:\n\n*${bye}*\n\nPara cambiarlo, usa: *${usedPrefix + command} <texto>*\n\nPuedes usar las siguientes variables en tu mensaje:\n- *@user*: Menciona al miembro que salió.\n- *@subject*: Muestra el nombre del grupo.`);
  }
};

handler.help = ['setbye <texto>'];
handler.tags = ['group'];
handler.command = ['setbye'];
handler.admin = true;

export default handler;
