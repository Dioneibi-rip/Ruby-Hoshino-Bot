import {
  loadVentas,
  getVentasInGroup
} from '../lib/gacha-group.js';
import { loadCharacters, findCharacterById, findCharacterByName } from '../lib/gacha-characters.js';

function formatoFecha(fechaMs) {
  try {
    const fecha = new Date(fechaMs);
    return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '-';
  }
}

let handler = async (m, { conn, args }) => {
  let ventas = [], personajes = [];

  try {
    ventas = await loadVentas();
    personajes = await loadCharacters();
    if (!Array.isArray(ventas) || !Array.isArray(personajes)) throw new Error('Error en la estructura de los archivos.');
  } catch (e) {
    return m.reply(`✘ Error al leer los datos.\n*Detalles:* ${e.message}`);
  }

  const groupId = m.chat;
  const ventasGrupo = getVentasInGroup(ventas, groupId);

  if (!ventasGrupo.length) {
    return m.reply('✿ Actualmente no hay waifus en venta en este grupo.');
  }

  let page = parseInt(args[0]) || 1;
  const pageSize = 10;
  const totalPages = Math.ceil(ventasGrupo.length / pageSize);
  if (page < 1 || page > totalPages) {
    return m.reply(`✘ Página inválida. Hay *${totalPages}* página(s) disponibles.`);
  }

  const inicio = (page - 1) * pageSize;
  const waifusPagina = ventasGrupo.slice(inicio, inicio + pageSize);
  let texto = `◢✿ *Waifus en venta en este grupo* ✿◤\n\n`;
  let mencionados = [];

  for (let i = 0; i < waifusPagina.length; i++) {
    try {
      let { name, precio, vendedor, fecha, id } = waifusPagina[i];

      const p = findCharacterById(personajes, id) || findCharacterByName(personajes, name);
      const valorOriginal = p?.value || 'Desconocido';
      const idPersonaje = p?.id || id || 'Desconocido';

      let username;
      try {
        username = await conn.getName(vendedor);
      } catch {
        username = `@${(vendedor || '').split('@')[0] || 'desconocido'}`;
      }

      texto += `✰ ${inicio + i + 1} » *${name}* (*${valorOriginal}*)\n`;
      texto += `  🛒 Precio de venta: *¥${(precio || 0).toLocaleString()} ${m.moneda}*\n`;
      texto += `  🆔 ID: *${idPersonaje}*\n`;
      texto += `  👤 Vendedor: ${username}\n`;
      texto += `  📅 Publicado: ${formatoFecha(fecha)}\n\n`;

      if (vendedor) mencionados.push(vendedor);
    } catch (err) {
      texto += `✘ Error con una waifu: ${err.message}\n\n`;
    }
  }

  texto += `> Página *${page}* de *${totalPages}*\n`;
  if (page < totalPages) {
    texto += `> Usa *#haremshop ${page + 1}* para ver la siguiente página.\n`;
  }

  try {
    await conn.sendMessage(m.chat, {
      text: texto,
      mentions: mencionados
    }, { quoted: m });
  } catch (err) {
    return m.reply(`✘ Error al enviar la lista:\n${err.message}`);
  }
};

handler.help = ['waifusventa [página]'];
handler.tags = ['waifus'];
handler.command = ['haremshop', 'tiendawaifus', 'wshop'];
handler.group = true;

export default handler;