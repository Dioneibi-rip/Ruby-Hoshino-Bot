/**
 * Plugin de Duck.ai actualizado para Ruby Hoshino Bot
 * Soporte para la nueva generación de modelos (GPT-5.4, Claude 4.5, etc.)
 */

// Modelos actualizados según la nueva interfaz de Duck.ai
const MODELS = {
    'nano': 'gpt-5.4-nano',       // Ideal para el uso diario
    'mini': 'gpt-5.4-mini',       // Sólido, pero usa los límites más rápido
    'claude': 'claude-haiku-4.5', // Sólido, pero usa los límites más rápido
    'mistral': 'mistral-small-4', // Mistral Small 4
    'oss': 'gpt-oss-120b',        // gpt-oss 120B
    'gemma': 'gemma-4-31b'        // Gemma 4 31B (BETA)
};

async function getVqdToken() {
    const res = await fetch('https://duckduckgo.com/duckchat/v1/status', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
            'x-vqd-accept': '1'
        }
    });
    
    const token = res.headers.get('x-vqd-4');
    if (!token) throw new Error('No se pudo obtener el token x-vqd-4.');
    
    return token;
}

// Añadimos el parámetro mode para soportar "Rápido" o "Razonamiento"
async function duckChat(message, modelAlias = 'nano', isReasoning = false) {
    const token = await getVqdToken();
    const modelId = MODELS[modelAlias] || MODELS['nano'];
    
    const payload = {
        model: modelId,
        messages: [{ role: 'user', content: message }],
        // Inyectamos el modo de razonamiento si la API lo requiere en el body
        ...(isReasoning && { mode: 'reasoning' }) 
    };
    
    const res = await fetch('https://duckduckgo.com/duckchat/v1/chat', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
            'Content-Type': 'application/json',
            'x-vqd-4': token,
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Error de servidor (HTTP ${res.status}). Revisa los IDs de los modelos.`);

    const text = await res.text();
    const lines = text.split('\n');
    let fullResponse = '';
    
    for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
                const data = JSON.parse(line.slice(6));
                if (data.message) fullResponse += data.message;
            } catch (e) {
                continue; 
            }
        }
    }
    
    return fullResponse || '> (っ- ‸ - ς) Sin respuesta del servidor.';
}

async function handler(m, { text, conn, usedPrefix, command, args }) {
    if (!text) return m.reply(`> ヾ(˶ᵔ ᗜ ᵔ˶) 𝖯𝗈𝗋 𝖿⍺𝗏𝗈𝗋 𝗂𝗇𝗀𝗋𝖾𝗌⍺ 𝗎𝗇⍺ 𝗉𝗋𝖾𝗀𝗎𝗇𝗍⍺...\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} nano ¿Cómo estás?*`);
    
    await m.react('⏳');
    
    try {
        // Permitir elegir el modelo por comando (ej: .duck claude Hola)
        const firstArg = args[0]?.toLowerCase();
        let selectedModel = 'nano'; // Por defecto usamos el GPT-5.4 nano
        let query = text;

        if (MODELS[firstArg]) {
            selectedModel = firstArg;
            query = text.slice(firstArg.length).trim(); // Quitamos el nombre del modelo de la pregunta
        }

        if (!query) throw new Error('Escribe tu pregunta después del modelo.');

        const result = await duckChat(query, selectedModel); 
        
        await conn.sendMessage(m.chat, { text: result }, { quoted: m });
        await m.react('✅');
        
    } catch (error) {
        console.error('[Ruby Hoshino - Duck AI Error]:', error);
        await m.react('💔');
        await m.reply(`> (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖼𝗈𝗇 Duck.ai... ✨\n\n> 💡 *𝖣𝖾𝗍⍺𝗅𝗅𝖾:* \`${error.message}\``);
    }
}

handler.help = ['duck <modelo> <texto>'];
handler.tags = ['ai'];
handler.command = ['duck', 'duckai'];
handler.limit = true;
handler.register = true;
handler.group = true;

export default handler;