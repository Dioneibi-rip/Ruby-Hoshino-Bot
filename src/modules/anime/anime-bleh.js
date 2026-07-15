import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
let who = await resolveInteractionTarget(m, conn);

let name = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` });
let name2 = await resolveIdentityName(conn, m.sender, { fallback: `@${String(m.sender).split('@')[0]}` });
m.react('😝');

let str;
if (m.mentionedJid.length > 0) {
str = `\`${name2}\` *le sacó la lengua a* \`${name || who}\`.`;
} else if (m.quoted) {
str = `\`${name2}\` *le sacó la lengua a* \`${name || who}\`.`;
} else {
str = `\`${name2}\` *saca la lengua*`.trim();
}

if (m.isGroup) {
let pp = 'https://files.catbox.moe/qhcqag';
let pp2 = 'https://files.catbox.moe/tnsdlr.mp4';
let pp3 = 'https://files.catbox.moe/fox9sl.mp4';
let pp4 = 'https://files.catbox.moe/lh4c2n.mp4';
let pp5 = 'https://files.catbox.moe/y2zg7b.mp4';
let pp6 = 'https://qu.ax/rlvKj.mp4';
let pp7 = 'https://qu.ax/sYXfh.mp4';

const videos = [pp, pp2, pp3, pp4, pp5, pp6];
const video = videos[Math.floor(Math.random() * videos.length)];

let mentions = [who];
conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
}
}

handler.help = ['bleh/lengua @tag'];
handler.tags = ['anime'];
handler.command = ['bleh','lengua'];
handler.group = true;

export default handler;
