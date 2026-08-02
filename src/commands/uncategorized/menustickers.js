let handler = async (m, { conn, usedPrefix }) => {
const profile = conn.botProfile || {}
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
🖼️✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐩𝐚𝐫𝐚 𝐜𝐫𝐞𝐚𝐜𝐢𝐨𝐧𝐞𝐬 𝐝𝐞 𝐬𝐭𝐢𝐜𝐤𝐞𝐫𝐬, 𝐞𝐭𝐜. 🎨🔖

🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}sticker • ${used}s*
> ✦ Crea stickers de (imagen/video).
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}setmeta*
> ✦ Establece un pack y autor para los stickers.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}setcmd <texto>*
> ✦ Asigna un comando personal a un sticker.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}delcmd • ${used}cmdrm*
> ✦ Borra tu comando personal de un sticker.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}delmeta*
> ✦ Elimina tu pack de stickers.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}pfp • ${used}getpic*
> ✦ Obtén la foto de perfil de un usuario.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}qc*
> ✦ Crea stickers con texto o de un usuario.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}toimg • ${used}img*
> ✦ Convierte stickers en imagen.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}brat • ${used}ttp • ${used}attp*︎
> ✦ Crea stickers con texto.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}emojimix*
> ✦ Funciona 2 emojis para crear un sticker.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}stickerly • ${used}spack • ${used}stickerpack*
> ✦ Envía un paquete de stickers.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *${used}wm*
> ✦ Cambia el nombre de los stickers.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
`.trim();

await conn.sendMessage(m.chat, {
image: { url: profile.individualMenuImageUrl || 'https://files.catbox.moe/61219t.png' },
caption: texto,
contextInfo: {
mentionedJid: [m.sender]}
}, { quoted: m });
};

handler.command = ['menusticker', 'stickersmenu'];
export default handler;
