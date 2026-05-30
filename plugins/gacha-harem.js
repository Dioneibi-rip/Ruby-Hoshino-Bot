import { getUserClaims, loadHarem } from '../lib/gacha-group.js';
import { loadCharacters, findCharacterById } from '../lib/gacha-characters.js';

function formatProtectionStatus(character) {
  if (!character.protection || !character.protection.protected) {
    return '';
  }

  if (Date.now() > character.protection.expiresAt) {
    character.protection.protected = false;
    return '';
  }

  const remaining = character.protection.expiresAt - Date.now();
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return ` 🔒 ${days}d ${hours}h`;
  if (hours > 0) return ` 🔒 ${hours}h ${minutes}m`;
  return ` 🔒 ${Math.max(1, minutes)}m`;
}

function normalizeToJid(rawJid, participants = []) {
  if (!rawJid || typeof rawJid !== 'string') return rawJid;
  if (!rawJid.endsWith('@lid')) return rawJid;
  const pInfo = participants.find(p => p?.lid === rawJid);
  return pInfo?.id || rawJid;
}

function getNumberTarget(args = []) {
  const joined = args.join(' ').trim();
  if (!joined) return null;

  const looksLikePhone = /^@?\+?[\d\s().-]{5,32}$/.test(joined) && (joined.includes('+') || joined.includes(' ') || /^@?\d{5,20}$/.test(joined));
  if (!looksLikePhone) return null;

  const digits = joined.replace(/\D/g, '');
  if (digits.length < 5 || digits.length > 20) return null;
  return `${digits}@s.whatsapp.net`;
}

let handler = async (m, { conn, args, participants = [] }) => {
  try {
    const characters = await loadCharacters();
    const harem = await loadHarem();
    let rawUserId;

    const numberTarget = getNumberTarget(args);
    if (m.quoted && m.quoted.sender) {
      rawUserId = m.quoted.sender;
    } else if (m.mentionedJid && m.mentionedJid[0]) {
      rawUserId = m.mentionedJid[0];
    } else {
      rawUserId = numberTarget || m.sender;
    }

    let userId = normalizeToJid(rawUserId, participants);

    const groupId = m.chat;

    const userClaims = getUserClaims(harem, groupId, userId);

    if (userClaims.length === 0) {
      const emptyText = userId === m.sender ? '❀ No tienes personajes reclamados en este grupo.' : `❀ @${userId.split('@')[0]} no tiene personajes reclamados en este grupo.`;
      await conn.reply(m.chat, emptyText, m, { mentions: [userId] });
      return;
    }

    let pageArg = numberTarget ? null : args.find(arg => /^\d+$/.test(arg));
    const page = parseInt(pageArg) || 1;
    const charactersPerPage = 50;
    const totalCharacters = userClaims.length;
    const totalPages = Math.ceil(totalCharacters / charactersPerPage);
    const startIndex = (page - 1) * charactersPerPage;
    const endIndex = Math.min(startIndex + charactersPerPage, totalCharacters);

    if (page < 1 || page > totalPages) {
      await conn.reply(m.chat, `❀ Página no válida. Hay un total de *${totalPages}* páginas.`, m);
      return;
    }

    let message = `✿ Personajes reclamados en este grupo ✿\n`;
    message += `⌦ Usuario: @${userId.split('@')[0]}\n`;
    message += `♡ Personajes: *(${totalCharacters}):*\n\n`;

    for (let i = startIndex; i < endIndex; i++) {
      const charId = userClaims[i].characterId;
      const character = findCharacterById(characters, charId);
      const name = character ? character.name : `ID:${charId}`;
      const value = character ? (character.value || '0') : '0';
      
      // Agregar estado de protección
      const protectionStatus = formatProtectionStatus(userClaims[i]);
      
      message += `» *${name}* (*${value}*)${protectionStatus}\n`;
    }

    message += `\n> ⌦ _Página *${page}* de *${totalPages}*_`;

    await conn.reply(m.chat, message, m, { mentions: [userId] });
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al cargar el harem: ${error.message}`, m);
  }
};

handler.help = ['harem [@usuario] [pagina]'];
handler.tags = ['anime'];
handler.command = ['harem', 'claims', 'waifus'];
handler.group = true;

export default handler;