let handler = async (m, { text, usedPrefix, command }) => {
const userId = m.sender;
const user = global.db.getUser(userId);

if (command === 'setpackname' || command === 'setauthor') {
if (!text) return m.reply(`${global.emoji} Usa *${usedPrefix + command} <texto>*`)
if (command === 'setpackname') user.text1 = text.trim()
if (command === 'setauthor') user.text2 = text.trim()
await global.db.write()
return m.reply(`✅ Watermark actualizado.\n📦 *Pack:* 「 ${user.text1 || '_Vacío_'} 」\n👤 *Autor:* 「 ${user.text2 || '_Vacío_'} 」`)
}

if (command === 'setmeta') {
if (!text) {
return m.reply(`${global.emoji} *Por favor, escribe el pack y el autor.*\n\n> ✎ *Ejemplo completo:* ${usedPrefix + command} Ruby • Dioneibi\n> ✎ *Solo descripción:* ${usedPrefix + command} MiNombre\n> ✎ *Solo autor:* ${usedPrefix + command} • MiAutor`);
}

let [packInput, authorInput] = text.split(/[\u2022|]/).map(v => v ? v.trim() : '');

if (text.includes('•') || text.includes('|')) {
user.text1 = packInput || '';
user.text2 = authorInput || '';
} else {
user.text1 = text.trim();
user.text2 = '';
}

await global.db.write();

return m.reply(`
╭━━━〔 *CONFIGURADO* 〕━━━⬣
┃ ${global.emoji4} ¡Sugoi! Datos actualizados.
┃
┃ 📦 *Pack:* 「 ${user.text1 || '_Vacío_'} 」
┃ 👤 *Autor:* 「 ${user.text2 || '_Vacío_'} 」
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim());
}

if (command === 'delmeta') {
if (!user.text1 && !user.text2) return m.reply(`${global.emoji3} No tienes un pack establecido.`);
delete user.text1;
delete user.text2;
await global.db.write();
return m.reply(`${global.emoji} Se restableció el pack y autor por defecto.`);
}
};

handler.help = ['setmeta', 'setpackname <texto>', 'setauthor <texto>', 'delmeta'];
handler.tags = ['tools'];
handler.command = ['setmeta', 'setpackname', 'setauthor', 'delmeta'];
handler.register = true;
export default handler;
