import { promises as fs } from 'fs'
import path from 'path'
import axios from 'axios'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { loadCharacters, findCharacterByName } from '../../lib/gacha-characters.js'

function gifToMp4(buffer) {
return new Promise((resolve, reject) => {
const tempInput = path.join(tmpdir(), `${Date.now()}_in.bin`);
const tempOutput = path.join(tmpdir(), `${Date.now()}_out.mp4`);

fs.writeFile(tempInput, buffer)
.then(() => {
const ffmpeg = spawn('ffmpeg', [
'-y',
'-i', tempInput,
'-c:v', 'libx264',
'-pix_fmt', 'yuv420p',
'-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Asegura dimensiones pares
'-movflags', '+faststart',
tempOutput
]);

ffmpeg.on('close', async (code) => {
await fs.unlink(tempInput).catch(() => {});

if (code === 0) {
try {
const mp4Buffer = await fs.readFile(tempOutput);
await fs.unlink(tempOutput).catch(() => {}); // Limpiamos salida
resolve(mp4Buffer);
} catch (e) {
reject(e);
return false;
}
} else {
reject(new Error(`FFmpeg falló con código ${code}`));
}
});

ffmpeg.on('error', async (err) => {
await fs.unlink(tempInput).catch(() => {});
reject(err);
});
})
.catch(reject);
});
}

function formatUrl(url) {
if (!url) return url
if (url.includes('github.com') && url.includes('/blob/')) {
return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
}
return url.trim()
}

let handler = async (m, { conn, args }) => {
if (args.length === 0) {
await conn.reply(m.chat, `《✧》Por favor, proporciona el nombre de un personaje.`, m)
return
}

const characterName = args.join(' ').toLowerCase().trim()

try {
const characters = await loadCharacters()
const character = findCharacterByName(characters, characterName)

if (!character) {
await conn.reply(m.chat, `《✧》No se ha encontrado el personaje *${characterName}*. Asegúrate de que el nombre esté correcto.`, m)
return
}

if (!character.vid || character.vid.length === 0) {
await conn.reply(m.chat, `《✧》No se encontró un video para *${character.name}*.`, m)
return
}

let randomVideo = character.vid[Math.floor(Math.random() * character.vid.length)]
const cleanUrl = formatUrl(randomVideo)

const message = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`

await m.react('⏳'); // Reacción de espera

try {
const response = await axios({
method: 'get',
url: cleanUrl,
responseType: 'arraybuffer',
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
}
});

let buffer = Buffer.from(response.data);

try {
const videoBuffer = await gifToMp4(buffer);

await conn.sendMessage(m.chat, {
video: videoBuffer,
caption: message,
gifPlayback: true, // Loop automático
mimetype: 'video/mp4'
}, { quoted: m });

await m.react('✅');

} catch (ffmpegError) {
console.error("Falló la conversión FFmpeg:", ffmpegError);
throw new Error("Conversion Failed"); // Forzar salto al catch del handler
return false;
}

} catch (downloadError) {
console.error("Error en el proceso de video:", downloadError);

try {
await conn.sendMessage(m.chat, {
image: { url: cleanUrl },
caption: message + "\n\n*(Se envió como imagen por error técnico en video)*",
mimetype: 'image/gif'
}, { quoted: m });
} catch (e) {
await conn.reply(m.chat, `✘ Error crítico: No se pudo procesar el enlace del personaje.`, m)
return false;
}
return false;
}

} catch (error) {
console.error(error)
await conn.reply(m.chat, `✘ Ocurrió un error al buscar el personaje.`, m)
return false;
}
}

handler.help = ['wvideo <nombre del personaje>']
handler.tags = ['anime']
handler.command = ['charvideo', 'wvideo', 'waifuvideo']
handler.group = true

export default handler
