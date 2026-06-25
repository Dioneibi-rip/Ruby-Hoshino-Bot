let handler = async (m, { conn, text }) => {
    let code = text.trim().toUpperCase();

    if (!code) {
        await conn.reply(m.chat, `${emoji} Por favor, ingrese un código para canjear.`, m);
        return false;
    }

    let codesDB = global.db.getSection('codes') || {};

    if (!codesDB[code]) {
        await conn.reply(m.chat, `${emoji2} Código no válido.`, m);
        return false;
    }

    if (codesDB[code].claimedBy.includes(m.sender)) {
        return conn.reply(m.chat, `${emoji2} Ya has canjeado este código.`, m);
    }

    if (codesDB[code].claimedBy.length >= 5) {
        await conn.reply(m.chat, `${emoji2} Este código fue agotado completamente... Espera a que el creador ponga otro código.`, m);
        return false;
    }

    global.db.addMoney(m.sender, codesDB[code].coin);
    codesDB[code].claimedBy.push(m.sender);
    global.db.replaceSection('codes', codesDB);

    let remaining = Math.max(0, 5 - codesDB[code].claimedBy.length);

    conn.reply(m.chat, `${emoji} Has canjeado el código con éxito. Has recibido ${codesDB[code].coin} ${m.moneda}.\nQuedan ${remaining} vacantes para canjear el código.`, m);
}

handler.help = ['canjear <código>'];
handler.tags = ['economia'];
handler.command = ['canjear'];
handler.group = true;
handler.register = true;

export default handler;
