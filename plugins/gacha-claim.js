import { promises as fs } from 'fs';
import {
  loadHarem,
  saveHarem,
  addOrUpdateClaim,
  findClaim
} from '../lib/gacha-group.js';
import {
  loadCharacters,
  findCharacterById,
  extractCharacterIdFromText
} from '../lib/gacha-characters.js';
import { canUserClaimCharacter } from '../lib/gacha-restrictions.js';

export const cooldowns = {}; // clave: `${groupId}:${userId}`

global.gachaCooldowns = global.gachaCooldowns || {};
global.gachaCooldowns.claim = cooldowns;

async function loadClaimMessages() {
  try {
    const data = await fs.readFile('./src/database/userClaimConfig.json', 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function getCustomClaimMessage(userId, username, characterName) {
  const messages = await loadClaimMessages();
  const template = messages[userId] || '✧ *$user* ha reclamado a *$character* ✦';
  return template.replace(/\$user/g, username).replace(/\$character/g, characterName);
}

let handler = async (m, { conn }) => {
  const userId = m.sender;
  const groupId = m.chat;
  const now = Date.now();

  const cooldownKey = `${groupId}:${userId}`;
  if (cooldowns[cooldownKey] && now < cooldowns[cooldownKey]) {
    const remaining = cooldowns[cooldownKey] - now;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return conn.reply(m.chat, `⏳ Debes esperar *${minutes}m ${seconds}s* antes de reclamar otra waifu en este grupo.`, m);
  }

  if (!m.quoted || !m.quoted.text) {
    return conn.reply(m.chat, '⚠️ Debes citar un personaje válido (usa #rw para ver el roll y luego cita ese mensaje con #claim).', m);
  }

  try {
    const characters = await loadCharacters();
    const id = extractCharacterIdFromText(m.quoted.text);
    if (!id) return conn.reply(m.chat, '⚠️ No se detectó el ID del personaje en el mensaje citado.', m);

    const character = findCharacterById(characters, id);

    if (!character) return conn.reply(m.chat, '🚫 Personaje no encontrado.', m);

    const rollData = global.activeRolls ? global.activeRolls[`${groupId}:${id}`] : null;

    let timeElapsedStr = "";

    if (rollData) {
      const timeElapsed = now - rollData.time;
      const protectionTime = 30000; // 30s protección
      const expirationTime = 60000; // 60s para reclamar
      if (timeElapsed > expirationTime) {
        delete global.activeRolls[`${groupId}:${id}`];
        return conn.reply(m.chat, "🍂 Ese personaje ya expiró y nadie puede reclamarlo ahora (vuelve a usar #rw).", m);
      }
      if (timeElapsed < protectionTime && rollData.user !== userId) {
        const protectedBy = await conn.getName(rollData.user);
        const remainingProtection = Math.ceil((protectionTime - timeElapsed) / 1000);
        return conn.reply(m.chat, `🛡️ El personaje *${character.name}* está siendo protegido por *${protectedBy}* durante *${remainingProtection} segundos*.`, m);
      }
      timeElapsedStr = ` (${(timeElapsed / 1000).toFixed(1)}s)`;
    } else {
      // si no hay rollData y personaje no está reclamado en este grupo -> no se puede reclamar
      // Si está reclamado en este grupo por otro -> mostrar aviso.
      const harem = await loadHarem();
      const claim = findClaim(harem, groupId, id);
      if (!claim) {
        return conn.reply(m.chat, "🍂 Ese personaje no está disponible para reclamar en este grupo (usa #rw para tirar uno).", m);
      }
    }

    const exclusiveRule = canUserClaimCharacter(character.id, userId);
    if (!exclusiveRule.allowed) {
      const exclusiveName = await conn.getName(exclusiveRule.ownerJid).catch(() => `@${exclusiveRule.ownerJid.split('@')[0]}`);
      return conn.reply(m.chat, `🔒 El personaje *${character.name}* (ID ${character.id}) es exclusivo y solo puede ser reclamado por *${exclusiveName}*.`, m);
    }

    // comprobar si ya está reclamado en este grupo por otra persona
    const haremBefore = await loadHarem();
    const existingClaim = findClaim(haremBefore, groupId, id);
    if (existingClaim && existingClaim.userId !== userId) {
      return conn.reply(m.chat, `❌ El personaje *${character.name}* ya fue reclamado por ${existingClaim.userId.split('@')[0]}.`, m);
    }

    // Registrar claim en harem.json (por grupo)
    addOrUpdateClaim(haremBefore, groupId, userId, id);
    await saveHarem(haremBefore);

    // remover activeRoll si existe
    if (global.activeRolls && global.activeRolls[`${groupId}:${id}`]) {
      delete global.activeRolls[`${groupId}:${id}`];
    }

    const username = await conn.getName(userId);
    const baseMessage = await getCustomClaimMessage(userId, username, character.name);
    const mensajeFinal = `${baseMessage}${timeElapsedStr}`;

    await conn.reply(m.chat, mensajeFinal, m);

    // cooldown por grupo
    cooldowns[cooldownKey] = now + 30 * 60 * 1000; // 30 min

  } catch (e) {
    conn.reply(m.chat, `✘ Error al reclamar waifu:\n${e.message}`, m);
  }
};

handler.help = ['claim'];
handler.tags = ['waifus'];
handler.command = ['claim', 'reclamar', 'c'];
handler.group = true;
export default handler;