import { jidNormalizedUser } from '@whiskeysockets/baileys';

const RESET_COMMANDS = ['resetbot', 'resetprimario', 'botreset'];
const resetLocks = global.__primaryBotResetLocks ||= new Map();

function normalizeJid(jid = '') {
  return jidNormalizedUser(jid) || jid;
}

function currentBotJid(conn) {
  return normalizeJid(conn?.user?.jid || conn?.user?.id || '');
}

function mainBotJid() {
  return normalizeJid(global.conn?.user?.jid || global.conn?.user?.id || '');
}

async function resetPrimaryBot(m, conn, { silent = false } = {}) {
  const chat = global.db?.data?.chats?.[m.chat] || {};
  const previousPrimary = normalizeJid(chat.primaryBot || chat.botPrimario || '');

  if (!previousPrimary) {
    if (!silent) return m.reply('《✧》 No hay ningún bot primario establecido en este grupo.');
    return false;
  }

  const lockKey = `${m.chat}:${m.id || m.key?.id || Date.now()}`;
  if (resetLocks.has(lockKey)) return true;
  resetLocks.set(lockKey, Date.now());
  setTimeout(() => resetLocks.delete(lockKey), 30_000).unref?.();

  global.db?.updateChat?.(m.chat, { primaryBot: null, botPrimario: null });
  await global.db?.write?.();

  const botJid = currentBotJid(conn);
  const rootJid = mainBotJid();
  const shouldReply = !silent && (botJid === rootJid || (!rootJid && botJid === previousPrimary));
  if (!shouldReply) return true;

  return m.reply('✐ ¡Listo! Se ha restablecido la configuración.\n> A partir de ahora, todos los bots válidos responderán nuevamente en este grupo.');
}

let handler = async (m, { conn }) => {
  if (!m.isGroup) return;
  const command = m.text?.trim?.().toLowerCase().replace(/^[./#!]/, '').split(/\s+/)[0] || '';
  if (!RESET_COMMANDS.includes(command)) return;
  return resetPrimaryBot(m, conn);
};

// Este es el hook que captura ANTES de cualquier filtro
handler.before = async function (m, { isAdmin, isOwner, isROwner, conn }) {
  if (!m.isGroup) return false;
  const command = m.text?.trim?.().toLowerCase().replace(/^[./#!]/, '').split(/\s+/)[0] || '';
  
  // Si es un comando de resetbot, permitirlo SIEMPRE (incluso si hay bot primario)
  if (!RESET_COMMANDS.includes(command)) return false;
  
  // Solo admins, owners, o root owner pueden usar esto
  if (!isAdmin && !isOwner && !isROwner) {
    return m.reply('⚠️ Solo administradores pueden usar este comando.');
  }
  
  // Ejecutar el reset
  await resetPrimaryBot(m, conn || this, { silent: false });
  
  // Retornar true para evitar que otros handlers procesen esto
  return true;
};

handler.help = ['resetbot', 'resetprimario', 'botreset'];
handler.tags = ['jadibot'];
handler.command = RESET_COMMANDS;
handler.group = true;
handler.admin = true;

export default handler;
