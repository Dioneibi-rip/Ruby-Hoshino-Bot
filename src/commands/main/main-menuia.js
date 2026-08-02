import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'
let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const botName = profile.botName || 'Ruby Hoshino'
const texto = `
🤖⊹ 𝐌𝐄𝐍𝐔 𝐈𝐀 / 𝐈𝐍𝐓𝐄𝐋𝐈𝐆𝐄𝐍𝐂𝐈𝐀 𝐀𝐑𝐓𝐈𝐅𝐈𝐂𝐈𝐀𝐋 ⊹🧠

𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${used}Ruby • ${used}bot • ${used}ia* + <pregunta>
> ✦ Conversa con ${botName} usando memoria de contexto.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${used}gemini • ${used}gemi* + <pregunta>
> ✦ Pregunta a Gemini y mantiene el hilo de conversación.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${used}copilot* + <pregunta>
> ✦ Consulta a Copilot desde el bot.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'ia', 'https://i.pinimg.com/736x/06/d0/49/06d049413ac75b327e92e84c7b1410bd.jpg') },
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
{ quoted: global.fkontak || m }
);
};

handler.command = ['menuia', 'menu-ia', 'iamenu', 'menuai'];
export default handler;
