
let handler = async (m, { conn }) => {
const texto = `
🔞⊹ 𝐌𝐄𝐍𝐔 𝐍𝐒𝐅𝐖 ⊹🔥

꒰🔞꒱ *#r34 • #rule34* + [tags]
> ✦ Busca imágenes en Rule34.
꒰🔞꒱ *#hentaimanga • #3hentai • #hentai*
> ✦ Busca/descarga manga hentai.
꒰🔞꒱ *#xnxxsearch • #xnxxs* / *#xnxxdl*
> ✦ Busca o descarga videos de XNXX.
꒰🔞꒱ *#xvsearch • #xvideossearch* / *#xvideosdl*
> ✦ Busca o descarga videos de Xvideos.
꒰🔞꒱ *#pornhubsearch • #phsearch*
> ✦ Busca videos en Pornhub.
꒰🔞꒱ *#anal • #culiar* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *#blowjob • #bj • #mamada* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *#fuck • #coger • #fuck2* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *#spank • #nalgada* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *#yuri • #tijeras* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *#boobjob • #grabboobs • #suckboobs*
> ✦ Reacciones NSFW con mención.
꒰🔞꒱ *#footjob • #69 • #cum • #fap*
> ✦ Reacciones NSFW con mención.

╰──────✧ Solo grupos autorizados ✧──────╯
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%F0%9D%90%82%F0%9D%90%AE%F0%9D%90%AD%F0%9D%90%9E_%F0%9D%90%A1%F0%9D%90%A8%F0%9D%90%AD%20%F0%9D%90%91%F0%9D%90%AE%F0%9D%90%9B%F0%9D%90%B2%20%F0%9D%90%A2%F0%9D%90%9C%F0%9D%90%A8%F0%9D%90%A7%20_%F0%9D%9F%91.jpeg' },
caption: texto,
contextInfo: {
mentionedJid: [m.sender],
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: '120363335626706839@newsletter',
newsletterName: '..⃗. 💌 ⌇ ¡Noticias y más de tu idol favorita! ⊹ ִ ּ',
serverMessageId: -1,
},
},
},
{ quoted: fkontak }
);
};

handler.command = ['menunsfw', 'nsfwmenu'];
export default handler;
