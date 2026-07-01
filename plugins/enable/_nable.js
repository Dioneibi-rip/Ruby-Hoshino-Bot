import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { getAntiPrivateState, normalizeSessionJid } from '../../src/core/session-utils.js';

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

const chatFeatureKeys = {
antibot: 'antiBot',
antibots: 'antiBot',
antisubbots: 'antiBot2',
antisub: 'antiBot2',
antisubot: 'antiBot2',
antibot2: 'antiBot2',
antilink: 'antiLink',
antidelete: 'delete',
antieliminar: 'delete',
antiPorno: 'antiPorno'
};

const settingFeatureKeys = {
antigrupos: 'antiGroup',
antigroup: 'antiGroup',
antigrupo: 'antiGroup',
restrict: 'restrict',
restringir: 'restrict',
antispam: 'antiSpam',
antiSpam: 'antiSpam',
antispamosos: 'antiSpam',
jadibotmd: 'jadibotmd',
modejadibot: 'jadibotmd'
};

const featureNames = {
'welcome': 'Bienvenida', 'bv': 'Bienvenida', 'bienvenida': 'Bienvenida',
'antiprivado': 'Anti-Privado', 'antipriv': 'Anti-Privado', 'antiprivate': 'Anti-Privado',
'antigrupos': 'Anti-Grupos', 'antigroup': 'Anti-Grupos', 'antigrupo': 'Anti-Grupos',
'antiPorno': 'Anti-Porno',
'restrict': 'Restringir', 'restringir': 'Restringir',
'autolevelup': 'Auto Nivel', 'autonivel': 'Auto Nivel',
'audios': 'Audios',
'autosticker': 'Auto Sticker',
'antibot': 'Anti-Bot', 'antibots': 'Anti-Bot',
'antisubbots': 'Anti-Sub Bots', 'antisub': 'Anti-Sub Bots', 'antisubot': 'Anti-Sub Bots', 'antibot2': 'Anti-Sub Bots',
'modoadmin': 'Modo Admin', 'soloadmin': 'Modo Admin', 'onlyadmin': 'Modo Admin',
'autoread': 'Auto Leer', 'autoleer': 'Auto Leer', 'autover': 'Auto Leer',
'reaction': 'Reacción', 'reaccion': 'Reacción', 'emojis': 'Reacción',
'nsfw': 'NSFW', 'nsfwhot': 'NSFW', 'nsfwhorny': 'NSFW',
'antispam': 'Anti-Spam', 'antiSpam': 'Anti-Spam', 'antispamosos': 'Anti-Spam',
'antidelete': 'Anti-Eliminar', 'antieliminar': 'Anti-Eliminar',
'jadibotmd': 'Modo Jadibot', 'modejadibot': 'Modo Jadibot',
'detect': 'Detección', 'configuraciones': 'Detección', 'avisodegp': 'Detección',
'detect2': 'Detección 2', 'avisos': 'Detección 2', 'eventos': 'Detección 2',
'antilink': 'Anti-Enlaces'
};

const handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
let chat = global.db.getChat(m.chat);
let user = global.db.getUser(m.sender);
const botJid = normalizeSessionJid(conn);
let bot = (global.db.get('settings', botJid) || {});
let type = command.toLowerCase();
let isAll = false, isUser = false;
const chatKey = chatFeatureKeys[type] || type;
const settingKey = settingFeatureKeys[type] || type;
let isEnable = chat[chatKey] ?? bot[settingKey] ?? false;

if (args[0] === 'on' || args[0] === 'enable' || args[0] === '1' || args[0] === 'block' || args[0] === 'bloquear') {
isEnable = (type === 'antiprivado' || type === 'antipriv' || type === 'antiprivate') ? 'block' : true;
} else if (args[0] === 'silent' || args[0] === 'silencioso' || args[0] === '2' || args[0] === 'ignore' || args[0] === 'ignorar') {
isEnable = (type === 'antiprivado' || type === 'antipriv' || type === 'antiprivate') ? 'ignore' : 2;
} else if (args[0] === 'off' || args[0] === 'disable' || args[0] === 'false' || args[0] === '0') {
isEnable = (type === 'antiprivado' || type === 'antipriv' || type === 'antiprivate') ? 'off' : false;
} else {
const estado = ((type === 'antiprivado' || type === 'antipriv' || type === 'antiprivate') ? getAntiPrivateState(bot) !== 'off' : (chat[chatKey] || bot[settingKey] || (type === 'autoread' && global.opts['autoread']))) ? '✓ 𝘼𝙘𝙩𝙞𝙫𝙖𝙙𝙤' : '✗ 𝘿𝙚𝙨𝙖𝙘𝙩𝙞𝙫𝙖𝙙𝙤';
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
bot.antiPrivate = ['block', 'ignore', 'off'].includes(isEnable) ? isEnable : (isEnable ? 'block' : 'off');
break;
case 'antigrupos':
case 'antigroup':
case 'antigrupo':
isAll = true;
if (!isOwner) {
global.dfail('rowner', m, conn);
throw false;
}
bot.antiGroup = isEnable === 2 ? 2 : isEnable ? 1 : false;
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
case 'onlyadmin':
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
case 'antilink':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn);
throw false;
}
}
chat.antiLink = isEnable;
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
default:
if (!isOwner) {
global.dfail('owner', m, conn);
throw false;
}
}

if (!isAll && chat[chatKey] !== undefined) {
chat[chatKey] = isEnable;
}

let displayName = featureNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
let fkontakName = '';
let replyText = '';
const scope = isAll ? 'para este Bot' : 'para este chat';

const enabledForDisplay = type === 'antiprivado' || type === 'antipriv' || type === 'antiprivate' ? getAntiPrivateState(bot) !== 'off' : Boolean(isEnable);
const antiPrivateMode = type === 'antiprivado' || type === 'antipriv' || type === 'antiprivate' ? ` (${getAntiPrivateState(bot)})` : '';

if (enabledForDisplay) {
fkontakName = `🔔 ¡${toFancyText(displayName.toUpperCase())} ${toFancyText('ACTIVADO')}!`;
replyText = `✅ *${toFancyText(`Se ha activado la función`)}: ${toFancyText(displayName + antiPrivateMode)}* ${toFancyText(scope)}.`;
} else {
fkontakName = `🔕 ¡${toFancyText(displayName.toUpperCase())} ${toFancyText('DESACTIVADO')}!`;
replyText = `❌ *${toFancyText(`Se ha desactivado la función`)}: ${toFancyText(displayName + antiPrivateMode)}* ${toFancyText(scope)}.`;
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
if (isAll) global.db.set('settings', botJid, bot);
else global.db.updateChat(m.chat, chat);
await global.db.write?.();
await global.db.save?.();

await conn.reply(m.chat, replyText, fkontak || m);
};

handler.help = ['welcome', 'audios', 'antiPorno', 'bv', 'bienvenida', 'antiprivado', 'antipriv', 'antiprivate', 'antigrupos', 'antigroup', 'antigrupo', 'restrict', 'restringir', 'autolevelup', 'autonivel', 'autosticker', 'antibot', 'antibots', 'antisubbots', 'antisub', 'antisubot', 'antibot2', 'modoadmin', 'soloadmin', 'onlyadmin', 'autoread', 'autoleer', 'autover', 'reaction', 'reaccion', 'emojis', 'nsfw', 'nsfwhot', 'nsfwhorny', 'antispam', 'antiSpam', 'antispamosos', 'antidelete', 'antieliminar', 'jadibotmd', 'modejadibot', 'subbots', 'detect', 'configuraciones', 'avisodegp', 'detect2', 'avisos', 'eventos', 'antilink', 'antitoxic', 'antitoxicos'];
handler.tags = ['nable'];
handler.command = ['welcome', 'audios', 'bv', 'bienvenida', 'antiprivado', 'antipriv', 'antiprivate', 'antigrupos', 'antigroup', 'antigrupo', 'antigrupos', 'antigroup', 'antigrupo', 'restrict', 'restringir', 'autolevelup', 'autonivel', 'autosticker', 'antibot', 'antibots', 'antisubbots', 'antisubbots', 'antisub', 'antisubot', 'antibot2', 'modoadmin', 'soloadmin', 'onlyadmin', 'autoread', 'autoleer', 'autover', 'reaction', 'reaccion', 'emojis', 'nsfw', 'nsfwhot', 'nsfwhorny', 'antispam', 'antiSpam', 'antispamosos', 'antidelete', 'antieliminar', 'jadibotmd', 'modejadibot', 'subbots', 'detect', 'configuraciones', 'avisodegp', 'detect2', 'avisos', 'eventos', 'antilink'];

export default handler;
