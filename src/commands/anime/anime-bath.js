import axios from '../../library/http.js';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*¡Hola! Escribe un mensaje para hablar con Shinobu.*\n\n*Ejemplo:* ${usedPrefix + command} Hola Shinobu, ¿cómo estás?`);

    await m.react('🦋');

    // Datos extraídos de tu captura de pantalla en Lemur
    const CAI_TOKEN = '86503eae33f07560d29337428df5ffd699f4f2f4';
    const CHAT_ID = '654a7f7e-8072-41fb-ad5b-f3782aafe422';

    try {
        // Endpoint corregido: /chat/turn/create
        const response = await axios.post('https://neo.character.ai/chat/turn/create', {
            chat_id: CHAT_ID,
            turn: {
                author: { author_id: "user" },
                candidates: [{ raw_content: text }]
            }
        }, {
            headers: {
                'Authorization': `Token ${CAI_TOKEN}`,
                'Origin': 'https://character.ai',
                'Referer': 'https://character.ai/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0 Safari/537.36'
            },
            responseType: 'text'
        });

        const rawText = response.data;
        if (typeof rawText !== 'string') throw new Error('Respuesta no válida del servidor.');

        // Character.AI responde en NDJSON (streaming multilínea)
        const lines = rawText.split('\n').filter(line => line.trim() !== '');
        let replyText = '';

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                const candidate = parsed?.turn?.candidates?.[0];
                if (candidate?.raw_content) {
                    replyText = candidate.raw_content;
                }
            } catch {
                // Ignorar fragmentos incompletos
            }
        }

        if (!replyText) {
            return m.reply('❌ Shinobu no envió ninguna respuesta.');
        }

        await conn.sendMessage(m.chat, { text: replyText }, { quoted: m });

    } catch (error) {
        console.error('Error CAI:', error);
        const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        await m.reply(`⚠️ Ocurrió un error al comunicarse con Character.AI:\n\`\`\`${errorDetails}\`\`\``);
    }
};

handler.help = ['shinobu <texto>', 'cai <texto>'];
handler.tags = ['ia'];
handler.command = ['shinobu', 'cai'];

export default handler;