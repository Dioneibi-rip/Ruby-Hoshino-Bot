import moment from 'moment-timezone';
import fs from 'fs';
import { xpRange } from '../../lib/levelling.js';
import path from 'path';

async function pathExists(file){
try{
await fs.promises.access(file)
return true
}catch{
return false
}
}

const cwd = process.cwd();

let handler = async (m, { conn, args }) => {
let userId = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender;

let name = await conn.getName(userId);

let user = global.db.getUser(userId);
let exp = user.exp || 0;
let level = user.level || 0;
let role = user.role || 'Sin Rango';
let coins = user.coin || 0;

let _uptime = process.uptime() * 1000;
let uptime = clockString(_uptime);
let totalreg = Object.keys(global.db.listUsers()).length;
let totalCommands = Object.values(global.plugins).filter(v => v.help && v.tags).length;

const gifVideosDir = path.join(cwd, 'src', 'menu');
if (!await pathExists(gifVideosDir)) {
console.error('El directorio no existe:', gifVideosDir);
return;
}

const gifVideos=(await fs.promises.readdir(gifVideosDir))
.filter(file=>file.endsWith('.mp4'))
.map(file=>path.join(gifVideosDir,file));

const randomGif = gifVideos[Math.floor(Math.random() * gifVideos.length)];

let txt = `
୨୧‿̥̣‿̣̥̣̇ 𝑹𝒖𝒃𝒚 𝑯𝒐𝒔𝒉𝒊𝒏𝒐 𝑩𝒐𝒕 ‿̥̣‿̣̥̣̇୨୧
ᰔ🩵 Hola ${name}, aquí tienes el menú completo actualizado manualmente.

╔═══════⩽✦✰✦⩾═══════╗
「 𝙄𝙉𝙁𝙊 𝘿𝙀 𝙇𝘼 𝘽𝙊𝙏 」
╚═══════⩽✦✰✦⩾═══════╝
║ ☆ 🌐 Comandos cargados: ${totalCommands}
║ ☆ ⏱️ Activa: ${uptime}
║ ☆ 👤 Usuarios: ${totalreg}
║ ☆ 🚀 Tu XP: ${exp} | Nivel: ${level}
║ ☆ 💲 ${m.moneda}: ${coins}
╚═══════════════════════╝

✦ 𝙈𝙀𝙉𝙐𝙎 𝙍𝘼́𝙋𝙄𝘿𝙊𝙎
꒰🪷꒱ *#menubusquedas* > buscadores.
꒰🪷꒱ *#menudescargas* > descargas.
꒰🪷꒱ *#menuherramientas* > stickers/conversores/tools.
꒰🪷꒱ *#menuanime* > reacciones anime.
꒰🪷꒱ *#menugrupo* > administración de grupos.
꒰🪷꒱ *#menujuegos* > juegos y diversión.
꒰🪷꒱ *#menueconomia* > economía y RPG.
꒰🪷꒱ *#menugacha* > colección de waifus.
꒰🪷꒱ *#menuperfil* > perfil y registro.
꒰🪷꒱ *#menunsfw* > comandos adultos.

✦ 𝙄𝙉𝙁𝙊 / 𝘽𝙊𝙏
꒰💌꒱ *#menu • #help* > menú principal.
꒰💌꒱ *#ping • #p* > latencia del bot.
꒰💌꒱ *#runtime • #uptime* > tiempo activo.
꒰💌꒱ *#status • #estado* > estado del bot.
꒰💌꒱ *#script • #sc* > repositorio.
꒰💌꒱ *#owner • #creador* > contacto del owner.
꒰💌꒱ *#info • #infobot* > información completa.
꒰💌꒱ *#reporte • #reportar* > reportar fallos.
꒰💌꒱ *#qr • #code* > crear sub-bot.

✦ 𝘽𝙐́𝙎𝙌𝙐𝙀𝘿𝘼𝙎
꒰🔎꒱ *#tiktoksearch • #tiktoks* > videos TikTok.
꒰🔎꒱ *#ytsearch • #yts* > videos YouTube.
꒰🔎꒱ *#pin • #pinterest* > imágenes Pinterest.
꒰🔎꒱ *#imagen • #image* > imágenes web.
꒰🔎꒱ *#githubsearch* > GitHub.
꒰🔎꒱ *#animeinfo • #animei* > info anime.
꒰🔎꒱ *#animesearch • #animess* > buscar anime.
꒰🔎꒱ *#npmjs* > paquetes NPM.

✦ 𝘿𝙀𝙎𝘾𝘼𝙍𝙂𝘼𝙎
꒰📥꒱ *#play • #play2* > YouTube por búsqueda.
꒰📥꒱ *#ytmp3 • #ytmp4* > YouTube por enlace.
꒰📥꒱ *#tiktok • #tt* > video TikTok.
꒰📥꒱ *#ttimg • #ttmp3* > imagen/audio TikTok.
꒰📥꒱ *#instagram • #ig* > Instagram.
꒰📥꒱ *#facebook • #fb* > Facebook.
꒰📥꒱ *#twitter • #x* > Twitter/X.
꒰📥꒱ *#mediafire • #mf* > MediaFire.
꒰📥꒱ *#mega • #mg* > MEGA.
꒰📥꒱ *#terabox • #tb* > Terabox.
꒰📥꒱ *#gitclone* > repos GitHub.
꒰📥꒱ *#apk • #modapk* > APKs.
꒰📥꒱ *#spotify • #splay* > Spotify.
꒰📥꒱ *#hentaimanga • #3hentai • #hentai* > manga hentai PDF.

✦ 𝙎𝙏𝙄𝘾𝙆𝙀𝙍𝙎 / 𝙏𝙊𝙊𝙇𝙎
꒰🛠️꒱ *#sticker • #s* > crea stickers.
꒰🛠️꒱ *#qc* > sticker Quotly.
꒰🛠️꒱ *#brat* > sticker brat.
꒰🛠️꒱ *#take • #wm* > cambia metadatos.
꒰🛠️꒱ *#toimg • #jpg* > sticker a imagen.
꒰🛠️꒱ *#tomp3 • #toaudio* > video a audio.
꒰🛠️꒱ *#tourl • #upload* > subir archivo.
꒰🛠️꒱ *#hd • #remini* > mejora imagen.
꒰🛠️꒱ *#pfp • #getpic* > foto de perfil mencionada.
꒰🛠️꒱ *#read • #ver* > ver una sola vista.
꒰🛠️꒱ *#shazam* > reconocer música.
꒰🛠️꒱ *#wiki* > Wikipedia.

✦ 𝘼𝙉𝙄𝙈𝙀 𝙍𝙀𝘼𝘾𝘾𝙄𝙊𝙉𝙀𝙎
꒰🎌꒱ *#kiss • #hug • #pat • #slap • #punch*
> ✦ Acciones con mención o respuesta.
꒰🎌꒱ *#run • #sad • #happy • #cry • #think*
> ✦ Estados/animos anime.
꒰🎌꒱ *#bite • #lick • #poke • #cuddle • #dance*
> ✦ Reacciones sociales.
꒰🎌꒱ *#waifu • #ppcp • #fraseanime*
> ✦ Contenido anime extra.

✦ 𝙂𝙍𝙐𝙋𝙊𝙎
꒰👥꒱ *#config • #opciones* > ajustes del grupo.
꒰👥꒱ *#hidetag • #tagall* > menciones masivas.
꒰👥꒱ *#kick • #add* > gestión de miembros.
꒰👥꒱ *#promote • #demote* > admins.
꒰👥꒱ *#link • #revoke* > enlaces.
꒰👥꒱ *#warn • #unwarn • #advlist* > advertencias.
꒰👥꒱ *#mute • #unmute* > silenciar usuarios.
꒰👥꒱ *#gpname • #gpdesc • #gpbanner* > editar grupo.

✦ 𝙅𝙐𝙀𝙂𝙊𝙎 / 𝙁𝙐𝙉
꒰🎮꒱ *#ppt • #ttt • #suitpvp* > juegos PvP.
꒰🎮꒱ *#ahorcado • #sopa • #mates* > retos.
꒰🎮꒱ *#meme • #chiste • #consejo • #frase* > diversión.
꒰🎮꒱ *#ship • #iq • #personalidad • #top* > dinámicas.

✦ 𝙀𝘾𝙊𝙉𝙊𝙈𝙄́𝘼 / 𝙍𝙋𝙂
꒰💰꒱ *#work • #crime • #minar* > ganar recursos.
꒰💰꒱ *#daily • #weekly • #monthly • #cofre* > recompensas.
꒰💰꒱ *#bal • #wallet • #deposit • #withdraw* > banco.
꒰💰꒱ *#pay • #robar • #robxp* > transferir/robar.
꒰💰꒱ *#adventure • #inventario • #heal • #mazmorra* > RPG.

✦ 𝙂𝘼𝘾𝙃𝘼
꒰🎭꒱ *#rw • #rollwaifu* > roll de personaje.
꒰🎭꒱ *#claim • #harem • #winfo • #wimage* > reclamar/ver.
꒰🎭꒱ *#sell • #buychar • #trade • #givewaifu* > mercado.
꒰🎭꒱ *#topwaifus • #favtop • #ginfo* > rankings/info.

✦ 𝙋𝙀𝙍𝙁𝙄𝙇
꒰🆔꒱ *#perfil • #level • #lb* > datos y ranking.
꒰🆔꒱ *#setname • #setage • #setgenre • #setbirth* > editar perfil.
꒰🆔꒱ *#marry • #divorce • #confesar* > social.
꒰🆔꒱ *#premium • #unreg* > premium/registro.

✦ 𝙉𝙎𝙁𝙒
꒰🔞꒱ *#r34 • #xnxxsearch • #xvideosdl • #hentaimanga*
> ✦ Búsqueda/descarga adulta.
꒰🔞꒱ *#anal • #blowjob • #fuck • #spank • #yuri*
> ✦ Reacciones NSFW con mención.

╰──────✧ Menú sincronizado manualmente ✧──────╯
`.trim();

await conn.reply(m.chat, '*ꪹ͜𓂃⌛͡𝗘𝗻𝘃𝗶𝗮𝗻𝗱𝗼 𝗠𝗲𝗻𝘂 𝗱𝗲 𝗹𝗮 𝗕𝗼𝘁....𓏲੭*', m, {
contextInfo: {
forwardingScore: 2022,
isForwarded: true}
});

await m.react('💛');

await conn.sendMessage(m.chat, {
video: { url: randomGif },
caption: txt,
gifPlayback: true,
contextInfo: {
mentionedJid: [m.sender, userId],
isForwarded: true,
forwardingScore: 999,
forwardedNewsletterMessageInfo: {
newsletterJid: '120363335626706839@newsletter',
newsletterName: '..⃗. 💌 ⌇ ¡Noticias y más de tu idol favorita! ⊹ ִ ּ',
serverMessageId: -1}}
}, { quoted: m });

};

handler.help = ['menu'];
handler.register = true;
handler.tags = ['main'];
handler.command = ['menuall', 'allmenu', 'allmenù'];

export default handler;

function clockString(ms) {
let seconds = Math.floor((ms / 1000) % 60);
let minutes = Math.floor((ms / (1000 * 60)) % 60);
let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
return `${hours}h ${minutes}m ${seconds}s`;

}

function normalizeMenuSearch(text = '') {
return text.normalize('NFKD').toLowerCase();
}

function commandAliases(command) {
if (Array.isArray(command)) return command.filter(cmd => typeof cmd === 'string');
if (typeof command === 'string') return [command];
return [];
}
