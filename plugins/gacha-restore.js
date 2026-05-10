// Plugin para asignar / restaurar waifus en bloque desde una lista o por nombre.
// Uso:
//  - #addwaifus <nombre del personaje>
//  - #addwaifus <nombre> @usuario
//  - Responder a un mensaje que contiene la lista mostrada y ejecutar #addwaifus (entregará todos los personajes listados)
// No requiere permisos de administrador ni owner.
import {
  loadHarem,
  saveHarem,
  addOrUpdateClaim
} from '../lib/gacha-group.js';
import { loadCharacters, findCharacterByName, findCharacterById } from '../lib/gacha-characters.js';

function extractNamesFromList(text) {
  const names = [];
  if (!text) return names;
  // patrón normal: » *Nombre* (*12345*)
  const regexStar = /»\s*\*([^*]+)\*/g;
  let m;
  while ((m = regexStar.exec(text)) !== null) {
    names.push(m[1].trim());
  }
  if (names.length > 0) return [...new Set(names)];
  // fallback: líneas que contienen » o empiezan con guion o listas simples
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    // example: » *Name* (*12345*)  or » Name (12345)
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
    // resolver usuario objetivo: m.mentionedJid[0] o citado o autor
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
    // si aún no hay target, usar autor (resolver lid si aplica)
    let senderJid = m.sender;
    if (senderJid.endsWith('@lid') && m.isGroup) {
      const pInfo = participants.find(p => p.lid === senderJid);
      if (pInfo && pInfo.id) senderJid = pInfo.id;
    }
    if (!targetJid) targetJid = senderJid;

    const groupId = m.chat;

    const characters = await loadCharacters();
    if (!characters.length) return m.reply('✘ No se encontraron personajes (characters.json vacío o no cargable).');

    // Determinar nombres a asignar
    let namesToGive = [];

    if (args && args.length > 0) {
      // Si hay argumentos, puede ser un nombre compuesto o varios. Tomamos todo como una búsqueda por nombre.
      const rest = args.join(' ').trim();
      // Si el mensaje contiene muchas líneas (pegaste la lista junto a #addwaifus) intentamos extraer
      if (rest.includes('\n') || rest.includes('»')) {
        const extracted = extractNamesFromList(rest);
        namesToGive = extracted;
      } else {
        // tratar como nombre simple: puede coincidir con varios tokens
        namesToGive = [rest];
      }
    } else {
      // no args -> intentar extraer de mensaje citado o del propio mensaje si el cuerpo contiene lista
      let sourceText = '';
      if (m.quoted && m.quoted.text) sourceText = m.quoted.text;
      else if (m.text) sourceText = m.text;
      // quitar el comando inicial si está en el mismo mensaje
      sourceText = sourceText.replace(/^\s*#?addwaifus\b/i, '').trim();
      const extracted = extractNamesFromList(sourceText);
      if (extracted.length) namesToGive = extracted;
    }

    if (namesToGive.length === 0) {
      return m.reply('✘ No encontré nombres de personajes. Usa: #addwaifus <nombre> o responde a un mensaje con la lista.');
    }

    // mapear nombres a personajes (ID exacto o búsqueda robusta por nombre)
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

    // cargar harem, aplicar cambios (uno por uno usando addOrUpdateClaim)
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
    } catch {
      m.reply(reply);
    }
  } catch (e) {
    console.error(e);
    m.reply(`✘ Error al ejecutar #addwaifus: ${e.message}`);
  }
};

handler.help = ['addwaifus <nombre> | reply'];
handler.tags = ['waifus'];
handler.command = ['addwaifus', 'addwaifu', 'givewaifus', 'giveallwaifus'];
handler.group = true; // disponible en privado y grupos
handler.rowner = true;
export default handler;
