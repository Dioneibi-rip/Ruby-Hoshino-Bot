let handler = async (m, { conn }) => {
  const texto = `
🔍⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐩𝐚𝐫𝐚 𝐫𝐞𝐚𝐥𝐢𝐳𝐚𝐫 𝐛𝐮́𝐬𝐪𝐮𝐞𝐝𝐚𝐬 𝐞𝐧 𝐝𝐢𝐬𝐭𝐢𝐧𝐭𝐚𝐬 𝐩𝐥𝐚𝐭𝐚𝐟𝐨𝐫𝐦𝐚𝐬 🔎⊹

⌈ ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#tiktoksearch • #tiktoks*  
> ✦ Buscador de videos de TikTok.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ.*#tweetposts*  
> ✦ Buscador de posts de Twitter/X.    
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#ytsearch • #yts*  
> ✦ Realiza búsquedas en YouTube.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#githubsearch*  
> ✦ Buscador de usuarios de GitHub.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#cuevana • #cuevanasearch*  
> ✦ Buscador de películas/series por Cuevana.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#google*  
> ✦ Realiza búsquedas en Google.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#pin • #pinterest*  
> ✦ Buscador de imágenes de Pinterest.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#imagen • #image*  
> ✦ Buscador de imágenes en Google.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#animesearch • #animess*  
> ✦ Buscador de animes en TioAnime.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#animei • #animeinfo*  
> ✦ Buscador de capítulos de #animesearch.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#infoanime*  
> ✦ Buscador de información de anime/manga.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#hentaisearch • #searchhentai*  
> ✦ Buscador de capítulos hentai.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#xnxxsearch • #xnxxs*  
> ✦ Buscador de videos de XNXX.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#xvsearch • #xvideossearch*  
> ✦ Buscador de videos de Xvideos.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#pornhubsearch • #phsearch*  
> ✦ Buscador de videos de Pornhub.  
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#npmjs*  
> ✦ Buscador de paquetes en npmjs.  
᷼︶۪۪۪۪፝֟᷼︶᷼╰──────✧──────╯᷼︶᷼
  `.trim();

  await conn.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/jau272.jpeg' },
    caption: texto,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: '🔍 Comandos de Búsqueda Global',
        body: 'Encuentra videos, imágenes e información',
        thumbnail: icons,
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true,
        mediaUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        sourceUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        newsletterJid: '120363335626706839@newsletter',
        newsletterName: author,
      }
    }
  }, { quoted: m });
};

handler.command = ['menubusquedas', 'busquedamenu'];
export default handler;