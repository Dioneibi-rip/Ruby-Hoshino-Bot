import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
let who = await resolveInteractionTarget(m, conn);

let name = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` });
let name2 = await resolveIdentityName(conn, m.sender, { fallback: `@${String(m.sender).split('@')[0]}` });
m.react('😡');

let str;
if (m.mentionedJid.length > 0) {
str = `\`${name2}\` *está enojado/a con* \`${name || who}\`.`;
} else if (m.quoted) {
str = `\`${name2}\` *está enojado/a con* \`${name || who}\`.`;
} else {
str = `\`${name2}\` *está enojado/a.*`.trim();
}

if (m.isGroup) {
let pp = 'https://files.catbox.moe/2aedd3.mp4';
let pp2 = 'https://files.catbox.moe/fqf4ey.mp4';
let pp3 = 'https://files.catbox.moe/v7ldgq.mp4';
let pp4 = 'https://files.catbox.moe/uedd7l.mp4';
let pp5 = 'https://files.catbox.moe/5stubg.mp4';
let pp6 = 'https://files.catbox.moe/phaft3.mp4';

const videos = [pp, pp2, pp3, pp4, pp5, pp6];
const video = videos[Math.floor(Math.random() * videos.length)];

let mentions = [who];
conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
}
}

handler.help = ['angry/enojado @tag'];
handler.tags = ['anime'];
handler.command = ['angry','enojado'];
handler.group = true;

export default handler;
