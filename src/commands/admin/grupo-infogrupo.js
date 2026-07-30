const handler = async (m, {conn, participants = [], groupMetadata = {}}) => {
const pp = await conn.profilePictureUrl(m.chat, 'image').catch((_) => null) || `${icono}`;
const {antiLink, detect, welcome, modoadmin, antiPrivate, nsfw, restrict, antiSpam, reaction, antiToxic} = global.db.getChat(m.chat);
participants = Array.isArray(participants) ? participants : [];
const groupAdmins = participants.filter((p) => p?.admin);
const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${String(v?.id || v?.jid || '').split('@')[0]}`).filter(Boolean).join('\n') || 'Sin administradores disponibles';
const owner = groupMetadata.owner || groupAdmins.find((p) => p.admin === 'superadmin')?.id || m.chat.split`-`[0] + '@s.whatsapp.net';
const text = `*✧･ﾟ INFO GRUPO ﾟ･✧*
❀ *ID:*
→ ${groupMetadata.id}
⚘ *Nombre:*
→ ${groupMetadata.subject}
✦ *Descripción:*
→ ${groupMetadata.desc?.toString() || 'Sin Descripción'}
❖ *Miembros:*
→ ${participants.length} Participantes
✰ *Creador del Grupo:*
→ @${owner.split('@')[0]}
✥ *Administradores:*
${listAdmin}

˚₊· ͟͟͞͞➳❥ *CONFIGURACIÓN*

◈ *Welcome:* ${welcome ? '✅' : ''}
◈ *Detect:* ${detect ? '✅' : '❌'}
◈ *:* ${antiLink ? '✅' : '❌'}
◈ *Nfsw:* ${nsfw ? '✅' : '❌'}
◈ *Antiprivado:* ${antiPrivate ? '✅' : '❌'}
◈ *Modoadmin:* ${modoadmin ? '✅' : '❌'}
◈ *Reacción* ${reaction ? "✅️" : "❌️"}
◈ *Antispam:* ${antiSpam ? '✅' : '❌'}
◈ *Restrict:* ${restrict ? '✅' : '❌'}
◈ *:* ${antiToxic ? '✅' : '❌'}
`.trim();
conn.sendFile(m.chat, pp, 'img.jpg', text, m, false, {mentions: [...groupAdmins.map((v) => v?.id || v?.jid).filter(Boolean), owner].filter(Boolean)});
};
handler.help = ['infogrupo'];
handler.tags = ['grupo'];
handler.command = ['infogrupo', 'gp'];
handler.register = true
handler.group = true;

handler.needsParticipants = true

export default handler;
