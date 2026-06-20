export const JOBS = {
albañil: {
key: 'albañil',
name: 'Albañil',
emoji: '🧱',
description: 'Trabajo físico, obras y construcción. Buen rendimiento en work y crimen oportunista.',
workMultiplier: 1.18,
crimeSuccessBonus: 0.06,
crimeRewardMultiplier: 1.2,
slutMultiplier: 0.92,
slutLossMultiplier: 1.05,
icon: '🧱',
},
basurero: {
key: 'basurero',
name: 'Basurero',
emoji: '🗑️',
description: 'Resistente y callejero. Menor ganancia en slut, mejor aguante en pérdidas.',
workMultiplier: 1.1,
crimeSuccessBonus: 0.03,
crimeRewardMultiplier: 1.05,
slutMultiplier: 0.85,
slutLossMultiplier: 0.9,
icon: '🗑️',
},
chef: {
key: 'chef',
name: 'Chef',
emoji: '👨‍🍳',
description: 'Precisión y carisma. Excelente en work y buen desempeño social.',
workMultiplier: 1.22,
crimeSuccessBonus: 0.02,
crimeRewardMultiplier: 1.0,
slutMultiplier: 1.12,
slutLossMultiplier: 0.95,
icon: '👨‍🍳',
},
programador: {
key: 'programador',
name: 'Programador',
emoji: '💻',
description: 'Hackeo y astucia. Muy fuerte en crimen técnico.',
workMultiplier: 1.12,
crimeSuccessBonus: 0.09,
crimeRewardMultiplier: 1.25,
slutMultiplier: 0.95,
slutLossMultiplier: 1.0,
icon: '💻',
},
repartidor: {
key: 'repartidor',
name: 'Repartidor',
emoji: '🛵',
description: 'Rápido y rendidor. Balanceado para todos los comandos.',
workMultiplier: 1.15,
crimeSuccessBonus: 0.04,
crimeRewardMultiplier: 1.1,
slutMultiplier: 1.0,
slutLossMultiplier: 0.92,
icon: '🛵',
},
comerciante: {
key: 'comerciante',
name: 'Comerciante',
emoji: '🛍️',
description: 'Negociación pura. Muy rentable en work y estable en economía.',
workMultiplier: 1.25,
crimeSuccessBonus: 0.01,
crimeRewardMultiplier: 0.95,
slutMultiplier: 1.08,
slutLossMultiplier: 0.9,
icon: '🛍️',
},
};

export const DEFAULT_JOB = 'Ninguno';
export const DEFAULT_JOB_DATA = {
key: DEFAULT_JOB,
name: DEFAULT_JOB,
emoji: '💤',
description: 'Sin trabajo asignado.',
workMultiplier: 1,
crimeSuccessBonus: 0,
crimeRewardMultiplier: 1,
slutMultiplier: 1,
slutLossMultiplier: 1,
icon: '💤'
};

export function normalizeJobInput(input = '') {
const key = String(input).trim().toLowerCase();
if (!key) return null;
const normalized = key
.normalize('NFD')
.replace(/\p{Diacritic}/gu, '')
.replace(/\s+/g, '');

const aliases = {
albanil: 'albañil',
obrero: 'albañil',
basura: 'basurero',
recolector: 'basurero',
cocinero: 'chef',
code: 'programador',
dev: 'programador',
delivery: 'repartidor',
vendedor: 'comerciante',
};

const alias = aliases[normalized];
if (alias && JOBS[alias]) return alias;

for (const jobKey of Object.keys(JOBS)) {
const flat = jobKey.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '');
if (flat === normalized) return jobKey;
}
return null;
}

export function ensureJobFields(user = {}) {
if (!user || typeof user !== 'object') user = {};
if (typeof user.job === 'undefined') user.job = DEFAULT_JOB;
if (!user.job || !JOBS[user.job]) user.job = DEFAULT_JOB;
if (typeof user.jobSince === 'undefined') user.jobSince = 0;
if (typeof user.jobXp === 'undefined') user.jobXp = 0;
if (!Number.isFinite(Number(user.jobXp))) user.jobXp = 0;
if (!user.extras || typeof user.extras !== 'object' || Array.isArray(user.extras)) user.extras = {};
return user;
}

export function getJobData(user) {
const safeUser = ensureJobFields(user);
return JOBS[safeUser.job] || DEFAULT_JOB_DATA;
}

export function getJobTenureDays(user) {
const safeUser = ensureJobFields(user);
if (!safeUser.jobSince) return 0;
const elapsed = Date.now() - Number(safeUser.jobSince);
return Math.max(0, Math.floor(elapsed / 86400000));
}

export function formatJobLine(user) {
const job = getJobData(user);
const days = getJobTenureDays(user);
return `${job.emoji} ${job.name} (${days} día(s))`;
}

export function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)];
}
