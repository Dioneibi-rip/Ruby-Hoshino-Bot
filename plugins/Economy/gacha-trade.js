import {
  loadHarem,
  saveHarem,
  isSameUserId
} from '../../lib/gacha-group.js';
import { resetProtectionOnTransfer } from '../../lib/gacha-protection.js';
import {
  loadCharacters,
  findCharacterByName,
  findCharacterById
} from '../../lib/gacha-characters.js';

const TRADE_TTL_MS = 60 * 1000;
const ACCEPT_WORDS = new Set(['aceptar', 'acepto', 'accept', 'confirmar', 'confirmo']);
const pendingTrades = global.pendingGachaTrades || new Map();
global.pendingGachaTrades = pendingTrades;

global.gachaTradeQueue = global.gachaTradeQueue || Promise.resolve();

function withTradeLock(task) {
  const run = global.gachaTradeQueue.catch(() => {}).then(task);
  global.gachaTradeQueue = run.catch(() => {});
  return run;
}

function normalizeToJid(rawJid, participants = []) {
  if (!rawJid || typeof rawJid !== 'string') return rawJid;
  if (/^@?\d{5,20}$/.test(rawJid)) return `${rawJid.replace('@', '')}@s.whatsapp.net`;
  if (!rawJid.endsWith('@lid')) return rawJid;
  const pInfo = participants.find(p => p?.lid === rawJid);
  return pInfo?.id || rawJid;
}

function mentionTag(jid = '') {
  return `@${String(jid).split('@')[0]}`;
}

function characterValue(character) {
  return character?.value || character?.price || '0';
}

function parseTradeText(text = '') {
  const parts = String(text).split('/').map(part => part.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  return {
    offeredName: parts[0],
    requestedName: parts[1]
  };
}

function usage(usedPrefix = '#') {
  return `《✧》Debes especificar dos personajes para intercambiarlos.

> ✐ Ejemplo: *${usedPrefix}trade Personaje1 / Personaje2*
> ✦ *Personaje1* es el personaje que tú entregas.
> ✦ *Personaje2* es el personaje que quieres recibir.
> ✐ Tip: responde con *Aceptar* a la solicitud para confirmar el intercambio.`;
}

function getTradeByMessage(messageId, chatId) {
  if (!messageId) return null;
  const trade = pendingTrades.get(messageId);
  if (!trade || trade.groupId !== chatId) return null;
  return trade;
}

function isTradeExpired(trade) {
  return !trade || Date.now() > trade.expiresAt;
}

function clearTrade(trade) {
  if (!trade) return;
  pendingTrades.delete(trade.messageId);
  if (trade.timeout) clearTimeout(trade.timeout);
}

async function acceptTrade(m, { conn, participants = [] }) {
  const trade = getTradeByMessage(m.quoted?.id, m.chat);
  if (!trade) return false;

  const accepter = normalizeToJid(m.sender, participants);
  if (!isSameUserId(accepter, trade.targetId)) {
    await conn.reply(m.chat, `《✧》Solo ${mentionTag(trade.targetId)} puede aceptar este intercambio.`, m, { mentions: [trade.targetId] });
    return true;
  }

  if (isTradeExpired(trade)) {
    clearTrade(trade);
    await conn.reply(m.chat, '《✧》La solicitud de intercambio expiró. Vuelve a crear una nueva.', m);
    return true;
  }

  await withTradeLock(async () => {
    const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()]);
    const offered = findCharacterById(characters, trade.offeredCharId) || trade.offeredCharacter;
    const requested = findCharacterById(characters, trade.requestedCharId) || trade.requestedCharacter;

    const offeredClaim = harem.find(entry => entry.groupId === trade.groupId && String(entry.characterId) === String(trade.offeredCharId));
    const requestedClaim = harem.find(entry => entry.groupId === trade.groupId && String(entry.characterId) === String(trade.requestedCharId));

    if (!offeredClaim || !isSameUserId(offeredClaim.userId, trade.requesterId)) {
      clearTrade(trade);
      await conn.reply(m.chat, `《✧》Intercambio cancelado: ${mentionTag(trade.requesterId)} ya no tiene *${offered.name}*.`, m, { mentions: [trade.requesterId] });
      return;
    }

    if (!requestedClaim || !isSameUserId(requestedClaim.userId, trade.targetId)) {
      clearTrade(trade);
      await conn.reply(m.chat, `《✧》Intercambio cancelado: ${mentionTag(trade.targetId)} ya no tiene *${requested.name}*.`, m, { mentions: [trade.targetId] });
      return;
    }

    const now = Date.now();
    offeredClaim.userId = trade.targetId;
    offeredClaim.lastClaimTime = now;
    resetProtectionOnTransfer(offeredClaim, { now, reason: 'trade' });

    requestedClaim.userId = trade.requesterId;
    requestedClaim.lastClaimTime = now;
    resetProtectionOnTransfer(requestedClaim, { now, reason: 'trade' });

    await saveHarem(harem);
    clearTrade(trade);

    const finalText = `「✐」Intercambio aceptado!

✦ ${mentionTag(trade.requesterId)} » *${requested.name}*
✦ ${mentionTag(trade.targetId)} » *${offered.name}*`;

    await conn.reply(m.chat, finalText, m, { mentions: [trade.requesterId, trade.targetId] });
  });

  return true;
}

let handler = async (m, { conn, text, usedPrefix, participants }) => {
  const parsed = parseTradeText(text);
  if (!parsed) return conn.reply(m.chat, usage(usedPrefix), m);

  const requesterId = normalizeToJid(m.sender, participants);
  const groupId = m.chat;

  try {
    const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()]);
    const offeredCharacter = findCharacterByName(characters, parsed.offeredName);
    const requestedCharacter = findCharacterByName(characters, parsed.requestedName);

    if (!offeredCharacter) return conn.reply(m.chat, `《✧》No encontré el personaje que quieres entregar: *${parsed.offeredName}*.`, m);
    if (!requestedCharacter) return conn.reply(m.chat, `《✧》No encontré el personaje que quieres recibir: *${parsed.requestedName}*.`, m);
    if (String(offeredCharacter.id) === String(requestedCharacter.id)) {
      return conn.reply(m.chat, '《✧》No puedes intercambiar el mismo personaje. Elige dos personajes distintos.', m);
    }

    const offeredClaim = harem.find(entry => entry.groupId === groupId && String(entry.characterId) === String(offeredCharacter.id));
    const requestedClaim = harem.find(entry => entry.groupId === groupId && String(entry.characterId) === String(requestedCharacter.id));

    if (!offeredClaim || !isSameUserId(offeredClaim.userId, requesterId)) {
      return conn.reply(m.chat, `《✧》*${offeredCharacter.name}* no está reclamado por ti en este grupo.`, m);
    }

    if (!requestedClaim) {
      return conn.reply(m.chat, `《✧》*${requestedCharacter.name}* no está reclamado por ningún usuario en este grupo.`, m);
    }

    const targetId = normalizeToJid(requestedClaim.userId, participants);
    if (!targetId || isSameUserId(targetId, requesterId)) {
      return conn.reply(m.chat, '《✧》No puedes intercambiar contigo mismo. El segundo personaje debe pertenecer a otro usuario.', m);
    }

    for (const trade of pendingTrades.values()) {
      const sameGroup = trade.groupId === groupId;
      const sameUsers = [trade.requesterId, trade.targetId].some(jid => isSameUserId(jid, requesterId) || isSameUserId(jid, targetId));
      const sameChars = [trade.offeredCharId, trade.requestedCharId].some(id => String(id) === String(offeredCharacter.id) || String(id) === String(requestedCharacter.id));
      if (sameGroup && !isTradeExpired(trade) && (sameUsers || sameChars)) {
        return conn.reply(m.chat, '《✧》Ya existe una solicitud de intercambio activa con esos usuarios o personajes. Espera a que expire o sea aceptada.', m);
      }
    }

    const requestText = `「✐」${mentionTag(targetId)}, ${mentionTag(requesterId)} te ha enviado una solicitud de intercambio.

✦ [${mentionTag(requesterId)}] *${offeredCharacter.name}* (${characterValue(offeredCharacter)})
✦ [${mentionTag(targetId)}] *${requestedCharacter.name}* (${characterValue(requestedCharacter)})

✐ Para aceptar el intercambio responde a este mensaje con *Aceptar*, la solicitud expira en *60 segundos*.`;

    const sent = await conn.reply(m.chat, requestText, m, { mentions: [targetId, requesterId] });
    const messageId = sent?.key?.id;
    if (!messageId) return;

    const trade = {
      messageId,
      groupId,
      requesterId,
      targetId,
      offeredCharId: String(offeredCharacter.id),
      requestedCharId: String(requestedCharacter.id),
      offeredCharacter: { id: String(offeredCharacter.id), name: offeredCharacter.name, value: characterValue(offeredCharacter) },
      requestedCharacter: { id: String(requestedCharacter.id), name: requestedCharacter.name, value: characterValue(requestedCharacter) },
      expiresAt: Date.now() + TRADE_TTL_MS,
      timeout: null
    };

    trade.timeout = setTimeout(() => clearTrade(trade), TRADE_TTL_MS + 1000);
    pendingTrades.set(messageId, trade);
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al crear el intercambio: ${error.message}`, m);
  }
};

handler.before = async function before(m, { conn, participants }) {
  if (!m.quoted?.id || !m.text) return false;
  const normalizedText = String(m.text).trim().toLowerCase();
  if (!ACCEPT_WORDS.has(normalizedText)) return false;
  return acceptTrade(m, { conn, participants });
};

handler.help = ['trade <personaje tuyo> / <personaje de otro usuario>'];
handler.tags = ['anime'];
handler.command = ['trade', 'intercambiar', 'intercambio', 'cambiar'];
handler.group = true;

export default handler;
