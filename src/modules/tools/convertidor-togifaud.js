let handler = async (m, { conn, usedPrefix, command }) => {
if (!m.quoted) {
await conn.reply(m.chat, `${emoji} Por favor, responde a un *Video.*`, m);
return false;
}
conn.reply(m.chat, global.wait, m)
const q = m.quoted || m
let mime = (q.msg || q).mimetype || ''
if (!/(mp4)/.test(mime)) {
await conn.reply(m.chat, `${emoji} Por favor, responde a un *Video.*`, m);
return false;
}
await m.react(rwait)
let media = await q.download()
let listo = '🍬 Aqui tienes ฅ^•ﻌ•^ฅ.'
conn.sendMessage(m.chat, { video: media, gifPlayback: true, caption: listo }, { quoted: fkontak })
await m.react(done)
}
handler.help = ['togifaud']
handler.tags = ['transformador']
handler.group = true;
handler.register = true
handler.command = ['togifaud']

export default handler
