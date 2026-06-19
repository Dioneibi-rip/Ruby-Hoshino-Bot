const handler = async (m, { text, conn }) => {
    const user = global.db.getUser(m.sender);
    user.afk = +new Date();
    user.afkReason = text;

    let afkText = `> ☁️ 𝖤𝗅     𝗎𝗌𝗎𝖺𝗋𝗂𝗈     𝖾𝗌𝗍𝖺𝗋𝖺́     𝗂𝗇𝖺𝖼𝗍𝗂𝗏𝗈     !
        
୨ㅤ࣪ㅤ︶︶︶︶ ㅤ꒰ 💌 ꒱ㅤ︶︶︶︶ㅤ࣪ㅤ୧

         🍥̶̸̑ 〣  *𝖴𝗌𝗎𝖺𝗋𝗂𝗈:* @${m.sender.split('@')[0]}
         🥛̫̌ യ  *𝖬𝗈𝗍𝗂𝗏𝗈:* ${text ? text : '𝖲𝗂𝗇     𝖾𝗌𝗉𝖾𝖼𝗂𝖿𝗂𝖼𝖺𝗋     !'}
         
> \`Ruby  —  𝖲𝗂𝗌𝗍𝖾𝗆𝖺 𝖠𝖥𝖪\``;

    conn.reply(m.chat, afkText, m, { mentions: [m.sender] });
};

handler.help = ['afk [razon]'];
handler.tags = ['main'];
handler.command = ['afk'];
handler.group = true;
handler.register = true;

export default handler;
