import {
loadHarem,
saveHarem,
addOrUpdateClaim
} from '../../lib/gacha-group.js';
import { loadCharacters, findCharacterByName, findCharacterById } from '../../lib/gacha-characters.js';

function extractNamesFromList(text) {
const names = [];
if (!text) return names;
const regexStar = /»\s*\*([^*]+)\*/g;
let m;
while ((m = regexStar.exec(text)) !== null) {
names.push(m[1].trim());
}
if (names.length > 0) return [...new Set(names)];
const lines = text.split(/\r?\n/);
for (const line of lines) {
const r1 = line.match(/^[»\-\>\s]*\*?([^(*\n\r]+)\*?\s*(?:\(|$)/);
if (r1 && r1[1]) {
const nm = r1[1].trim();
if (nm) names.push(nm);
}
}
return [...new Set(names)];
}

let handler = async (m, { conn, args, participants }) => {
try {
let targetJid = m.mentionedJid?.[0];
if (targetJid && targetJid.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === targetJid);
if (pInfo && pInfo.id) targetJid = pInfo.id;
}
if (!targetJid && m.quoted && m.quoted.sender) {
targetJid = m.quoted.sender;
if (targetJid.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === targetJid);
if (pInfo && pInfo.id) targetJid = pInfo.id;
}
}
let senderJid = m.sender;
if (senderJid.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === senderJid);
if (pInfo && pInfo.id) senderJid = pInfo.id;
}
if (!targetJid) targetJid = senderJid;

const groupId = m.chat;

const characters = await loadCharacters();
if (!characters.length) return m.reply('✘ No se encontraron personajes (personajes SQLite vacío o no cargable).');

let namesToGive = [];

if (args && args.length > 0) {
const rest = args.join(' ').trim();
if (rest.includes('\n') || rest.includes('»')) {
const extracted = extractNamesFromList(rest);
namesToGive = extracted;
} else {
namesToGive = [rest];
}
} else {
let sourceText = '';
if (m.quoted && m.quoted.text) sourceText = m.quoted.text;
else if (m.text) sourceText = m.text;
sourceText = sourceText.replace(/^\s*#?addwaifus\b/i, '').trim();
const extracted = extractNamesFromList(sourceText);
if (extracted.length) namesToGive = extracted;
}

if (namesToGive.length === 0) {
return m.reply('✘ No encontré nombres de personajes. Usa: #addwaifus <nombre> o responde a un mensaje con la lista.');
}

const found = [];
const notFound = [];
for (const nm of namesToGive) {
const trimmed = String(nm || '').trim();
const ch = findCharacterById(characters, trimmed) || findCharacterByName(characters, trimmed);
if (ch) {
found.push(ch);
} else {
notFound.push(nm);
}
}

if (found.length === 0) {
return m.reply(`✘ Ningún personaje válido encontrado. No encontrados: ${notFound.join(', ')}`);
}

const harem = await loadHarem();
for (const ch of found) {
addOrUpdateClaim(harem, groupId, targetJid, ch.id);
}
await saveHarem(harem);

const givenList = found.map(c => `» *${c.name}* (*${c.value || 'Desconocido'}*)`).join('\n');
let reply = `✔ Se han asignado ${found.length} personaje(s) a ${targetJid} en este grupo:\n\n${givenList}`;
if (notFound.length) reply += `\n\n✘ No encontrados: ${notFound.join(', ')}`;

try {
await conn.sendMessage(m.chat, { text: reply, mentions: [targetJid] }, { quoted: m });
} catch (e) {
m.reply(reply);
return false;
}
} catch (e) {
console.error(e);
m.reply(`✘ Error al ejecutar #addwaifus: ${e.message}`);
return false;
}
};

handler.help = ['addwaifus <nombre> | reply'];
handler.tags = ['waifus'];
handler.command = ['addwaifus', 'addwaifu', 'givewaifus', 'giveallwaifus'];
handler.group = true; // disponible en privado y grupos
handler.rowner = true;
export default handler;
