let handler = async (m, { conn, text, usedPrefix, command }) => {
conn.menfess = conn.menfess ? conn.menfess : {};
if (!text) throw m.reply(`${emoji} Ejemplo:\n\n${usedPrefix + command} numero mensaje\n\n*${emoji2} Uso:* ${usedPrefix + command} ${m.sender.split`@`[0]} Hola.`);

let split = text.trim().split(/ (.+)/); 
let jid = split[0]; 
let pesan = split[1]; 

if (!jid || !pesan) throw m.reply(`${emoji} Ejemplo:\n\n${usedPrefix + command} numero mensaje\n\n*${emoji2} Uso:* ${usedPrefix + command} ${m.sender.split`@`[0]} Hola.`);

jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'; 
let data = (await conn.onWhatsApp(jid))[0] || {}; 
if (!data.exists) throw m.reply(`${emoji2} No pude encontrar ese número en WhatsApp.`);
if (jid == m.sender) throw m.reply(`${emoji2} No puedes mandarte un mensaje a ti mismo.`);

let mf = Object.values(conn.menfess).find(mf => mf.status === true);
if (mf) return !0;

let id = Math.floor(1000 + Math.random() * 9000); 
let teks = `*Hola* @${data.jid.split("@")[0]}, *recibiste un mensaje de confesión.*\n*Para* responder\n*Ejemplo: .respuesta <id> <Mensaje>*\n\n*\`ID:\`* *${id}*\n*\`MENSAJE:\`* \n\n${pesan}`.trim();

try {

let sentMessage = await conn.sendMessage(data.jid, {
text: teks,
contextInfo: {
mentionedJid: [data.jid]}
});


if (sentMessage) {
conn.menfess[id] = {
id,
dari: m.sender,
penerima: data.jid,
pesan: pesan,
status: false 
};
return conn.reply(m.chat, `${emoji} Respuesta enviada con éxito.\n*IDENTIFICADOR:*` + ` *${id}*`, m);
}

} catch (e) {
console.error(e);
m.reply(`${msm} Ocurrió un error al enviar la respuesta.`);
  return false;
}
}

handler.tags = ['rg'];
handler.help = ['confesar'].map(v => v + ' <número mensaje>');
handler.command = ['confesar', 'confesiones']
handler.register = true;
handler.private = true;

export default handler;
