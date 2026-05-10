import { JOBS, normalizeJobInput, ensureJobFields, getJobData, getJobTenureDays } from '../lib/rpg-jobs.js';

function getJobsListMessage(usedPrefix) {
  const lines = Object.values(JOBS).map(job =>
    `• ${job.emoji} *${job.name}* (${job.key})\n  ↳ ${job.description}`
  );

  return `💼 *BOLSA DE TRABAJO*\n\n${lines.join('\n\n')}\n\n✦ Usa *${usedPrefix}trabajo elegir <trabajo>* para seleccionar uno.\n✦ Usa *${usedPrefix}trabajar* para ganar ${global.db?.data?.settings?.[global.conn?.user?.jid]?.moneda || 'Coins'}.`;
}

let handler = async (m, { conn, usedPrefix, args }) => {
  const user = global.db.data.users[m.sender];
  ensureJobFields(user);

  const action = (args[0] || '').toLowerCase();

  if (!action || ['lista', 'list', 'jobs', 'empleos'].includes(action)) {
    return conn.reply(m.chat, getJobsListMessage(usedPrefix), m);
  }

  if (['actual', 'status', 'info', 'ver'].includes(action)) {
    const current = getJobData(user);
    if (!current) {
      return conn.reply(m.chat, `💼 No tienes trabajo todavía.\nUsa *${usedPrefix}trabajo lista* y luego *${usedPrefix}trabajo elegir <trabajo>*.`, m);
    }

    const days = getJobTenureDays(user);
    return conn.reply(m.chat, `💼 Tu trabajo actual: ${current.emoji} *${current.name}*\n✦ Antigüedad: *${days} día(s)*\n✦ XP laboral: *${(user.jobXp || 0).toLocaleString()}*`, m);
  }

  if (['elegir', 'set', 'escoger', 'seleccionar'].includes(action)) {
    const desiredInput = args.slice(1).join(' ').trim();
    if (!desiredInput) {
      return conn.reply(m.chat, `✦ Debes indicar un trabajo.\n> Ejemplo: *${usedPrefix}trabajo elegir programador*`, m);
    }

    const selectedJobKey = normalizeJobInput(desiredInput);
    if (!selectedJobKey) {
      return conn.reply(m.chat, `✘ Trabajo inválido.\nUsa *${usedPrefix}trabajo lista* para ver opciones disponibles.`, m);
    }

    const selectedJob = JOBS[selectedJobKey];
    if (user.job === selectedJobKey) {
      return conn.reply(m.chat, `✅ Ya tienes ese trabajo: ${selectedJob.emoji} *${selectedJob.name}*.`, m);
    }

    user.job = selectedJobKey;
    user.jobSince = Date.now();

    return conn.reply(m.chat, `✅ Ahora tu trabajo es ${selectedJob.emoji} *${selectedJob.name}*.\n✦ Ya puedes usar *${usedPrefix}trabajar*, *${usedPrefix}crime* y *${usedPrefix}slut*.`, m);
  }

  return conn.reply(m.chat, `✦ Uso:\n• *${usedPrefix}trabajo lista*\n• *${usedPrefix}trabajo elegir <trabajo>*\n• *${usedPrefix}trabajo info*`, m);
};

handler.help = ['trabajo lista', 'trabajo elegir <trabajo>', 'trabajo info'];
handler.tags = ['economy'];
handler.command = ['trabajo', 'job'];
handler.group = true;
handler.register = true;

export default handler;
