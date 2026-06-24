let handler = async (m, { conn, text }) => {
    let amount = parseInt(text.trim());

    if (isNaN(amount) || amount <= 0) {
        return conn.reply(m.chat, `${emoji} Por favor, ingrese una cantidad válida de ${m.moneda}.`, m);
    }

    let code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const codes = global.db.getSection('codes') || {};
    codes[code] = { coin: amount, claimedBy: [] };
    global.db.replaceSection('codes', codes);

    conn.reply(m.chat, `${emoji} Código generado: *${code}*\nEste código puede ser canjeado por ${amount} ${m.moneda} y puede ser utilizado por 50 personas.`, m);
}

handler.help = ['codigo <cantidad de coins>'];
handler.tags = ['owner'];
handler.command = ['codigo']
handler.rowner = true;

export default handler;