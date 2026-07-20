import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
let who = await resolveInteractionTarget(m, conn);

let name = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` });
let name2 = await resolveIdentityName(conn, m.sender, { fallback: `@${String(m.sender).split('@')[0]}` });
m.react('👋');

let str;
if (m.mentionedJid.length > 0) {
str = `\`${name2}\` *hola* \`${name || who}\` *como estas?.*`;
} else if (m.quoted) {
str = `\`${name2}\` *hola* \`${name || who}\` *como te encuentras hoy?.*`;
} else {
str = `\`${name2}\` *saluda a todos los integrantes del grupo, como se encuentran?*`.trim();
}

if (m.isGroup) {
let pp = 'https://qu.ax/EcRBE.mp4';
let pp2 = 'https://qu.ax/oARle.mp4';
let pp3 = 'https://qu.ax/eQXQh.mp4';
let pp4 = 'https://qu.ax/ddLrC.mp4';
let pp5 = 'https://qu.ax/oalOG.mp4';
let pp6 = 'https://qu.ax/nYJ.mp4';
let pp7 = 'https://qu.ax/bkcz.mp4';
let pp8 = 'https://qu.ax/oARle.mp4';

const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7, pp8];
const video = videos[Math.floor(Math.random() * videos.length)];

let mentions = [who];
conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
}
}

handler.help = ['hello/hola @tag'];
handler.tags = ['anime'];
handler.command = ['hello','hola'];
handler.group = true;

export default handler;
