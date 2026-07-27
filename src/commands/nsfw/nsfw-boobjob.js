import { nsfwWarning } from '../../library/respuesta.js';
import { resolveInteractionTarget } from '../../core/identity-utils.js'

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
if (m.isGroup && !global.db.getChat(m.chat).nsfw) {
return m.reply(nsfwWarning());
}

let who = await resolveInteractionTarget(m, conn);

let name = await conn.getName(who);
let name2 = await conn.getName(m.sender);
m.react('🥵');

let str;
if (m.mentionedJid.length > 0) {
str = `\`${name2}\` *le hizo una rusa a* \`${name || who}\`.`;
} else if (m.quoted) {
str = `\`${name2}\` *le hizo una rusa a* \`${name || who}\`.`;
} else {
str = `\`${name2}\` *está haciendo una rusa.*`.trim();
}

if (m.isGroup) {
let pp = 'https://telegra.ph/file/e4412c087db1b1a7a4022.mp4';
let pp2 = 'https://telegra.ph/file/7e6bd15e33a1d77d6fb15.mp4';
let pp3 = 'https://telegra.ph/file/de3cbbb4611242eb0648c.mp4';
let pp4 = 'https://telegra.ph/file/4ca2676e76364d6861852.mp4';
let pp5 = 'https://telegra.ph/file/1099709e53a16a8a791fd.mp4';
let pp6 = 'https://telegra.ph/file/3baffe20cdfbb03d31e45.mp4';
let pp7 = 'https://telegra.ph/file/7cc41bab371611124693e.mp4';
let pp8 = 'https://telegra.ph/file/adaefc5b25537d948b959.mp4';

const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7];
const video = videos[Math.floor(Math.random() * videos.length)];

let mentions = [who];
conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
}
}

handler.help = ['boobjob/rusa @tag'];
handler.tags = ['nsfw'];
handler.command = ['boobjob','rusa'];
handler.group = true;

export default handler;
