const handler = async (m, { conn, text, command, usedPrefix, participants }) => {
let who;
if (m.isGroup) {
who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text;
} else {
who = m.chat;
}

const botJid = conn.user.jid.split`@`[0] + '@s.whatsapp.net';
const reason = text || 'Comportamiento inadecuado';
const warntext = `*❌ Etiqueta a alguien o responde a un mensaje para advertir.*`;

if (!who || typeof who !== 'string' || !who.includes('@')) return m.reply(warntext, m.chat, { mentions: conn.parseMention(warntext) });

let user = global.db.getUser(who);

if (who === botJid) {
return m.reply(`ꨄ̸ִֹ  *¡No puedo advertirme a mí mismo!* Soy un bot perfecto. 💅`, m.chat);
}

const isOwner = global.owner.some(([number]) => {
const ownerJid = number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
return who === ownerJid;
});

if (isOwner) {
return m.reply(`╭۫۫── ͚  ಄֟፝֟፝  ──۫۫╮\n│ 👑 *Protección de Corona*\n│ No puedo advertir a mi creador.\n╰݂ ── ͚  ಄֟፝֟፝  ── ݂╯`, m.chat);
}

if (typeof user.warn !== 'number' || !Number.isFinite(user.warn)) user.warn = 0;
user.warn += 1;

let header, body, footer, decoration;

if (user.warn == 1) {
header = `    ݁   ╰۫۫  ⣯ ︵͡︵۟۟⏜ ۪۪  WARNING  ۫۫ ⏜۪۪︵͡︵۟۟۟   ⣻ ╯݂   ݁`;
decoration = `✿`;
body = `
> ⫐ㅤ♡᪲ㅤ *Primera Advertencia*
*Hola @${who.split`@`[0]}, por favor mantengamos el orden.*
Hemos notado una acción que no cumple las reglas.

📄 *Motivo:* ${reason}
📊 *Contador:* 1/3
`;
footer = `_🫧 Tomémoslo con calma y sigamos las reglas._`;
}
else if (user.warn == 2) {
header = `    ⚠️   ╰۫۫  ⣯ ︵͡︵۟۟⏜ ۪۪  CAUTION  ۫۫ ⏜۪۪︵͡︵۟۟۟   ⣻ ╯݂   ⚠️`;
decoration = `⚡`;
body = `
> ⫐ㅤ🌩️ㅤ *Segunda Advertencia*
*@${who.split`@`[0]}, estás colmando la paciencia.*
Esta es tu última oportunidad antes de ser sancionado.

📄 *Motivo:* ${reason}
📊 *Contador:* 2/3
`;
footer = `_🛑 El próximo aviso resultará en expulsión inmediata._`;
}
else {
header = `    ☠️   ╰۫۫  ⣯ ︵͡︵۟۟⏜ ۪۪  BANNED  ۫۫ ⏜۪۪︵͡︵۟۟۟   ⣻ ╯݂   ☠️`;
decoration = `⚰️`;
body = `
> ⫐ㅤ🥀ㅤ *Eliminación Ejecutada*
*@${who.split`@`[0]}, se te advirtió repetidamente.*
Lamentablemente no has cambiado tu actitud.

📄 *Motivo Final:* ${reason}
📊 *Contador:* 3/3 (Límite alcanzado)
`;
footer = `_👋 Hasta la vista. La salida es por allá._`;
}

const mensajeFinal = `
${header}
${body}
${footer}
`.trim();

await m.reply(mensajeFinal, null, { mentions: [who] });

if (user.warn >= 3) {
user.warn = 0;
await new Promise(res => setTimeout(res, 2000)); // Pequeña pausa dramática
try {
await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
} catch (error) {
console.error('[admin:advertencia] groupParticipantsUpdate failed', error);
return m.reply(`✦ Ocurrió un error al intentar expulsar al usuario.`);
}
}

return !1;
};

handler.command = ['advertir', 'advertencia', 'warn', 'warning'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
