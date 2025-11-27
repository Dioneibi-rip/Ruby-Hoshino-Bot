import fetch from 'node-fetch';

export async function before(m, { conn }) {
  if (!m.text || !global.prefix.test(m.text)) return;

  const usedPrefix = global.prefix.exec(m.text)[0];
  const command = m.text.slice(usedPrefix.length).trim().split(' ')[0].toLowerCase();

  const validCommand = (command, plugins) => {
    for (let plugin of Object.values(plugins)) {
      if (plugin.command) {
        const commandList = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        if (commandList.includes(command)) {
          return true;
        }
      }
    }
    return false;
  };

  if (!command) return;

  if (command === "bot") return;

  if (validCommand(command, global.plugins)) {
    let chat = global.db.data.chats[m.chat];
    let user = global.db.data.users[m.sender];

    if (chat && chat.isBanned) {
      const avisoDesactivado = `🍧 La bot *${global.botname}* está desactivada en este grupo.\n\n> ✦ Un *administrador* puede activarla con el comando:\n> » *${usedPrefix}bot on*`;
      await m.reply(avisoDesactivado);
      return;
    }

    if (user) {
      if (!user.commands) user.commands = 0;
      user.commands += 1;
    }

  } else {
    let fkontak = null;
    try {
      const res = await fetch('https://i.postimg.cc/d0DPFp3R/5a8d323a071395fcdab8465e510c749c-2025-11-17T213332-475.jpg');
      if (res.ok) {
        const thumb2 = Buffer.from(await res.arrayBuffer());
        fkontak = {
          key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
          message: {
            locationMessage: {
              name: `𝙉𝙤 𝙨𝙚 𝙝𝙖 𝙚𝙣𝙘𝙤𝙣𝙩𝙧𝙖𝙙𝙤`,
              jpegThumbnail: thumb2
            }
          },
          participant: '0@s.whatsapp.net'
        };
      }
    } catch (e) { }

    const comando = m.text.trim().split(' ')[0];

    const msjDecorado =
`(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ᥴ᥆mᥲᥒძ᥆ *${comando}* ᥒ᥆ sᥱ ᥱᥒᥴᥙᥱᥒ𝗍rᥲ rᥱgіs𝗍rᥲძ᥆. ᥱs ⍴᥆sіᑲᥣᥱ 𝗊ᥙᥱ ᥱs𝗍ᥱ mᥲᥣ ᥱsᥴrі𝗍᥆ ᥆ ᥒ᥆ ᥱ᥊іs𝗍ᥲ.

⍴ᥲrᥲ ᥴ᥆ᥒsᥙᥣ𝗍ᥲr ᥣᥲ ᥣіs𝗍ᥲ ᥴ᥆m⍴ᥣᥱ𝗍ᥲ ძᥱ 𝖿ᥙᥒᥴі᥆ᥒᥲᥣіძᥲძᥱs ᥙsᥲ:
» *${usedPrefix}help*`;

    if (fkontak) {
      await conn.sendMessage(m.chat, { text: msjDecorado }, { quoted: fkontak });
    } else {
      await m.reply(msjDecorado);
    }
  }
}