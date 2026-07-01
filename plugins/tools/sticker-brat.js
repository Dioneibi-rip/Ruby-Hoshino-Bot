import { sticker } from '../../lib/sticker.js';
import axios from 'axios';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchSticker(text) {
  const url = 'https://kepolu-brat.hf.space/brat';
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.get(url, {
        params: { text },
        responseType: 'arraybuffer',
        timeout: 25000,
        headers: { accept: 'image/png,image/jpeg,image/webp,*/*' },
        validateStatus: status => status >= 200 && status < 300,
      });
      
      const buffer = Buffer.from(response.data);
      if (buffer.length > 1000) return buffer;
      throw new Error('La API devolvió una imagen vacía.');
    } catch (error) {
      lastError = error;
      const retryAfter = Number(error.response?.headers?.['retry-after'] || 0);
      if (error.response?.status === 429 && attempt < 3) {
        await delay((retryAfter || 5) * 1000);
      } else if (attempt < 3) {
        await delay(1000 * attempt);
      }
    }
  }
  throw lastError || new Error('No se pudo contactar la API de brat.');
}

let handler = async (m, { conn, text }) => {
  const input = String(text || '').trim();
  
  if (!input) return m.reply('✧ Por favor ingresa el texto para hacer un sticker.\nEjemplo: *.brat Ruby Hoshino*');
  if (input.length > 250) return m.reply('✧ El texto es demasiado largo. Usa máximo 250 caracteres.');

  try {
    await m.react?.('🕒');
    const buffer = await fetchSticker(input);
    
    const userId = m.sender;
    const packstickers = global.db?.data?.users?.[userId] || {};
    const pack = packstickers.text1 || global.packsticker || 'Ruby Hoshino';
    const author = packstickers.text2 || global.packsticker2 || 'Bot';
    
    const webp = await sticker(buffer, false, pack, author);
    if (!webp) throw new Error('No se pudo convertir la imagen a sticker.');
    
    await conn.sendFile(m.chat, webp, 'brat.webp', '', m);
    await m.react?.('✅');
  } catch (error) {
    console.error('[brat]', error);
    await m.react?.('❌');
    return m.reply(`✧ Ocurrió un error generando el brat: ${error.message}`);
  }
};

handler.command = ['brat'];
handler.tags = ['sticker'];
handler.help = ['brat *<texto>*'];

export default handler;