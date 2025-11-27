import { promises as fs } from 'fs';

const charactersFile = './src/database/characters.json';
const waifusEnVentaFile = './src/database/waifusVenta.json';

async function loadCharacters() {
const data = await fs.readFile(charactersFile, 'utf-8');
return JSON.parse(data);
}
async function saveCharacters(characters) {
await fs.writeFile(charactersFile, JSON.stringify(characters, null, 2));
}
async function loadVentas() {
try {
const data = await fs.readFile(waifusEnVentaFile, 'utf-8');
return JSON.parse(data);
} catch {
return [];
}
}
async function saveVentas(ventas) {
await fs.writeFile(waifusEnVentaFile, JSON.stringify(ventas, null, 2));
}

let handler = async (m, { args, conn, participants }) => {
let userId = m.sender;
if (userId.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === userId);
if (pInfo && pInfo.id) userId = pInfo.id;
}

const texto = args.join(' ').trim();

let personaje = null;
let precio = null;

if (m.quoted?.text) {
const idMatch = m.quoted.text.match(/𝙄𝘿:\s*\*([^\*]+)\*/i);
if (!idMatch) return m.reply('✧ No se pudo encontrar el ID del personaje citado.');
const id = idMatch[1].trim();
const characters = await loadCharacters();
personaje = characters.find(c => c.id === id);
precio = parseInt(args[0]);
} else {
const precioDetectado = args.find(a => !isNaN(a));
if (!precioDetectado) {
return m.reply('✧ Ingresa un precio válido.\n> Ejemplo: *#vender Miku Nakano 40000*');
}

precio = parseInt(precioDetectado);
if (isNaN(precio) || precio < 1) {
return m.reply('✧ El precio debe ser un número válido mayor que 0.');
}

const nombre = args.filter(a => a !== precioDetectado).join(' ').toLowerCase();
const characters = await loadCharacters();
personaje = characters.find(c => c.name.toLowerCase() === nombre);

if (!personaje) return m.reply(`✧ Personaje *"${nombre}"* no encontrado.`);
}

if (personaje.user !== userId) return m.reply('✧ Esta waifu no te pertenece.');

const ventas = await loadVentas();

const ventaExistente = ventas.find(v => v.id === personaje.id);

const chars = await loadCharacters();
const i = chars.findIndex(x => x.id === personaje.id);

if (i === -1) return m.reply('✧ Error inesperado: personaje no encontrado en la base de datos.');

chars[i].enVenta = true;
chars[i].precioVenta = precio;

if (ventaExistente) {
ventas.forEach(v => {
if (v.id === personaje.id) v.precio = precio;
});

await saveCharacters(chars);
await saveVentas(ventas);

return m.reply(`✿ El personaje *${personaje.name}* ya estaba en venta.\n› Se actualizó su precio a *¥${precio.toLocaleString()} ${m.moneda}*.`);
}

ventas.push({
id: personaje.id,
name: personaje.name,
precio: precio,
vendedor: userId,
fecha: Date.now()
});

await saveCharacters(chars);
await saveVentas(ventas);

m.reply(`✿ Has puesto en venta a *${personaje.name}* por *¥${precio.toLocaleString()} ${m.moneda}*.`);
};

handler.help = ['venderwaifu'];
handler.tags = ['waifus'];
handler.command = ['vender', 'sell'];
handler.group = true;
handler.register = true;

export default handler;