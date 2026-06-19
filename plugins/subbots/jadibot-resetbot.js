let handler = async (m) => {
const chat = global.db.get('chats', m.chat) || {};

if (!chat.primaryBot && !chat.botPrimario) {
return m.reply('《✧》 No hay ningún bot primario establecido en este grupo.');
}

console.log(`[ResetBot] Reseteando configuración para el chat: ${m.chat}`);
chat.primaryBot = null;
chat.botPrimario = null;
global.db.set('chats', m.chat, chat);
await global.db.write?.();

await m.reply(`✐ ¡Listo! Se ha restablecido la configuración.\n> A partir de ahora, todos los bots válidos responderán nuevamente en este grupo.`);
}

handler.customPrefix = /^(resetbot|resetprimario|botreset)$/i;
handler.command=/^$/;

handler.group = true;
handler.admin = true;

export default handler;
