let handler = async (m, { conn }) => {
  const texto = `
🆔✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐩𝐞𝐫𝐟𝐢𝐥 𝐩𝐚𝐫𝐚 𝐯𝐞𝐫, 𝐜𝐨𝐧𝐟𝐢𝐠𝐮𝐫𝐚𝐫 𝐲 𝐜𝐨𝐦𝐩𝐫𝐨𝐛𝐚𝐫 𝐞𝐬𝐭𝐚𝐝𝐨𝐬 𝐝𝐞 𝐭𝐮 𝐩𝐞𝐫𝐟𝐢𝐥 📇🔍

░ ⃝🌀ᩧ᳕ᬵ *#reg • #verificar • #register*
> ✦ Registra tu nombre y edad en el bot.
░ ⃝🌀ᩧ᳕ᬵ *#unreg*
> ✦ Elimina tu registro del bot.
░ ⃝🌀ᩧ᳕ᬵ *#profile*
> ✦ Muestra tu perfil de usuario.
░ ⃝🌀ᩧ᳕ᬵ *#marry* [mension / etiquetar]
> ✦ Propón matrimonio a otro usuario.
░ ⃝🌀ᩧ᳕ᬵ *#divorce*
> ✦ Divorciarte de tu pareja.
░ ⃝🌀ᩧ᳕ᬵ *#setgenre • #setgenero*
> ✦ Establece tu género en el perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#delgenre • #delgenero*
> ✦ Elimina tu género del perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#setbirth • #setnacimiento*
> ✦ Establece tu fecha de nacimiento en el perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#delbirth • #delnacimiento*
> ✦ Elimina tu fecha de nacimiento del perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#setdescription • #setdesc*
> ✦ Establece una descripción en tu perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#deldescription • #deldesc*
> ✦ Elimina la descripción de tu perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#lb • #lboard* + <Paginá>
> ✦ Top de usuarios con más (experiencia y nivel).
░ ⃝🌀ᩧ᳕ᬵ *#level • #lvl* + <@Mencion>
> ✦ Ver tu nivel y experiencia actual.
░ ⃝🌀ᩧ᳕ᬵ *#comprarpremium • #premium*
> ✦ Compra un pase premium para usar el bot sin límites.
░ ⃝🌀ᩧ᳕ᬵ *#confesiones • #confesar*
> ✦ Confiesa tus sentimientos a alguien de manera anonima.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
  `.trim();

  await conn.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/a2cyzt.jpeg' },
    caption: texto,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: '🆔 Perfil y Ajustes de Usuario',
        body: 'Configura tu identidad en el bot',
        thumbnail: icons,
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true,
        mediaUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        sourceUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        newsletterJid: '120363335626706839@newsletter',
        newsletterName: '⏤͟͞ू⃪፝͜⁞⟡『 𝙍𝙪𝙗𝙮 𝙃𝙤𝙨𝙝𝙞𝙣𝙤 𝘽𝙤𝙩 』࿐⟡'
      }
    }
  }, { quoted: m });
};

handler.command = ['menuperfil', 'perfilmenu'];
export default handler;