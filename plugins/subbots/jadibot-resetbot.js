async function resetPrimaryBot(m) {
const chat = (global.db.data.chats ||= {})[m.chat] ||= {};

if (!chat.primaryBot && !chat.botPrimario) {
return m.reply('《✧》 No hay ningún bot primario establecido en este grupo.');
}

chat.primaryBot = null;
chat.botPrimario = null;
await global.db.write?.();

return m.reply('✐ ¡Listo! Se ha restablecido la configuración.\n> A partir de ahora, todos los bots válidos responderán nuevamente en este grupo.');
}

let handler = async (m) => resetPrimaryBot(m);

handler.before = async function (m, { isAdmin, isOwner, isROwner }) {
if (!m.isGroup) return false;
const command = m.text.trim().split(' ')[0]?.toLowerCase().replace(/^[./#]/, '') || '';
if (!['resetbot', 'resetprimario', 'botreset'].includes(command)) return false;
if (!isAdmin && !isOwner && !isROwner) return false;
await resetPrimaryBot(m);
return true;
};

handler.help = ['resetbot', 'resetprimario', 'botreset'];
handler.tags = ['jadibot'];
handler.command = ['resetbot', 'resetprimario', 'botreset'];
handler.group = true;
handler.admin = true;

export default handler;
