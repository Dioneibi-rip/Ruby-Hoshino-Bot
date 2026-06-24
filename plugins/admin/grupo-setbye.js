let handler = async (m, { conn, text, usedPrefix, command }) => {
  const chat = global.db.getChat(m.chat);

  if (text) {
    global.db.updateChat(m.chat, { byeText: text });
    m.reply(`${emoji2} El mensaje de despedida se ha configurado correctamente para este grupo.`);
  } else {
    let bye = chat.byeText || 'No hay ningún mensaje configurado.';
    m.reply(`✳️ El mensaje de despedida actual de este grupo es:

*${bye}*

Para cambiarlo, usa: *${usedPrefix + command} <texto>*

Puedes usar las siguientes variables en tu mensaje:
- *@user*: Menciona al miembro que salió.
- *@subject*: Muestra el nombre del grupo.`);
  }
};

handler.help = ['setbye <texto>'];
handler.tags = ['group'];
handler.command = ['setbye'];
handler.admin = true;

export default handler;
