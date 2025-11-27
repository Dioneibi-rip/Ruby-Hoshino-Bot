let handler = async (m, { conn }) => {
  const texto = `
🔞✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐍𝐒𝐅𝐖 (𝐂𝐨𝐧𝐭𝐞𝐧𝐢𝐝𝐨 𝐩𝐚𝐫𝐚 𝐚𝐝𝐮𝐥𝐭𝐨𝐬) 🍑🔥⊹

★꙲⃝͟🔞 *#anal* + <mencion>
> ✦ Hacer un anal
★꙲⃝͟🔞 *#waifu*
> ✦ Buscá una waifu aleatorio.
★꙲⃝͟🔞 *#bath* + <mencion>
> ✦ Bañarse
★꙲⃝͟🔞 *#blowjob • #mamada • #bj* + <mencion>
> ✦ Dar una mamada
★꙲⃝͟🔞 *#boobjob* + <mencion>
> ✦ Hacer una rusa
★꙲⃝͟🔞 *#cum* + <mencion>
> ✦ Venirse en alguien.
★꙲⃝͟🔞 *#fap* + <mencion>
> ✦ Hacerse una paja
★꙲⃝͟🔞 *#ppcouple • #ppcp*
> ✦ Genera imágenes para amistades o parejas.
★꙲⃝͟🔞 *#footjob* + <mencion>
> ✦ Hacer una paja con los pies
★꙲⃝͟🔞 *#fuck • #coger • #fuck2* + <mencion>
> ✦ Follarte a alguien
★꙲⃝͟🔞 *#cafe • #coffe*
> ✦ Tomate un cafecito con alguien
★꙲⃝͟🔞 *#violar • #perra* + <mencion>
> ✦ Viola a alguien
★꙲⃝͟🔞 *#grabboobs* + <mencion>
> ✦ Agarrar tetas
★꙲⃝͟🔞 *#grop* + <mencion>
> ✦ Manosear a alguien
★꙲⃝͟🔞 *#lickpussy* + <mencion>
> ✦ Lamer un coño
★꙲⃝͟🔞 *#rule34 • #r34* + [Tags]
> ✦ Buscar imágenes en Rule34
★꙲⃝͟🔞 *#sixnine • #69* + <mencion>
> ✦ Haz un 69 con alguien
★꙲⃝͟🔞 *#spank • #nalgada* + <mencion>
> ✦ Dar una nalgada
★꙲⃝͟🔞 *#suckboobs* + <mencion>
> ✦ Chupar tetas
★꙲⃝͟🔞 *#undress • #encuerar* + <mencion>
> ✦ Desnudar a alguien
★꙲⃝͟🔞 *#yuri • #tijeras* + <mencion>
> ✦ Hacer tijeras.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
  `.trim();

  await conn.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/xn0jll.jpeg' },
    caption: texto,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: '🔞 Comandos NSFW y Hentai',
        body: 'Zona de contenido para adultos',
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

handler.command = ['menunsfw', 'nsfwmenu'];
export default handler;