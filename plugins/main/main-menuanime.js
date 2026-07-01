
let handler = async (m, { conn }) => {
const texto = `
🎌✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐫𝐞𝐚𝐜𝐜𝐢𝐨𝐧𝐞𝐬 𝐝𝐞 𝐚𝐧𝐢𝐦𝐞 💢🎭⊹

𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#angry • #enojado* + <mencion>
> ✦ Estar enojado
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#bite* + <mencion>
> ✦ Muerde a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#bleh* + <mencion>
> ✦ Sacar la lengua
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#blush* + <mencion>
> ✦ Sonrojarte
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#bored • #aburrido* + <mencion>
> ✦ Estar aburrido
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#cry* + <mencion>
> ✦ Llorar por algo o alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#cuddle* + <mencion>
> ✦ Acurrucarse
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#dance* + <mencion>
> ✦ Sacate los pasitos prohibidos
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#drunk* + <mencion>
> ✦ Estar borracho
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#eat • #comer* + <mencion>
> ✦ Comer algo delicioso
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#facepalm* + <mencion>
> ✦ Darte una palmada en la cara
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#happy • #feliz* + <mencion>
> ✦ Salta de felicidad
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#hug* + <mencion>
> ✦ Dar un abrazo
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#impregnate • #preg* + <mencion>
> ✦ Embarazar a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#kill* + <mencion>
> ✦ Toma tu arma y mata a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#kiss • #besar* • #kiss2 + <mencion>
> ✦ Dar un beso
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#laugh* + <mencion>
> ✦ Reírte de algo o alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#lick* + <mencion>
> ✦ Lamer a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#love • #amor* + <mencion>
> ✦ Sentirse enamorado
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#pat* + <mencion>
> ✦ Acaricia a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#poke* + <mencion>
> ✦ Picar a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#pout* + <mencion>
> ✦ Hacer pucheros
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#punch* + <mencion>
> ✦ Dar un puñetazo
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#run* + <mencion>
> ✦ Correr
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#sad • #triste* + <mencion>
> ✦ Expresar tristeza
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#scared* + <mencion>
> ✦ Estar asustado
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#seduce* + <mencion>
> ✦ Seducir a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#shy • #timido* + <mencion>
> ✦ Sentir timidez
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#slap* + <mencion>
> ✦ Dar una bofetada
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#dias • #days*
> ✦ Darle los buenos días a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#noches • #nights*
> ✦ Darle las buenas noches a alguien
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#sleep* + <mencion>
> ✦ Tumbarte a dormir
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ *#smoke* + <mencion>
> ✦ Fumar
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭⛸️ᩚ *#think* + <mencion>
> ✦ Pensar en algo
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://files.catbox.moe/8iug4q.jpeg' },
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
