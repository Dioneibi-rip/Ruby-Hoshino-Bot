import { loadVentas, saveVentas, removeVenta } from '../../library/gacha-group.js';
import { loadCharacters, findCharacterById } from '../../library/gacha-characters.js';
import { normalizeIdentityJid, buildParticipantsByLid } from '../../core/identity-utils.js';

async function loadVentasFile() {
return await loadVentas();
}

async function saveVentasFile(data) {
return await saveVentas(data);
}

let handler = async (m, { conn, args, participants = [] }) => {
let userId = await normalizeIdentityJid(conn, m.sender, buildParticipantsByLid(participants));

if (!args[0]) {
return m.reply('✿ Usa: *#removerwaifu <nombre del personaje>*');
}

const nombre = args.join(' ').trim().toLowerCase();
const groupId = m.chat;

const ventas = await loadVentasFile();
const personajes = await loadCharacters();
const venta = ventas.find(v => {
const p = findCharacterById(personajes, v.id);
return v.groupId === groupId && (String(v.name || p?.name || '').toLowerCase() === nombre || String(v.id).toLowerCase() === nombre);
});

if (!venta) {
return m.reply('✘ Ese personaje no está en venta en este grupo.');
}

if (venta.vendedor !== userId) {
return m.reply('✘ No puedes remover a un personaje que no es tuyo en este grupo.');
}

removeVenta(ventas, groupId, venta.id);

const p = findCharacterById(personajes, venta.id);
m.reply(`✿ Has removido a *${p?.name || venta.name || venta.id}* de la venta en este grupo. Ya no está disponible para ser comprado.`);
};

handler.help = ['removerwaifu <nombre>'];
handler.tags = ['waifus'];
handler.command = ['removerwaifu', 'removerventa', 'removesale'];
handler.group = true;
handler.register = true;

export default handler;
