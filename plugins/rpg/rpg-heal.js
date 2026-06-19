let handler = async (m, { conn }) => {
    let user = global.db.getUser(m.sender);

    if (!user) {
        return conn.reply(m.chat, `✧⃝❛ El usuario no está registrado en la base de datos.`, m);
    }

    const costoCura = 1000;
    const cura = 75;

    if (user.coin < costoCura) {
        return conn.reply(m.chat, `💔 No tienes suficientes *${m.moneda}* para curarte.\nNecesitas al menos *¥${costoCura.toLocaleString()} ${m.moneda}*.`, m);
    }

    user.health += cura;
    user.coin -= costoCura;

    if (user.health > 100) user.health = 100;

    user.lastHeal = new Date();

    const mensaje = `
╭───────❍
│🌸 *¡Curación exitosa!*  
│❤️ *+${cura}* puntos de vida restaurados
│💸 *Costo:* ¥${costoCura.toLocaleString()} ${m.moneda}
╰──────────❍

🏷️ *Estado actual*
› ❤️ Vida: *${user.health}/100*
› 💰 Monedas: *¥${user.coin.toLocaleString()} ${m.moneda}*
`;

    await conn.sendMessage(m.chat, { text: mensaje.trim() }, { quoted: m });
};

handler.help = ['heal'];
handler.tags = ['rpg'];
handler.command = ['heal', 'curar'];
handler.group = true;
handler.register = true;

export default handler;