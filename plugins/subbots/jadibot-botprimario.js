function normalizeBotJid(rawJid, participants = []) {
    if (!rawJid || typeof rawJid !== 'string') return null;
    let jid = rawJid.includes('@') ? rawJid : `${rawJid.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    const [local, domain] = jid.split('@');
    if (domain) jid = `${local.split(':')[0]}@${domain}`;
    if (jid.endsWith('@lid')) {
        const pInfo = participants.find(p => p.lid === jid || p.id === jid || p.jid === jid);
        if (pInfo?.id) jid = pInfo.id;
    }
    return jid;
}

let handler = async (m, { conn, text, participants }) => {
    if (!m.isGroup) throw '⚠️ 𝙀𝙨𝙩𝙚 𝙘𝙤𝙢𝙖𝙣𝙙𝙤 𝙨𝙤𝙡𝙤 𝙥𝙪𝙚𝙙𝙚 𝙪𝙨𝙖𝙧𝙨𝙚 𝙚𝙣 𝙜𝙧𝙪𝙥𝙤𝙨.';

    const rawTarget = m.mentionedJid?.[0] || m.quoted?.sender || text;
    const botJid = normalizeBotJid(rawTarget, participants);
    if (!botJid) {
        return m.reply('⚠️ 𝘿𝙚𝙗𝙚𝙨 𝙢𝙚𝙣𝙘𝙞𝙤𝙣𝙖𝙧, 𝙧𝙚𝙨𝙥𝙤𝙣𝙙𝙚𝙧 𝙤 𝙚𝙨𝙘𝙧𝙞𝙗𝙞𝙧 𝙚𝙡 𝙣𝙪́𝙢𝙚𝙧𝙤 𝙙𝙚𝙡 𝙗𝙤𝙩 𝙦𝙪𝙚 𝙙𝙚𝙨𝙚𝙖𝙨 𝙚𝙨𝙩𝙖𝙗𝙡𝙚𝙘𝙚𝙧 𝙘𝙤𝙢𝙤 𝙥𝙧𝙞𝙣𝙘𝙞𝙥𝙖𝙡.');
    }

    const chat = global.db.get('chats', m.chat) || {};
    if (chat.primaryBot === botJid || chat.botPrimario === botJid) {
        return conn.reply(m.chat, `✨ @${botJid.split`@`[0]} 𝙮𝙖 𝙚𝙨 𝙚𝙡 𝙗𝙤𝙩 𝙥𝙧𝙞𝙢𝙖𝙧𝙞𝙤 𝙙𝙚 𝙚𝙨𝙩𝙚 𝙜𝙧𝙪𝙥𝙤.`, m, { mentions: [botJid] });
    }

    chat.primaryBot = botJid;
    chat.botPrimario = botJid;
    global.db.set('chats', m.chat, chat);
    await global.db.write?.();

    let response = `
『 🤖 』⋮⋮ 𝙎𝙚 𝙝𝙖 𝙚𝙨𝙩𝙖𝙗𝙡𝙚𝙘𝙞𝙙𝙤 𝙖:
> *@${botJid.split('@')[0]}*

『 ℹ️ 』⋮⋮ 𝙀𝙛𝙚𝙘𝙩𝙤:
> 𝘼 𝙥𝙖𝙧𝙩𝙞𝙧 𝙙𝙚 𝙖𝙝𝙤𝙧𝙖, 𝙩𝙤𝙙𝙤𝙨 𝙡𝙤𝙨 𝙘𝙤𝙢𝙖𝙣𝙙𝙤𝙨 𝙨𝙚𝙧𝙖́𝙣 𝙚𝙟𝙚𝙘𝙪𝙩𝙖𝙙𝙤𝙨 𝙥𝙤𝙧 𝙚́𝙡.

『 ⚠️ 』⋮⋮ 𝙉𝙤𝙩𝙖:
> 𝙎𝙞 𝙦𝙪𝙞𝙚𝙧𝙚𝙨 𝙦𝙪𝙚 𝙩𝙤𝙙𝙤𝙨 𝙡𝙤𝙨 𝙗𝙤𝙩𝙨 𝙫𝙪𝙚𝙡𝙫𝙖𝙣 𝙖 𝙧𝙚𝙨𝙥𝙤𝙣𝙙𝙚𝙧, 𝙪𝙨𝙖 𝙚𝙡 𝙘𝙤𝙢𝙖𝙣𝙙𝙤 *.resetbot*.
`.trim();

    await conn.sendMessage(m.chat, { text: response, mentions: [botJid] }, { quoted: m });
}

handler.help = ['setprimary <número/mención>'];
handler.tags = ['owner', 'group'];
handler.command = ['setprimary', 'setbot'];
handler.admin = true;
handler.group = true;

export default handler;
