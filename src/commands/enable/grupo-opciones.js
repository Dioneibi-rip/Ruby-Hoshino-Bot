const handler = async (m, { conn }) => {
const chat = global.db.getChat(m.chat);
const metadata = await conn.groupMetadata(m.chat).catch(_ => null) || {};
const groupName = metadata.subject || 'este Grupo';

const status = (option) => option ? '✅' : '❌';


const avatar = "https://files.catbox.moe/1k2k6p.jpg";

const text = `╭━━━[ *CONFIGURACIÓN* ]━━━⬣
┃
┃ ✨ Grupo: *${groupName}*
┃
┠───═[ *SEGURIDAD* ]═───⬣
┃
┃ ${status(chat.antiLink)} ◈ Antilink
┃ ${status(chat.antiBot)} ◈ Antibot
┃ ${status(chat.antitoxic)} ◈ Antitoxic
┃
┠───═[ *AUTOMATIZACIÓN* ]═───⬣
┃
┃ ${status(chat.welcome)} ◈ Welcome
┃ ${status(chat.detect)} ◈ detect
┃ ${status(chat.autolevelup)} ◈ autolevelup
┃ ${status(chat.reaction)} ◈ reaction
┃
┠───═[ *GESTIÓN Y CONTENIDO* ]═───⬣
┃
┃ ${status(chat.modoadmin)} ◈ modoadmin
┃ ${status(chat.nsfw)} ◈ nsfw
┃
╰━━━━━━━━━━━━━━━━━━⬣

> *Activa o desactiva una opción con, por ejemplo: #antilink*`.trim();

await conn.sendMessage(m.chat, {
text,
contextInfo: {}
}, { quoted: m });
};

handler.help = ['configuraciongrupo'];
handler.tags = ['grupo'];
handler.command = ['config', 'opciones', 'nable'];
handler.register = true;
handler.group = true;

export default handler;
