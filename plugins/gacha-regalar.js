import { promises as fs } from 'fs';
import {
  loadHarem,
  saveHarem,
  addOrUpdateClaim,
  removeClaim,
  getUserClaims,
  isSameUserId
} from '../lib/gacha-group.js';
import { resetProtectionOnTransfer } from '../lib/gacha-protection.js';
import { findCharacterByName } from '../lib/gacha-characters.js';

const charactersFilePath = './src/database/characters.json';

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('No se pudo cargar el archivo characters.json.');
  }
}

async function saveCharacters(characters) {
  try {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
  } catch (error) {
    throw new Error('No se pudo guardar el archivo characters.json.');
  }
}

let handler = async (m, { conn, args, participants }) => {
  const normalizeToJid = (rawJid) => {
    if (!rawJid || typeof rawJid !== 'string') return rawJid;
    if (!rawJid.endsWith('@lid')) return rawJid;
    const pInfo = participants.find(p => p?.lid === rawJid);
    return pInfo?.id || rawJid;
  };

  let userId = normalizeToJid(m.sender);
  const groupId = m.chat;

  if (args.length < 1) {
    await conn.reply(m.chat, 'Debes especificar el nombre del personaje. Ej: #regalar Aika Sano @user o responde a un mensaje: #regalar Aika Sano', m);
    return;
  }

  let rawWho = m.mentionedJid?.[0] || m.quoted?.sender;
  let characterArgs = [...args];

  if (m.mentionedJid?.[0] && characterArgs.length > 0) {
    const lastArg = characterArgs[characterArgs.length - 1] || '';
    if (/^@?\d{5,20}$/.test(lastArg)) characterArgs.pop();
  }

  if (!rawWho && characterArgs.length > 1) {
    const maybeTarget = characterArgs[characterArgs.length - 1];
    if (/^@?\d{5,20}$/.test(maybeTarget)) {
      rawWho = `${maybeTarget.replace('@', '')}@s.whatsapp.net`;
      characterArgs.pop();
    }
  }

  const characterName = characterArgs.join(' ').toLowerCase().trim();
  if (!characterName) {
    await conn.reply(m.chat, 'Debes indicar el nombre del personaje a regalar.', m);
    return;
  }

  if (!rawWho) {
    await conn.reply(m.chat, 'Debes mencionar o responder a un mensaje del usuario al que quieres regalarle el personaje.', m);
    return;
  }

  let who = normalizeToJid(rawWho);
  if (!who || who === userId) {
    await conn.reply(m.chat, 'Debes elegir un usuario válido y distinto de ti para regalar.', m);
    return;
  }

  try {
    const characters = await loadCharacters();
    const character = findCharacterByName(characters, characterName);

    if (!character) {
      await conn.reply(m.chat, `No se encontró el personaje *${characterName}*.`, m);
      return;
    }

    const harem = await loadHarem();
    const claim = harem.find(c => c.groupId === groupId && c.characterId === character.id && isSameUserId(c.userId, userId));
    if (!claim) {
      await conn.reply(m.chat, `El personaje *${character.name}* no está reclamado por ti en este grupo.`, m);
      return;
    }

    if (claim) {
      claim.userId = who;
      resetProtectionOnTransfer(claim, { now: Date.now(), reason: 'gift' });
    } else {
      removeClaim(harem, groupId, userId, character.id);
      addOrUpdateClaim(harem, groupId, who, character.id);
    }
    await saveHarem(harem);

    await conn.reply(m.chat, `✰ *${character.name}* ha sido regalado a @${who.split('@')[0]}!`, m, { mentions: [who] });
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al regalar el personaje: ${error.message}`, m);
  }
};

handler.help = ['regalar <nombre del personaje> @usuario', 'regalar <nombre del personaje> (respondiendo mensaje)'];
handler.tags = ['anime'];
handler.command = ['regalar', 'givewaifu', 'givechar'];
handler.group = true;

export default handler;