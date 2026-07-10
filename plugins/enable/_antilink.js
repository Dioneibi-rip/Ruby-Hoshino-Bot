let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
let linkRegex1 = /whatsapp\.com\/channel\/([0-9A-Za-z]{20,24})/i;

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
if (!m.isGroup) return !0;

let chat = global.db.data.chats[m.chat] || {};
if (!chat.antiLink && !chat.antilink) return !0; // Salida rápida si está apagado

// Extracción profunda del texto para evadir el bypass de vistas previas (link previews)
let text = m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || '';
if (!text) return !0;

// Excepciones para altos mandos
if (isAdmin || isOwner || isROwner || m.fromMe) return !0;

const isGroupLink = linkRegex.test(text) || linkRegex1.test(text);

if (isGroupLink) {
if (!isBotAdmin) {
await m.reply('✦ El antilink está activo pero no puedo eliminarte porque no soy admin.');
return !0;
}

// Extraer el código de invitación de ESTE grupo de forma segura
const inviteCode = await conn.groupInviteCode(m.chat).catch(() => null);
if (inviteCode && text.includes(`chat.whatsapp.com/${inviteCode}`)) return !0;

// Ejecutar limpieza y baneo secuencialmente
await conn.sendMessage(m.chat, { delete: m.key });
await conn.sendMessage(m.chat, { text: `*「 ENLACE DETECTADO 」*\n\n《✧》@${m.sender.split('@')[0]} Rompiste las reglas del Grupo. Serás eliminado...`, mentions: [m.sender] }, { quoted: m });

try {
await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
} catch (e) {
console.error('Error al expulsar infractor en antilink:', e);
}
}
return !0;
}
