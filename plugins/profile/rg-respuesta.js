let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw m.reply(`${emoji} Ejemplo:\n\n${usedPrefix + command} <id> <mensaje>\n\n*${emoji2} Uso:* ${usedPrefix + command} 1234 Gracias por tu confesión.`);
    
    let split = text.trim().split(/ (.+)/); 
    let id = split[0]; 
    let pesan = split[1]; 

    if (!id || !pesan) throw m.reply(`${emoji} Ejemplo:\n\n${usedPrefix + command} <id> <mensaje>\n\n*${emoji2} Uso:* ${usedPrefix + command} 1234 Gracias por tu confesión.`);
    
    id = id.trim();
    pesan = pesan.trim();

    
    console.log("conn.menfess", conn.menfess); 
    
    if (!conn.menfess || !conn.menfess[id]) {
        throw m.reply(`${msm} Error:* No se encontró ningún mensaje con el ID *${id}*.`);
    }
    
    let { dari, penerima } = conn.menfess[id];
    
    if (m.sender !== penerima) throw m.reply(`${emoji} No tienes permiso para responder a este mensaje.`);
    
    let teks = `*Hola, recibiste una respuesta a tu mensaje anónimo.*\n\n*\`ID:\`* *${id}*\n*\`RESPUESTA:\`* \n\n${pesan}`.trim();
    
    try {
        
        let sentMessage = await conn.sendMessage(dari, {
            text: teks,
            contextInfo: {
                mentionedJid: [dari]}
        });
        
        if (sentMessage) {
           return conn.reply(m.chat, `${emoji} Respuesta enviada con éxito.\n*IDENTIFICADOR:*` + ` *${id}*`, m);
            
            
            conn.menfess[id].status = true;
        } else {
            throw new Error('No se pudo enviar el mensaje.');
        }
    } catch (e) {
        console.error(e);
        m.reply(`${msm} Ocurrió un error al enviar la respuesta. Asegúrate de que el número es válido y que el remitente puede recibir mensajes.`);
  return false;
    }
};

handler.tags = ['rg'];
handler.help = ['respuesta'].map(v => v + ' <id mensaje>');
handler.command = ['respuesta', 'responder']
handler.register = true;
handler.private = true;

export default handler;
