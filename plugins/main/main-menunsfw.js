
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
