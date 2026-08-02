import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
🎌⊹ 𝐌𝐄𝐍𝐔 𝐀𝐍𝐈𝐌𝐄 / 𝐑𝐄𝐀𝐂𝐂𝐈𝐎𝐍𝐄𝐒 ⊹💢

𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}angry • ${used}enojado* + <mencion>
> ✦ Estar enojado
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}bite* + <mencion>
> ✦ Muerde a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}bleh* + <mencion>
> ✦ Sacar la lengua
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}blush* + <mencion>
> ✦ Sonrojarte
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}bored • ${used}aburrido* + <mencion>
> ✦ Estar aburrido
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}cry* + <mencion>
> ✦ Llorar por algo o alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}cuddle* + <mencion>
> ✦ Acurrucarse
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}dance* + <mencion>
> ✦ Sacate los pasitos prohibidos
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}drunk* + <mencion>
> ✦ Estar borracho
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}eat • ${used}comer* + <mencion>
> ✦ Comer algo delicioso
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}facepalm* + <mencion>
> ✦ Darte una palmada en la cara
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}happy • ${used}feliz* + <mencion>
> ✦ Salta de felicidad
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}hug* + <mencion>
> ✦ Dar un abrazo
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}preg • ${used}embarazar • ${used}preñar* + <mencion>
> ✦ Embarazar a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}kill* + <mencion>
> ✦ Toma tu arma y mata a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}kiss • ${used}besar* • ${used}kiss2 + <mencion>
> ✦ Dar un beso
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}laugh* + <mencion>
> ✦ Reírte de algo o alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}lick* + <mencion>
> ✦ Lamer a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}love • ${used}amor* + <mencion>
> ✦ Sentirse enamorado
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}pat* + <mencion>
> ✦ Acaricia a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}poke* + <mencion>
> ✦ Picar a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}pout* + <mencion>
> ✦ Hacer pucheros
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}punch* + <mencion>
> ✦ Dar un puñetazo
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}run* + <mencion>
> ✦ Correr
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}sad • ${used}triste* + <mencion>
> ✦ Expresar tristeza
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}scared* + <mencion>
> ✦ Estar asustado
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}seduce* + <mencion>
> ✦ Seducir a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}shy • ${used}timido* + <mencion>
> ✦ Sentir timidez
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}slap* + <mencion>
> ✦ Dar una bofetada
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}dias • ${used}days*
> ✦ Darle los buenos días a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}noches • ${used}nights*
> ✦ Darle las buenas noches a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}sleep* + <mencion>
> ✦ Tumbarte a dormir
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *${used}smoke* + <mencion>
> ✦ Fumar
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ᩚ *${used}think* + <mencion>
> ✦ Pensar en algo
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'anime', 'https://files.catbox.moe/8iug4q.jpeg') },
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

handler.command = ['menuanime', 'reaccionesmenu'];
export default handler;
