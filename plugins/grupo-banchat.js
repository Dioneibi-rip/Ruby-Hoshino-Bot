let handler = async (m, { conn, isROwner }) => {
    if (!isROwner && m.sender !== conn.user.jid) {
        throw `Este comando solo puede ser utilizado por el creador o por el mismo bot.`;
    }

    if (!m.isGroup) throw `Este comando solo puede usarse en grupos.`;

    let chat = global.db.data.chats[m.chat];
    if (!chat) chat = global.db.data.chats[m.chat] = {};
    
    const botJid = conn.user.jid;

    if (!chat.bannedBots) chat.bannedBots = [];

    if (chat.bannedBots.includes(botJid)) {
        return m.reply('Este bot ya se encuentra baneado en este chat.');
    }

    chat.bannedBots.push(botJid);
    m.reply(`✅ *Bot Baneado*\n\nA partir de ahora, este bot (${conn.user.name || 'este bot'}) dejará de responder a cualquier comando en este chat.\n\nPara desbanearlo, el propietario debe usar el comando #unbanchat.`);
};

handler.help = ['banchat'];
handler.tags = ['owner'];
handler.command = ['banchat'];
handler.group = true;

export default handler;