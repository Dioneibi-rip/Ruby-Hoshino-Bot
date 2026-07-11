let handler = async (m, { conn, text, usedPrefix, command }) => {
const chat = global.db.getChat(m.chat);

if (text) {
global.db.updateChat(m.chat, { welcomeText: text });
m.reply('🫟 El mensaje de bienvenida se ha configurado correctamente para este grupo.');
} else {
let welcome = chat.welcomeText || 'No hay ningún mensaje configurado.';
m.reply(`✳️ El mensaje de bienvenida actual de este grupo es:

*${welcome}*

Para cambiarlo, usa: *${usedPrefix + command} <texto>*

Puedes usar las siguientes variables en tu mensaje:
- *@user*: Menciona al nuevo miembro.
- *@subject*: Muestra el nombre del grupo.
- *@desc*: Muestra la descripción del grupo.`);
}
};

handler.help = ['setwelcome <texto>'];
handler.tags = ['group'];
handler.command = ['setwelcome'];
handler.admin = true;

export default handler;
