import fetch from 'node-fetch';

export async function before(m, { conn }) {
  if (!m.text ||!global.prefix.test(m.text)) return;

  const usedPrefix = global.prefix.exec(m.text)[0];
  const command = m.text.slice(usedPrefix.length).trim().split(' ')[0].toLowerCase();

  if (!command || command === 'bot') return;

  const isValidCommand = (command, plugins) => {
    for (let plugin of Object.values(plugins)) {
      const cmd = Array.isArray(plugin.command)? plugin.command : [plugin.command];
      if (cmd.includes(command)) return true;
    }
    return false;
  };

  if (isValidCommand(command, global.plugins)) {
    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
    global.db.data.users[m.sender].commands = (global.db.data.users[m.sender].commands || 0) + 1
    return;
  }

  const texto = `🍛 ᴇʟ ᴄᴏᴍᴀɴᴅᴏ *${command}* ɴᴏ ᴇxɪsᴛᴇ.
> 🍜 ᴜsᴀ *${usedPrefix}ʜᴇʟᴘ* ᴘᴀʀᴀ ᴠᴇʀ ʟᴀ ʟɪsᴛᴀ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs.`

  try {
    await conn.sendMessage(m.chat, {
      text: texto,
      mentions: [m.sender],
      contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363421367237421@newsletter',
          serverMessageId: '',
          newsletterName: 'ׄ﹙ׅ🍜﹚ּ 𝐆𝐨𝐣𝐨𝐁𝐨𝐭-𝐌𝐃 › 𝘊𝘩𝘢𝘯𝘦𝘭 𝘰𝘧𝘪𝘤𝘪𝘢𝘭 ᰔᩚ.ᐟ.ᐟ'
        },
        externalAdReply: {
          title: global.botname || 'GOJOBOT-MD',
          body: 'Sistema de comandos',
          thumbnailUrl: global.icons || '',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })
  } catch (e) {
    // Fallback: mensaje simple sin newsletter
    await conn.sendMessage(m.chat, { text: texto }, { quoted: m })
  }
                           }