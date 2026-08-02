import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
🔞⊹ 𝐌𝐄𝐍𝐔 𝐍𝐒𝐅𝐖 ⊹🔥

꒰🔞꒱ *${used}r34 • ${used}rule34* + [tags]
> ✦ Busca imágenes en Rule34.
꒰🔞꒱ *${used}hentaimanga • ${used}3hentai • ${used}hentai*
> ✦ Busca/descarga manga hentai.
꒰🔞꒱ *${used}xnxxsearch • ${used}xnxxs* / *${used}xnxxdl*
> ✦ Busca o descarga videos de XNXX.
꒰🔞꒱ *${used}xvsearch • ${used}xvideossearch* / *${used}xvideosdl*
> ✦ Busca o descarga videos de Xvideos.
꒰🔞꒱ *${used}pornhubsearch • ${used}phsearch*
> ✦ Busca videos en Pornhub.
꒰🔞꒱ *${used}anal • ${used}culiar* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *${used}blowjob • ${used}bj • ${used}mamada* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *${used}fuck • ${used}coger • ${used}fuck2* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *${used}spank • ${used}nalgada* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *${used}yuri • ${used}tijeras* + <mención>
> ✦ Reacción NSFW con usuario.
꒰🔞꒱ *${used}boobjob • ${used}grabboobs • ${used}suckboobs*
> ✦ Reacciones NSFW con mención.
꒰🔞꒱ *${used}footjob • ${used}69 • ${used}cum • ${used}fap*
> ✦ Reacciones NSFW con mención.

╰──────✧ Solo grupos autorizados ✧──────╯
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'nsfw', 'https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%F0%9D%90%82%F0%9D%90%AE%F0%9D%90%AD%F0%9D%90%9E_%F0%9D%90%A1%F0%9D%90%A8%F0%9D%90%AD%20%F0%9D%90%91%F0%9D%90%AE%F0%9D%90%9B%F0%9D%90%B2%20%F0%9D%90%A2%F0%9D%90%9C%F0%9D%90%A8%F0%9D%90%A7%20_%F0%9D%9F%91.jpeg') },
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
