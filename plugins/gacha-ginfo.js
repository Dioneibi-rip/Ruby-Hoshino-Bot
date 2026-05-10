import { promises as fs } from 'fs';

import { isSameUserId } from '../lib/gacha-group.js';

const charactersFilePath = './src/database/characters.json';

const getCooldownMap = key => {
  if (!global.gachaCooldowns || typeof global.gachaCooldowns !== 'object') return {};
  const map = global.gachaCooldowns[key];
  return map && typeof map === 'object' ? map : {};
};

function formatTime(ms) {
  if (!ms || ms <= 0) return 'Ahora.';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} minutos ${seconds} segundos`;
}

function getCooldownStatus(cooldowns, key, now) {
  const expiration = Number(cooldowns?.[key] || 0);
  const remaining = expiration - now;
  return formatTime(remaining);
}

function normalizeUserId(userId) {
  if (!userId) return userId;
  if (userId.endsWith('@lid')) return `${userId.split('@')[0]}@s.whatsapp.net`;
  return userId;
}

let handler = async (m, { conn }) => {
  const userId = normalizeUserId(m.sender);
  const now = Date.now();
  const groupId = m.chat;
  let userName;

  try {
    userName = await conn.getName(userId);
  } catch {
    userName = userId;
  }

  try {
    const baseKey = `${groupId}:${userId}`;
    const rwStatus = getCooldownStatus(getCooldownMap('rollwaifu'), baseKey, now);
    const claimStatus = getCooldownStatus(getCooldownMap('claim'), baseKey, now);
    const voteStatus = getCooldownStatus(getCooldownMap('vote'), baseKey, now);
    const robStatus = getCooldownStatus(getCooldownMap('robwaifu'), baseKey, now);

    let allCharacters = [];
    try {
      const data = await fs.readFile(charactersFilePath, 'utf-8');
      allCharacters = JSON.parse(data);
    } catch (e) {
      console.error('Error leyendo characters.json:', e.message);
      return conn.reply(m.chat, 'Hubo un error al cargar la base de datos de personajes.', m);
    }

    let harem = [];
    try {
      harem = JSON.parse(await fs.readFile('./src/database/harem.json', 'utf-8'));
    } catch {
      harem = [];
    }
    const userCharacters = harem.filter(c => c.groupId === groupId && isSameUserId(c.userId, userId));
    const claimedCount = userCharacters.length;
    const totalCharacters = allCharacters.length;

    const totalValue = userCharacters.reduce((sum, char) => {
      const ch = allCharacters.find(c => c.id === char.characterId);
      return sum + (Number(ch?.value) || 0);
    }, 0);

    let response = `*❀ Usuario \`<${userName}>\`*\n\n`;
    response += `ⴵ RollWaifu » *${rwStatus}*\n`;
    response += `ⴵ Claim » *${claimStatus}*\n`;
    response += `ⴵ Vote » *${voteStatus}*\n`;
    response += `ⴵ RobWaifu » *${robStatus}*\n\n`;
    response += `♡ Personajes reclamados en este grupo » *${claimedCount} / ${totalCharacters}*\n`;
    response += `✰ Valor total (est.) » *${totalValue.toLocaleString('es-ES')}*`;

    await conn.reply(m.chat, response, m);
  } catch (e) {
    console.error('Error en handler ginfo:', e);
    await conn.reply(m.chat, '✘ Ocurrió un error al verificar tu estado.', m);
  }
};

handler.help = ['infogacha', 'ginfo', 'gachainfo', 'estado', 'status', 'cooldowns', 'cd'];
handler.tags = ['info'];
handler.command = ['infogacha', 'ginfo', 'gachainfo'];
handler.group = true;

export default handler;
