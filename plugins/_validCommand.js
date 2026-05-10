import fetch from 'node-fetch';

let cachedCommands = new Set();
let cachedPluginSize = -1;
let cachedPluginRefs = new Map();
let thumbnailPromise = null;

function toCommandList(commandConfig) {
  if (!commandConfig) return [];
  return Array.isArray(commandConfig) ? commandConfig : [commandConfig];
}

function buildCommandCache(plugins) {
  const pluginEntries = Object.entries(plugins);
  const pluginSize = pluginEntries.length;

  const isCacheValid =
    pluginSize === cachedPluginSize &&
    pluginEntries.every(([name, plugin]) => cachedPluginRefs.get(name) === plugin);

  if (isCacheValid) return;

  const nextCache = new Set();
  const nextRefs = new Map();

  for (const [name, plugin] of pluginEntries) {
    nextRefs.set(name, plugin);
    for (const command of toCommandList(plugin?.command)) {
      if (typeof command === 'string') nextCache.add(command.toLowerCase());
    }
  }

  cachedCommands = nextCache;
  cachedPluginRefs = nextRefs;
  cachedPluginSize = pluginSize;
}

async function getUnknownCommandThumbnail() {
  if (!thumbnailPromise) {
    thumbnailPromise = fetch('https://i.postimg.cc/d0DPFp3R/5a8d323a071395fcdab8465e510c749c-2025-11-17T213332-475.jpg')
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((buf) => (buf ? Buffer.from(buf) : null))
      .catch(() => null);
  }
  return thumbnailPromise;
}

export async function before(m, { conn, isAdmin, isOwner, isROwner }) {
  if (!m.text) return;

  const prefixMatch = global.prefix.exec(m.text);
  if (!prefixMatch) return;

  const usedPrefix = prefixMatch[0];

  const chat = global.db.data.chats[m.chat];
  const botJid = conn?.user?.jid;
  const isBotBannedInThisChat = Boolean(chat?.bannedBots && botJid && chat.bannedBots.includes(botJid));

  if (isBotBannedInThisChat) {
    const mode = chat?.banchatMode || 'silent';
    if (mode === 'strict') return;
    if (mode === 'silent' && !isOwner && !isROwner) return;
  }
  if (chat?.modoadmin && m.isGroup && !isAdmin && !isOwner && !isROwner) return;
  if (['>', '=>', '$'].includes(usedPrefix)) return;

  const command = m.text.slice(usedPrefix.length).trim().split(' ')[0]?.toLowerCase();
  if (!command || command === 'bot') return;

  if (!/^[a-z0-9][\w-]*$/i.test(command)) return;

  buildCommandCache(global.plugins);
  const isKnownCommand = cachedCommands.has(command);

  if (isKnownCommand) {
    const user = global.db.data.users[m.sender];

    if (chat?.isBanned) {
      const avisoDesactivado = `🍧 La bot *${global.botname}* está desactivada en este grupo.\n\n> ✦ Un *administrador* puede activarla con el comando:\n> » *${usedPrefix}bot on*`;
      await m.reply(avisoDesactivado);
      return;
    }

    if (user) {
      user.commands = (user.commands || 0) + 1;
    }
    return;
  }

  const comando = m.text.trim().split(' ')[0];
  const msjDecorado =
`(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ᥴ᥆mᥲᥒძ᥆ *${comando}* ᥒ᥆ sᥱ ᥱᥒᥴᥙᥱᥒ𝗍rᥲ rᥱgіs𝗍rᥲძ᥆. ᥱs ⍴᥆sіᑲᥣᥱ 𝗊ᥙᥱ ᥱs𝗍ᥱ mᥲᥣ ᥱsᥴrі𝗍᥆ ᥆ ᥒ᥆ ᥱ᥊іs𝗍ᥲ.

⍴ᥲrᥲ ᥴ᥆ᥒsᥙᥣ𝗍ᥲr ᥣᥲ ᥣіs𝗍ᥲ ᥴ᥆m⍴ᥣᥱ𝗍ᥲ ძᥱ 𝖿ᥙᥒᥴі᥆ᥒᥲᥣіძᥲძᥱs ᥙsᥲ:
» *${usedPrefix}help*`;

  const thumb2 = await getUnknownCommandThumbnail();
  if (thumb2) {
    const fkontak = {
      key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: {
        locationMessage: {
          name: '𝙉𝙤 𝙨𝙚 𝙝𝙖 𝙚𝙣𝙘𝙤𝙣𝙩𝙧𝙖𝙙𝙤',
          jpegThumbnail: thumb2,
        },
      },
      participant: '0@s.whatsapp.net',
    };
    await conn.sendMessage(m.chat, { text: msjDecorado }, { quoted: fkontak });
    return;
  }

  await m.reply(msjDecorado);
}
