let handler = async (m, { conn, isROwner }) => {
    if (!isROwner && m.sender !== conn.user.jid) {
        throw `Este comando solo puede ser utilizado por el creador o el mismo bot.`;
    }


    let chat = global.db.data.chats[m.chat];
    if (!chat || !chat.bannedBots) {
        return m.reply('Este bot no está baneado en este chat.');
    }

    const botJid = conn.user.jid;

    if (!chat.bannedBots.includes(botJid)) {
        return m.reply('Este bot no está baneado en este chat.');
    }

    chat.bannedBots = chat.bannedBots.filter(jid => jid !== botJid);

    m.reply(`✅ *Bot Desbaneado*\n\nEste bot (${conn.user.name || 'este bot'}) volverá a responder a los comandos en este chat a partir de ahora.`);
};

handler.help = ['unbanchat'];
handler.tags = ['owner'];
handler.command = ['unbanchat', 'desbanearchat'];
handler.group = true;

export default handler;