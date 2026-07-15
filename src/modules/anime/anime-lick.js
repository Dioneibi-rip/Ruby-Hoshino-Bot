import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
let who = await resolveInteractionTarget(m, conn);

let name = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` });
let name2 = await resolveIdentityName(conn, m.sender, { fallback: `@${String(m.sender).split('@')[0]}` });
m.react('😛');

let str;
if (m.mentionedJid.length > 0) {
str = `\`${name2}\` *lambetio a* \`${name || who}\`.`;
} else if (m.quoted) {
str = `\`${name2}\` *lamió a* \`${name || who}\`.`;
} else {
str = `\`${name2}\` *se lamió a sí mismo.*`.trim();
}

if (m.isGroup) {
let pp = 'https://telegra.ph/file/0ce171b163a669ae9819d.mp4';
let pp2 = 'https://telegra.ph/file/b80fdfb8551b66f77b67e.mp4';
let pp3 = 'https://telegra.ph/file/f87d442b78389d4ed5be0.mp4';
let pp4 = 'https://telegra.ph/file/74828e36617c16421598f.mp4';
let pp5 = 'https://telegra.ph/file/093cbdd990220446d8920.mp4';
let pp6 = 'https://telegra.ph/file/570944813cab1c9dddd03.mp4';
let pp7 = 'https://telegra.ph/file/a0a86516033a906b55220.mp4';
let pp8 = 'https://telegra.ph/file/02ec493403335917d1ece.mp4';
let pp9 = 'https://telegra.ph/file/5042d5f627a3500e2fe8e.mp4';

const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7, pp8, pp9];
const video = videos[Math.floor(Math.random() * videos.length)];

let mentions = [who];
conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
}
}

handler.help = ['lick/lamer @tag'];
handler.tags = ['anime'];
handler.command = ['lick','lamer','lamber'];
handler.group = true;

export default handler;
