// helpers para gacha por grupo
import { promises as fs } from 'fs';
import path from 'path';

const haremFilePath = './src/database/harem.json';
const ventasFilePath = './src/database/waifusVenta.json';
const writeQueues = new Map();

function isNotFoundError(error) {
  return error?.code === 'ENOENT';
}

async function ensureFileDir(filePath) {
  const dirPath = path.dirname(filePath);
  await fs.mkdir(dirPath, { recursive: true });
}

function queueFileWrite(filePath, data) {
  const previous = writeQueues.get(filePath) || Promise.resolve();

  const next = previous
    .catch(() => {})
    .then(async () => {
      await ensureFileDir(filePath);
      const payload = JSON.stringify(data, null, 2);
      const tmpPath = `${filePath}.tmp`;
      await fs.writeFile(tmpPath, payload, 'utf-8');
      await fs.rename(tmpPath, filePath);
    });

  writeQueues.set(filePath, next);
  return next;
}

async function readArrayFromJson(filePath, label) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
    throw new Error(`El archivo ${label} no contiene un array válido.`);
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    console.error(`[gacha-group] Error al leer ${label}:`, error?.message || error);
    throw error;
  }
}

async function loadHarem() {
  return readArrayFromJson(haremFilePath, 'harem.json');
}

async function saveHarem(harem) {
  await queueFileWrite(haremFilePath, harem);
}

async function loadVentas() {
  return readArrayFromJson(ventasFilePath, 'waifusVenta.json');
}

async function saveVentas(ventas) {
  await queueFileWrite(ventasFilePath, ventas);
}

// Helpers por grupo
function userKey(groupId, userId) {
  return `${groupId}:${userId}`;
}
function charKey(groupId, charId) {
  return `${groupId}:${charId}`;
}


function getUserIdVariants(userId) {
  if (!userId || typeof userId !== 'string') return [];
  const normalized = userId.trim();
  if (!normalized) return [];

  const variants = new Set([normalized]);
  const [local, domain] = normalized.split('@');
  if (local && domain) {
    const baseLocal = local.split(':')[0];
    variants.add(`${baseLocal}@${domain}`);
    if (domain === 's.whatsapp.net') variants.add(`${baseLocal}@lid`);
    if (domain === 'lid') variants.add(`${baseLocal}@s.whatsapp.net`);
  }

  return [...variants];
}

function isSameUserId(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const variants = new Set(getUserIdVariants(a));
  return getUserIdVariants(b).some(v => variants.has(v));
}

function findClaim(harem, groupId, characterId) {
  return harem.find(entry => entry.groupId === groupId && entry.characterId === characterId) || null;
}

function findClaimByUserAndChar(harem, groupId, userId, characterId) {
  return harem.find(entry => entry.groupId === groupId && entry.characterId === characterId && isSameUserId(entry.userId, userId)) || null;
}

function getUserClaims(harem, groupId, userId) {
  return harem.filter(entry => entry.groupId === groupId && isSameUserId(entry.userId, userId));
}

function addOrUpdateClaim(harem, groupId, userId, characterId) {
  const existing = harem.find(e => e.groupId === groupId && e.characterId === characterId);
  const now = Date.now();
  if (existing) {
    existing.userId = userId;
    existing.lastClaimTime = now;
  } else {
    harem.push({
      groupId,
      userId,
      characterId,
      lastClaimTime: now
    });
  }
}

function removeClaim(harem, groupId, userId, characterId) {
  const idx = harem.findIndex(e => e.groupId === groupId && e.characterId === characterId && isSameUserId(e.userId, userId));
  if (idx !== -1) {
    harem.splice(idx, 1);
    return true;
  }
  return false;
}

// Ventas por grupo
function findVenta(ventas, groupId, characterIdOrName) {
  return ventas.find(v => v.groupId === groupId && (v.id === characterIdOrName || v.name.toLowerCase() === String(characterIdOrName).toLowerCase()));
}

function addOrUpdateVenta(ventas, groupId, venta) {
  // venta: { id, name, precio, vendedor, fecha }
  const existing = ventas.find(v => v.groupId === groupId && v.id === venta.id);
  if (existing) {
    Object.assign(existing, venta, { groupId });
  } else {
    ventas.push(Object.assign({}, venta, { groupId }));
  }
}

function removeVenta(ventas, groupId, characterId) {
  const idx = ventas.findIndex(v => v.groupId === groupId && v.id === characterId);
  if (idx !== -1) {
    const removed = ventas.splice(idx, 1)[0];
    return removed;
  }
  return null;
}

function getVentasInGroup(ventas, groupId) {
  return ventas.filter(v => v.groupId === groupId);
}

export {
  loadHarem,
  saveHarem,
  loadVentas,
  saveVentas,
  userKey,
  charKey,
  findClaim,
  findClaimByUserAndChar,
  getUserClaims,
  isSameUserId,
  addOrUpdateClaim,
  removeClaim,
  findVenta,
  addOrUpdateVenta,
  removeVenta,
  getVentasInGroup
};
