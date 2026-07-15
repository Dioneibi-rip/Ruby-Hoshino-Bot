import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
let who = await resolveInteractionTarget(m, conn);

let name = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` });
let name2 = await resolveIdentityName(conn, m.sender, { fallback: `@${String(m.sender).split('@')[0]}` });
m.react('👉');

let str;
if (m.mentionedJid.length > 0) {
str = `\`${name2}\` *picó a* \`${name || who}\`.`;
} else if (m.quoted) {
str = `\`${name2}\` *picó a* \`${name || who}\`.`;
} else {
str = `\`${name2}\` *se picó a sí mismo.*`.trim();
}

if (m.isGroup) {
let pp = 'https://qu.ax/dzdVR.mp4';
let pp2 = 'https://qu.ax/AXLDz.mp4';
let pp3 = 'https://qu.ax/AJEfp.mp4';
let pp4 = 'https://qu.ax/LEYfb.mp4';
let pp5 = 'https://qu.ax/WNGYF.mp4';
let pp6 = 'https://qu.ax/WFWaY.mp4';
let pp7 = 'https://qu.ax/ditle.mp4';
let pp8 = 'https://qu.ax/dzdVR.mp4';

const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7, pp8];
const video = videos[Math.floor(Math.random() * videos.length)];

let mentions = [who];
conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
}
}

handler.help = ['poke/picar @tag'];
handler.tags = ['anime'];
handler.command = ['poke','picar'];
handler.group = true;

export default handler;
