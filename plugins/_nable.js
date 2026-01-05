import { createHash } from 'crypto';
import fetch from 'node-fetch';

const fancyFontMap = {
  'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
  'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢', 'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯',
  '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
};

function toFancyText(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  return text.split('').map(char => fancyFontMap[char] || char).join('');
}

const featureNames = {
  'welcome': 'Bienvenida', 'bv': 'Bienvenida', 'bienvenida': 'Bienvenida',
  'antiprivado': 'Anti-Privado', 'antipriv': 'Anti-Privado', 'antiprivate': 'Anti-Privado',
  'antiPorno': 'Anti-Porno',
  'restrict': 'Restringir', 'restringir': 'Restringir',
  'autolevelup': 'Auto Nivel', 'autonivel': 'Auto Nivel',
  'audios': 'Audios',
  'autosticker': 'Auto Sticker',
  'antibot': 'Anti-Bot', 'antibots': 'Anti-Bot',
  'autoaceptar': 'Auto Aceptar', 'aceptarauto': 'Auto Aceptar',
  'autorechazar': 'Auto Rechazar', 'rechazarauto': 'Auto Rechazar',
  'autoresponder': 'Auto Responder', 'autorespond': 'Auto Responder',
  'antisubbots': 'Anti-Sub Bots', 'antisub': 'Anti-Sub Bots', 'antisubot': 'Anti-Sub Bots', 'antibot2': 'Anti-Sub Bots',
  'modoadmin': 'Modo Admin', 'soloadmin': 'Modo Admin',
  'autoread': 'Auto Leer', 'autoleer': 'Auto Leer', 'autover': 'Auto Leer',
  'antiver': 'Anti Ver (View Once)', 'antiocultar': 'Anti Ver (View Once)', 'antiviewonce': 'Anti Ver (View Once)',
  'reaction': 'Reacción', 'reaccion': 'Reacción', 'emojis': 'Reacción',
  'nsfw': 'NSFW', 'nsfwhot': 'NSFW', 'nsfwhorny': 'NSFW',
  'antispam': 'Anti-Spam', 'antiSpam': 'Anti-Spam', 'antispamosos': 'Anti-Spam',
  'antidelete': 'Anti-Eliminar', 'antieliminar': 'Anti-Eliminar',
  'jadibotmd': 'Modo Jadibot', 'modejadibot': 'Modo Jadibot',
  'detect': 'Detección', 'configuraciones': 'Detección', 'avisodegp': 'Detección',
  'detect2': 'Detección 2', 'avisos': 'Detección 2', 'eventos': 'Detección 2',
  'autosimi': 'SimSimi', 'simsimi': 'SimSimi',
  'antilink': 'Anti-Enlaces', 'antilink2': 'Anti-Enlaces 2',
  'antitrabas': 'Anti-Trabas', 'antitraba': 'Anti-Trabas',
  'antifake': 'Anti-Fakes', 'antivirtuales': 'Anti-Fakes'
};

const handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  let chat = global.db.data.chats[m.chat];
  let user = global.db.data.users[m.sender];
  let bot = global.db.data.settings[conn.user.jid] || {};
  let type = command.toLowerCase();
  let isAll = false, isUser = false;
  let isEnable = chat[type] || false;

  if (args[0] === 'on' || args[0] === 'enable') {
    isEnable = true;
  } else if (args[0] === 'off' || args[0] === 'disable') {
    isEnable = false;
  } else {
    const estado = (chat[type] || (type === 'antiprivado' && bot.antiPrivate) || (type === 'restrict' && bot.restrict) || (type === 'autoread' && global.opts['autoread']) || (type === 'antispam' && bot.antiSpam) || (type === 'jadibotmd' && bot.jadibotmd)) ? '✓ 𝘼𝙘𝙩𝙞𝙫𝙖𝙙𝙤' : '✗ 𝘿𝙚𝙨𝙖𝙘𝙩𝙞𝙫𝙖𝙙𝙤';
    const estadoFancy = toFancyText(estado);
    const comandoFancy = toFancyText(command);
    const prefijoFancy = toFancyText(usedPrefix);
    return conn.reply(m.chat, `「🔔」${toFancyText('Uso del comando')} ${comandoFancy}\n\n${toFancyText('Un administrador puede activar o desactivar esta función usando:')}\n\n> ✐ *${prefijoFancy}${comandoFancy} ${toFancyText('on')}* ${toFancyText('(Activar)')}\n> ✐ *${prefijoFancy}${comandoFancy} ${toFancyText('off')}* ${toFancyText('(Desactivar)')}\n\n${toFancyText('Estado actual:')} *${estadoFancy}*`, m);
  }

  switch (type) {
    case 'welcome':
    case 'bv':
    case 'bienvenida':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      chat.welcome = isEnable;
      break;
    case 'antiprivado':
    case 'antipriv':
    case 'antiprivate':
      isAll = true;
      if (!isOwner) {
        global.dfail('rowner', m, conn);
        throw false;
      }
      bot.antiPrivate = isEnable;
      break;
    case 'antiPorno':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.antiPorno = isEnable;
      break;
    case 'restrict':
    case 'restringir':
      isAll = true;
      if (!isOwner) {
        global.dfail('rowner', m, conn);
        throw false;
      }
      bot.restrict = isEnable;
      break;
    case 'autolevelup':
    case 'autonivel':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.autolevelup = isEnable;
      break;
    case 'audios':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.audios = isEnable;
      break;
    case 'autosticker':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.autosticker = isEnable;
      break;
    case 'antibot':
    case 'antibots':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.antiBot = isEnable;
      break;
    case 'autoaceptar':
    case 'aceptarauto':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.autoAceptar = isEnable;
      break;
    case 'autorechazar':
    case 'rechazarauto':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.autoRechazar = isEnable;
      break;
    case 'autoresponder':
    case 'autorespond':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      chat.autoresponder = isEnable;
      break;
    case 'antisubbots':
    case 'antisub':
    case 'antisubot':
    case 'antibot2':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.antiBot2 = isEnable;
      break;
    case 'modoadmin':
    case 'soloadmin':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.modoadmin = isEnable;
      break;
    case 'autoread':
    case 'autoleer':
    case 'autover':
      isAll = true;
      if (!isROwner) {
        global.dfail('rowner', m, conn);
        throw false;
      }
      global.opts['autoread'] = isEnable;
      break;
    case 'antiver':
    case 'antiocultar':
    case 'antiviewonce':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      chat.antiver = isEnable;
      break;
    case 'reaction':
    case 'reaccion':
    case 'emojis':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      chat.reaction = isEnable;
      break;
    case 'nsfw':
    case 'nsfwhot':
    case 'nsfwhorny':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      chat.nsfw = isEnable;
      break;
    case 'antispam':
    case 'antiSpam':
    case 'antispamosos':
      isAll = true;
      if (!isOwner) {
        global.dfail('rowner', m, conn);
        throw false;
      }
      bot.antiSpam = isEnable;
      break;
    case 'antidelete': 
    case 'antieliminar':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.delete = isEnable;
      break;
    case 'jadibotmd':
    case 'modejadibot':
      isAll = true;
      if (!isOwner) {
        global.dfail('rowner', m, conn);
        throw false;
      }
      bot.jadibotmd = isEnable;
      break;
    case 'detect':
    case 'configuraciones':
    case 'avisodegp':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      chat.detect = isEnable;
      break;
    case 'detect2':
    case 'avisos':
    case 'eventos':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      chat.detect2 = isEnable;
      break;
    case 'autosimi':
    case 'simsimi':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      chat.simi = isEnable;
      break;
    case 'antilink':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.antiLink = isEnable;
      break;
    case 'antilink2':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.antiLink2 = isEnable;
      break;
    case 'antitoxic': 
    case 'antitoxicos':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.antitoxic = isEnable;
      break;
    case 'antitrabas': 
    case 'antitraba':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
       chat.antiTraba = isEnable;
      break;
    case 'antifake': 
    case 'antivirtuales':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      chat.antifake = isEnable;
      break;
    default:
      if (!isOwner) {
          global.dfail('owner', m, conn);
          throw false;
      }
  }

  if (chat[type] !== undefined) {
    chat[type] = isEnable;
  }

  let displayName = featureNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  let fkontakName = '';
  let replyText = '';
  const scope = isAll ? 'para este Bot' : 'para este chat';

  if (isEnable) {
      fkontakName = `🔔 ¡${toFancyText(displayName.toUpperCase())} ${toFancyText('ACTIVADO')}!`;
      replyText = `✅ *${toFancyText(`Se ha activado la función`)}: ${toFancyText(displayName)}* ${toFancyText(scope)}.`;
  } else {
      fkontakName = `🔕 ¡${toFancyText(displayName.toUpperCase())} ${toFancyText('DESACTIVADO')}!`;
      replyText = `❌ *${toFancyText(`Se ha desactivado la función`)}: ${toFancyText(displayName)}* ${toFancyText(scope)}.`;
  }

  let fkontak = null;
  try {
      const res = await fetch('https://i.postimg.cc/nhdkndD6/pngtree-yellow-bell-ringing-with-sound-waves-png-image-20687908.png');
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
      const thumb2 = Buffer.from(await res.arrayBuffer());
      fkontak = {
          key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Notificacion' },
          message: { locationMessage: { name: fkontakName, jpegThumbnail: thumb2 } },
          participant: '0@s.whatsapp.net'
      };
  } catch (e) {
      console.error('Error al crear el fkontak:', e);
  }
  await conn.reply(m.chat, replyText, fkontak || m);
};

handler.help = ['welcome', 'audios', 'antiPorno', 'bv', 'bienvenida', 'antiprivado', 'antipriv', 'antiprivate', 'restrict', 'restringir', 'autolevelup', 'autonivel', 'autosticker', 'antibot', 'antibots', 'autoaceptar', 'aceptarauto', 'autorechazar', 'rechazarauto', 'autoresponder', 'autorespond', 'antisubbots', 'antisub', 'antisubot', 'antibot2', 'modoadmin', 'soloadmin', 'autoread', 'autoleer', 'autover', 'antiver', 'antiocultar', 'antiviewonce', 'reaction', 'reaccion', 'emojis', 'nsfw', 'nsfwhot', 'nsfwhorny', 'antispam', 'antiSpam', 'antispamosos', 'antidelete', 'antieliminar', 'jadibotmd', 'modejadibot', 'subbots', 'detect', 'configuraciones', 'avisodegp', 'detect2', 'avisos', 'eventos', 'autosimi', 'simsimi', 'antilink', 'antilink2', 'antitoxic', 'antitoxicos', 'antitraba', 'antitrabas', 'antifake', 'antivirtuales'];
handler.tags = ['nable'];
handler.command = ['welcome', 'audios', 'bv', 'bienvenida', 'antiprivado', 'antipriv', 'antiprivate', 'restrict', 'restringir', 'autolevelup', 'autonivel', 'autosticker', 'antibot', 'antibots', 'autoaceptar', 'aceptarauto', 'autorechazar', 'rechazarauto', 'autoresponder', 'autorespond', 'antisubbots', 'antisubbots', 'antisub', 'antisubot', 'antibot2', 'modoadmin', 'soloadmin', 'autoread', 'autoleer', 'autover', 'antiver', 'antiocultar', 'antiviewonce', 'reaction', 'reaccion', 'emojis', 'nsfw', 'nsfwhot', 'nsfwhorny', 'antispam', 'antiSpam', 'antispamosos', 'antidelete', 'antieliminar', 'jadibotmd', 'modejadibot', 'subbots', 'detect', 'configuraciones', 'avisodegp', 'detect2', 'avisos', 'eventos', 'autosimi', 'simsimi', 'antilink', 'antilink2', 'antitraba', 'antitrabas', 'antifake', 'antivirtuales'];

export default handler;