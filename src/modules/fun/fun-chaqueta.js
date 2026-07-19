/**
 * Plugin de Duck.ai actualizado para Ruby Hoshino Bot
 * Adaptado para usar la librería HTTP (axios wrapper) personalizada
 * Bypass de seguridad x-vqd-hash-1 mediante JSDOM
 */
import axios from '../../infra/http.js'
import { Buffer } from 'buffer';
import { JSDOM } from 'jsdom';
import { createHash } from 'crypto';

const MODELS = {
    'nano': 'gpt-5.4-nano',
    'mini': 'gpt-5.4-mini',
    'claude': 'claude-haiku-4.5'
};

// Cabeceras simulando un navegador Edge/Chrome real
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Sec-Ch-Ua': '"Chromium";v="130", "Microsoft Edge";v="130", "Not?A_Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"'
};

// Función para resolver el desafío de JavaScript de DuckDuckGo
async function solveHashChallenge(vqdHash) {
    const jsScript = Buffer.from(vqdHash, 'base64').toString('utf-8');
    const dom = new JSDOM(`<iframe id="jsa" sandbox="allow-scripts allow-same-origin" srcdoc="<!DOCTYPE html><html><head></head><body></body></html>"></iframe>`, { runScripts: "dangerously" });
    
    dom.window.top.__DDG_BE_VERSION__ = 1;
    dom.window.top.__DDG_FE_CHAT_HASH__ = 1;
    
    const jsa = dom.window.top.document.querySelector("#jsa");
    const contentDoc = jsa.contentDocument || jsa.contentWindow.document;
    
    const meta = contentDoc.createElement("meta");
    meta.setAttribute("http-equiv", "Content-Security-Policy");
    meta.setAttribute("content", "default-src 'none'; script-src 'unsafe-inline';");
    contentDoc.head.appendChild(meta);
    
    const result = await dom.window.eval(jsScript);
    result.client_hashes[0] = HEADERS['User-Agent'];
    result.client_hashes = result.client_hashes.map((t) => createHash("sha256").update(t).digest("base64"));
    
    return btoa(JSON.stringify(result));
}

async function getVqdToken() {
    const res = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
        headers: { ...HEADERS, 'x-vqd-accept': '1' }
    });
    
    // Tu axios convierte los headers a objeto usando Object.fromEntries(headers.entries())
    // Los nombres de las cabeceras estarán en minúscula.
    const token = res.headers['x-vqd-4'];
    const hashChallenge = res.headers['x-vqd-hash-1'];
    
    if (!token || !hashChallenge) throw new Error('El servidor bloqueó la petición o no envió el desafío.');
    
    const solvedHash = await solveHashChallenge(hashChallenge);
    return { token, solvedHash };
}

async function duckChat(message, modelAlias = 'nano') {
    const { token, solvedHash } = await getVqdToken();
    const modelId = MODELS[modelAlias] || MODELS['nano'];
    
    const res = await axios.post('https://duckduckgo.com/duckchat/v1/chat', 
        {
            model: modelId,
            messages: [{ role: 'user', content: message }]
        },
        {
            headers: {
                ...HEADERS,
                'x-vqd-4': token,
                'x-vqd-hash-1': solvedHash,
                'Accept': 'text/event-stream'
            },
            // Es vital usar 'text' para que tu axios no intente parsear el SSE como JSON directamente
            responseType: 'text' 
        }
    );

    // Con tu axios, la respuesta bruta queda en la propiedad "data"
    const text = res.data; 
    let fullResponse = '';
    
    for (const line of text.split('\n')) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
                const data = JSON.parse(line.slice(6));
                if (data.message) fullResponse += data.message;
            } catch (e) { continue; }
        }
    }
    
    return fullResponse || '> (っ- ‸ - ς) Sin respuesta del servidor.';
}

async function handler(m, { text, conn, usedPrefix, command, args }) {
    if (!text) return m.reply(`> ヾ(˶ᵔ ᗜ ᵔ˶) 𝖯𝗈𝗋 𝖿⍺𝗏𝗈𝗋 𝗂𝗇𝗀𝗋𝖾𝗌⍺ 𝗎𝗇⍺ 𝗉𝗋𝖾𝗀𝗎𝗇𝗍⍺...`);
    await m.react('⏳');
    try {
        const firstArg = args[0]?.toLowerCase();
        let selectedModel = 'nano';
        let query = text;

        if (MODELS[firstArg]) {
            selectedModel = firstArg;
            query = text.slice(firstArg.length).trim();
        }

        const result = await duckChat(query, selectedModel); 
        await conn.sendMessage(m.chat, { text: result }, { quoted: m });
        await m.react('✅');
    } catch (error) {
        console.error('[Ruby Hoshino Error]:', error);
        await m.react('💔');
        await m.reply(`> (っ- ‸ - ς) Error: \`${error.message}\``);
    }
}

handler.help = ['duck <modelo> <texto>'];
handler.tags = ['ai'];
handler.command = ['duck', 'duckai'];
handler.register = true;
export default handler;