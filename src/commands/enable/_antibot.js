export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (!m.isGroup) return;
    if (m.fromMe) return true;

    // Se eliminó la redeclaración duplicada de esta variable
    let chat = global.db.getChat(m.chat) || {}; 
    let delet = m.key.participant;
    let bang = m.key.id; 

    if (chat.antiBot) {
        // Ampliamos la detección para capturar bots viejos (3EB0) y bots modernos (BAE5).
        // Usamos la variable 'bang' que ya contiene el ID correcto.
        let isBot = m.isBaileys || 
                    (bang && bang.startsWith('3EB0') && bang.length === 22) || 
                    (bang && bang.startsWith('BAE5') && bang.length === 16);

        if (isBot) {
            if (isBotAdmin) {
                // Borrar el mensaje del bot intruso
                await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }});
                
                // Expulsar al bot
                try {
                    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
                } catch (error) {
                    console.error('[antibot] Error: no se pudo expulsar al bot', error);
                }
            } else {
                console.log('[antibot] Se detectó un bot, pero el tuyo no es administrador para expulsarlo.');
            }
        }
    }
}