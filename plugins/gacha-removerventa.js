import fs from 'fs';
import { loadVentas, saveVentas, removeVenta } from '../lib/gacha-group.js';

const ventaFilePath = './src/database/waifusVenta.json';

async function loadVentasFile() {
  return await loadVentas();
}

async function saveVentasFile(data) {
  return await saveVentas(data);
}

let handler = async (m, { conn, args, participants }) => {
  let userId = m.sender;
  if (userId.endsWith('@lid') && m.isGroup) {
    const pInfo = participants.find(p => p.lid === userId);
    if (pInfo && pInfo.id) userId = pInfo.id;
  }

  if (!args[0]) {
    return m.reply('✿ Usa: *#removerwaifu <nombre del personaje>*');
  }

  const nombre = args.join(' ').trim().toLowerCase();
  const groupId = m.chat;

  const ventas = await loadVentasFile();
  const venta = ventas.find(v => v.groupId === groupId && v.name.toLowerCase() === nombre);

  if (!venta) {
    return m.reply('✘ Ese personaje no está en venta en este grupo.');
  }

  if (venta.vendedor !== userId) {
    return m.reply('✘ No puedes remover a un personaje que no es tuyo en este grupo.');
  }

  const removed = removeVenta(ventas, groupId, venta.id);
  await saveVentasFile(ventas);

  m.reply(`✿ Has removido a *${venta.name}* de la venta en este grupo. Ya no está disponible para ser comprado.`);
};

handler.help = ['removerwaifu <nombre>'];
handler.tags = ['waifus'];
handler.command = ['removerwaifu', 'removerventa', 'removesale'];
handler.group = true;
handler.register = true;

export default handler;