const handler = async (m, {conn, participants = [], groupMetadata = {}, args}) => {
const pp = await conn.profilePictureUrl(m.chat, 'image').catch((_) => null) || './src/catalogo.jpg';
participants = Array.isArray(participants) ? participants : [];
const groupAdmins = participants.filter((p) => p?.admin);
const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${String(v?.id || v?.jid || '').split('@')[0]}`).filter(Boolean).join('\n') || 'Sin administradores disponibles';
const owner = groupMetadata.owner || groupAdmins.find((p) => p.admin === 'superadmin')?.id || m.chat.split`-`[0] + '@s.whatsapp.net';
const pesan = args.join` `;
const oi = `» ${pesan}`;
const text = `『✦』Admins del grupo:

${listAdmin}

${emoji} Mensaje: ${oi}

『✦』Evita usar este comando con otras intenciones o seras *eliminado* o *baneado* del Bot.`.trim();
conn.sendFile(m.chat, pp, 'error.jpg', text, m, false, {mentions: [...groupAdmins.map((v) => v?.id || v?.jid).filter(Boolean), owner].filter(Boolean)});
};
handler.help = ['admins <texto>'];
handler.tags = ['grupo'];
handler.customPrefix = /a|@/i;
handler.command = /^(admins|@admins|dmins)$/i;
handler.group = true;

handler.needsParticipants = true

export default handler;
