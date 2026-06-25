const handler = async (m, { isOwner, isAdmin, conn, text, participants, args, command, usedPrefix }) => {
  if (usedPrefix == 'a' || usedPrefix == 'A') return;

  const botname = global.botname || 'Ruby';

  m.react('✅');

  if (!(isAdmin || isOwner)) {
    global.dfail('admin', m, conn);
    throw false;
  }

  let fkontak = null;
  try {
    const res = await fetch('https://i.postimg.cc/nhdkndD6/pngtree-yellow-bell-ringing-with-sound-waves-png-image-20687908.png');
    const thumb2 = Buffer.from(await res.arrayBuffer());
    fkontak = {
      key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: {
        locationMessage: {
          name: `¡𝙈𝙀𝙉𝘾𝙄𝙊𝙉 𝙋𝘼𝙍𝘼 𝙏𝙊𝘿𝙊 𝙀𝙇 𝙂𝙍𝙐𝙋𝙊!`,
          jpegThumbnail: thumb2
        }
      },
      participant: '0@s.whatsapp.net'
    };
  } catch (e) {}

  const mensaje = args.join` ` || 'Atención a todos';

  const titulo = `*─ᐅ「 𝗔𝗩𝗜𝗦𝗢 𝗚𝗘𝗡𝗘𝗥𝗔𝗟 」*`;

  let texto = `${titulo}\n\n`;
  texto += `*Mensaje:* \`${mensaje}\`\n\n`;

  texto += `╭─「 *Invocando al grupo* 」\n`;

  for (const member of participants) {
    texto += `│ ${emoji} @${member.id.split('@')[0]}\n`;
  }

  texto += `╰─「 ${botname} 」`;

  conn.sendMessage(m.chat, { text: texto, mentions: participants.map((a) => a.id) }, { quoted: fkontak });
  return false;
};

handler.help = ['tagall *<mensaje opcional>*'];
handler.tags = ['group'];
handler.command = ['todos', 'invocar', 'tagall'];
handler.admin = true;
handler.group = true;

export default handler;
