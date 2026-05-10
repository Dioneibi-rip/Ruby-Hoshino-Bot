const handler = async (m, { conn, text, command, usedPrefix, participants }) => {
    // 1. DEFINICIÓN DE VARIABLES Y OBJETIVO
    let who;
    if (m.isGroup) {
        who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text;
    } else {
        who = m.chat;
    }

    const user = global.db.data.users[who];
    const botJid = conn.user.jid.split`@`[0] + '@s.whatsapp.net';
    const reason = text || 'Comportamiento inadecuado';
    const warntext = `*❌ Etiqueta a alguien o responde a un mensaje para advertir.*`;

    // 2. VALIDACIONES DE SEGURIDAD
    if (!who) return m.reply(warntext, m.chat, { mentions: conn.parseMention(warntext) });

    // Evitar que el bot se advierta a sí mismo
    if (who === botJid) {
        return m.reply(`ꨄ̸ִֹ  *¡No puedo advertirme a mí mismo!* Soy un bot perfecto. 💅`, m.chat);
    }

    // Evitar advertir a los Owners (Dueños)
    // Buscamos si el ID del usuario está en la lista de owners global
    const isOwner = global.owner.some(([number]) => {
        const ownerJid = number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        return who === ownerJid;
    });

    if (isOwner) {
        return m.reply(`╭۫۫── ͚  ಄֟፝֟፝  ──۫۫╮\n│ 👑 *Protección de Corona*\n│ No puedo advertir a mi creador.\n╰݂ ── ͚  ಄֟፝֟፝  ── ݂╯`, m.chat);
    }

    // 3. LÓGICA DE ADVERTENCIAS Y DECORACIÓN PROGRESIVA
    if (!user) global.db.data.users[who] = { warn: 0 }; // Asegurar que el usuario existe en DB
    user.warn += 1;

    // Variables para la estética según el nivel de advertencia
    let header, body, footer, decoration;
    
    // Nivel 1: Tono Tranquilo / Soft 🌸
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
    // Nivel 2: Tono Serio / Alerta ⚠️
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
    // Nivel 3: Tono Grave / Eliminación ☠️
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

    // Construcción del mensaje final
    const mensajeFinal = `
${header}
${body}
${footer}
`.trim();

    // 4. ENVIAR MENSAJE Y EJECUTAR ACCIÓN
    await m.reply(mensajeFinal, null, { mentions: [who] });

    // Si llegó a 3 advertencias, resetear y eliminar
    if (user.warn >= 3) {
        user.warn = 0;
        await new Promise(res => setTimeout(res, 2000)); // Pequeña pausa dramática
        await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
    }

    return !1;
};

handler.command = ['advertir', 'advertencia', 'warn', 'warning'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;