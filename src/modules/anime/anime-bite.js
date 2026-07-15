import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
let who = await resolveInteractionTarget(m, conn);

let name = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` });
let name2 = await resolveIdentityName(conn, m.sender, { fallback: `@${String(m.sender).split('@')[0]}` });
m.react('😅');

let str;
if (m.mentionedJid.length > 0) {
str = `\`${name2}\` *mordió a* \`${name || who}\`.`;
} else if (m.quoted) {
str = `\`${name2}\` *mordió a* \`${name || who}\`.`;
} else {
str = `\`${name2}\` *se mordió a sí mismo*`.trim();
}

if (m.isGroup) {
let pp = 'https://media.tenor.com/48DDFOcNQBYAAAAM/anime-bite.gif';
let pp2 = 'https://files.catbox.moe/c23bw3.mp4';
let pp3 = 'https://files.catbox.moe/nxr7vx.mp4';
let pp4 = 'https://files.catbox.moe/j5yobc.mp4';
let pp5 = 'https://files.catbox.moe/o31g5x.mp4';
let pp6 = 'https://files.catbox.moe/c43d18.mp4';

const videos = [pp, pp2, pp3, pp4, pp5, pp6];
const video = videos[Math.floor(Math.random() * videos.length)];

let mentions = [who];
conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
}
}

handler.help = ['bite/morder @tag'];
handler.tags = ['anime'];
handler.command = ['bite','morder'];
handler.group = true;

export default handler;
