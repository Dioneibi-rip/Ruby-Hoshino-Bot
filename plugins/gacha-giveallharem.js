import { promises as fs } from 'fs';
import {
  loadHarem,
  saveHarem,
  isSameUserId
} from '../lib/gacha-group.js';
import { resetProtectionOnTransfer } from '../lib/gacha-protection.js';

const charactersFilePath = './src/database/characters.json';
const confirmaciones = new Map();

async function loadCharacters() {
  const data = await fs.readFile(charactersFilePath, 'utf-8');
  return JSON.parse(data);
}

async function saveCharacters(characters) {
  await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
}

let handler = async (m, { conn, participants }) => {
  const normalizeToJid = (rawJid) => {
    if (!rawJid || typeof rawJid !== 'string') return rawJid;
    if (!rawJid.endsWith('@lid')) return rawJid;
    const pInfo = participants.find(p => p?.lid === rawJid);
    return pInfo?.id || rawJid;
  };

  let senderJid = normalizeToJid(m.sender);
  let mentionedJid = normalizeToJid(m.mentionedJid?.[0] || m.quoted?.sender);

  if (!mentionedJid) return m.reply('✿ Debes mencionar o responder a un mensaje del usuario para regalarle todas tus waifus en este grupo.');
  if (mentionedJid === senderJid) return m.reply('✿ No puedes regalarte tus propias waifus.');

  const groupId = m.chat;

  const characters = await loadCharacters();
  const harem = await loadHarem();
  const myWaifus = harem.filter(c => c.groupId === groupId && isSameUserId(c.userId, senderJid));

  if (myWaifus.length === 0) return m.reply('✿ No tienes waifus para regalar en este grupo.');

  const valorTotal = myWaifus.reduce((acc, w) => {
    const ch = characters.find(c => c.id === w.characterId);
    return acc + (parseInt(ch?.value) || 0);
  }, 0);

  confirmaciones.set(`${groupId}:${senderJid}`, {
    waifus: myWaifus.map(c => c.characterId),
    receptor: mentionedJid,
    valorTotal
  });

  const textoConfirmacion = `「✐」 @${senderJid.split('@')[0]}, ¿Estás seguro que deseas regalar todos tus personajes a *@${mentionedJid.split('@')[0]}* en este grupo?

❏ Personajes a regalar: *${myWaifus.length}*
❏ Valor total: *${valorTotal.toLocaleString()}*

✐ Para confirmar responde a este mensaje con "*Aceptar*".
> Esta acción no se puede deshacer, revisa bien los datos antes de confirmar.`;

  await conn.sendMessage(m.chat, {
    text: textoConfirmacion,
    mentions: [senderJid, mentionedJid]
  }, { quoted: m });
};

handler.before = async function (m, { conn, participants }) {
  const normalizeToJid = (rawJid) => {
    if (!rawJid || typeof rawJid !== 'string') return rawJid;
    if (!rawJid.endsWith('@lid')) return rawJid;
    const pInfo = participants.find(p => p?.lid === rawJid);
    return pInfo?.id || rawJid;
  };

  let senderJid = normalizeToJid(m.sender);

  const key = `${m.chat}:${senderJid}`;
  const data = confirmaciones.get(key);
  if (!data) return;

  if (m.text?.trim().toLowerCase() === 'aceptar') {
    confirmaciones.delete(key);

    const harem = await loadHarem();
    let regalados = 0;

    for (const char of harem.slice()) { // slice para evitar mutación en iteración
      if (char.groupId === m.chat && data.waifus.includes(char.characterId) && isSameUserId(char.userId, senderJid)) {
        char.userId = data.receptor;
        resetProtectionOnTransfer(char, { now: Date.now(), reason: 'giveallharem' });
        regalados++;
      }
    }

    await saveHarem(harem);

    return conn.sendMessage(m.chat, {
      text: `「✐」 Has regalado con éxito todos tus personajes a *@${data.receptor.split('@')[0]}* en este grupo!\n\n> ❏ Personajes regalados: *${regalados}*\n> ❏ Valor total: *${data.valorTotal.toLocaleString()}*`,
      mentions: [data.receptor]
    }, { quoted: m });
  }
};

handler.help = ['giveallharem @user', 'giveallharem (respondiendo mensaje)'];
handler.tags = ['gacha'];
handler.command = ['giveallharem', 'regalarharem'];
handler.group = true;
handler.register = true;

export default handler;