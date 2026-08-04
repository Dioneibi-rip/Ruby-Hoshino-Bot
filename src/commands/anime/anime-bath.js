import WebSocket from 'ws';

// Configuración predeterminada con tus credenciales
const TOKEN = '86503eae33f07560d29337428df5ffd699f4f2f4';
const DEFAULT_CHAT_ID = '654a7f7e-8072-41fb-ad5b-f3782aafe422';
const NEO = 'https://neo.character.ai';
const WS_URL = 'wss://neo.character.ai/ws/';

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

let ctxCache = null;

async function getContext(chatId) {
  if (ctxCache && ctxCache.chatId === chatId) return ctxCache;
  const headers = { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' };
  
  const [meRes, chatRes] = await Promise.all([
    fetch('https://plus.character.ai/chat/user/', { headers }),
    fetch(`${NEO}/chat/${chatId}/`, { headers })
  ]);

  const me = await meRes.json();
  const chat = await chatRes.json();

  const u = me?.user?.user;
  if (!u || !chat?.chat) throw new Error('No se pudieron obtener los datos del usuario o chat.');

  ctxCache = { chatId, userId: String(u.id), userName: u.username, characterId: chat.chat.character_id };
  return ctxCache;
}

function openSocket() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL, {
      headers: { Cookie: `HTTP_AUTHORIZATION="Token ${TOKEN}"` }
    });
    ws.once('open', () => resolve(ws));
    ws.once('error', (e) => reject(new Error(`Error WebSocket: ${e.message}`)));
  });
}

async function chatCharacterAI(message, chatId = DEFAULT_CHAT_ID, timeoutMs = 60000) {
  const ctx = await getContext(chatId);
  const ws = await openSocket();
  const turnId = uuid();

  return new Promise((resolve, reject) => {
    let settled = false;
    const end = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch (_) {}
      fn(value);
    };

    const timer = setTimeout(() => end(reject, new Error(`Tiempo de espera agotado (${timeoutMs}ms)`)), timeoutMs);

    ws.on('error', (e) => end(reject, e));
    ws.on('close', (code) => end(reject, new Error(`WebSocket cerrado (${code})`)));

    ws.on('message', (raw) => {
      const text = raw.toString();
      if (text === '{}') return ws.send('{}'); // Mantener conexión viva

      let data;
      try { data = JSON.parse(text); } catch (_) { return; }

      if (data.command === 'neo_error' || data.error) {
        return end(reject, new Error(data.comment || data.error || 'Error en neo_error'));
      }

      const turn = data.turn;
      if (!turn || turn.author?.is_human) return;

      const candidate = turn.candidates?.[0];
      if (candidate?.is_final) {
        end(resolve, {
          reply: candidate.raw_content,
          character: turn.author?.name || 'Shinobu'
        });
      }
    });

    // Enviar mensaje por WebSocket
    ws.send(JSON.stringify({
      command: 'create_and_generate_turn',
      request_id: uuid(),
      origin_id: 'web-next',
      payload: {
        num_candidates: 1,
        tts_enabled: false,
        selected_language: '',
        character_id: ctx.characterId,
        user_name: ctx.userName,
        turn: {
          turn_key: { turn_id: turnId, chat_id: chatId },
          author: { author_id: ctx.userId, is_human: true, name: ctx.userName },
          candidates: [{ candidate_id: turnId, raw_content: String(message) }],
          primary_candidate_id: turnId
        }
      }
    }));
  });
}

// Handler para tu Bot de WhatsApp
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`*¡Hola! Escribe un mensaje para hablar con Shinobu.*\n\n*Ejemplo:* ${usedPrefix + command} Hola Shinobu, ¿cómo estás?`);

  await m.react('🦋');

  try {
    const res = await chatCharacterAI(text);
    await conn.sendMessage(m.chat, { text: res.reply }, { quoted: m });
  } catch (error) {
    console.error('Error CAI WebSocket:', error);
    await m.reply(`⚠️ Ocurrió un error al hablar con Shinobu:\n\`\`\`${error.message}\`\`\``);
  }
};

handler.help = ['shinobu <texto>'];
handler.tags = ['ia'];
handler.command = ['shinobu', 'cai'];

export default handler;