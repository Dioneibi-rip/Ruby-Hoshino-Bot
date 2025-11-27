//código creado por Destroy
//fix LID + JID by Dioneibi

import fs from 'fs';
import path from 'path';

const marriagesFile = path.resolve('src/database/casados.json');
let proposals = {}; 
let marriages = loadMarriages();
const confirmation = {};

function loadMarriages() {
    return fs.existsSync(marriagesFile) ? JSON.parse(fs.readFileSync(marriagesFile, 'utf8')) : {};
}

function saveMarriages() {
    fs.writeFileSync(marriagesFile, JSON.stringify(marriages, null, 2));
}

const handler = async (m, { conn, command, participants }) => {
    const isPropose = /^marry$/i.test(command);
    const isDivorce = /^divorce$/i.test(command);

    const userIsMarried = (user) => marriages[user] !== undefined;

    try {
        let proposerJid = m.sender;
        if (m.sender.endsWith('@lid') && m.isGroup) {
            const pInfo = participants.find(p => p.lid === m.sender);
            if (pInfo && pInfo.id) proposerJid = pInfo.id;
        }

        if (isPropose) {
            const rawProposee = m.quoted?.sender || m.mentionedJid?.[0];

            if (!rawProposee) {
                if (userIsMarried(proposerJid)) {
                    return await conn.reply(m.chat, `《✧》 Ya estás casado con *${conn.getName(marriages[proposerJid].partner)}*\n> Puedes divorciarte con el comando: *#divorce*`, m);
                } else {
                    throw new Error('Debes mencionar a alguien para aceptar o proponer matrimonio.\n> Ejemplo » *#marry @Usuario*');
                }
            }

            let proposeeJid = rawProposee;
            if (rawProposee.endsWith('@lid') && m.isGroup) {
                const pInfo = participants.find(p => p.lid === rawProposee);
                if (pInfo && pInfo.id) proposeeJid = pInfo.id;
            }

            if (userIsMarried(proposerJid)) throw new Error(`Ya estás casado con ${conn.getName(marriages[proposerJid].partner)}.`);
            if (userIsMarried(proposeeJid)) throw new Error(`${conn.getName(proposeeJid)} ya está casado con ${conn.getName(marriages[proposeeJid].partner)}.`);
            if (proposerJid === proposeeJid) throw new Error('¡No puedes proponerte matrimonio a ti mismo!');

            proposals[proposerJid] = proposeeJid;
            const proposerName = conn.getName(proposerJid);
            const proposeeName = conn.getName(proposeeJid);
            const confirmationMessage = `♡ ${proposerName} te ha propuesto matrimonio. ${proposeeName}  ¿aceptas? •(=^●ω●^=)•\n\n*Debes Responder con:*\n> ✐"Si" » para aceptar\n> ✐"No" » para rechazar.`;
            
            await conn.reply(m.chat, confirmationMessage, m, { mentions: [proposeeJid, proposerJid] });

            confirmation[proposeeJid] = {
                proposer: proposerJid,
                timeout: setTimeout(() => {
                    conn.sendMessage(m.chat, { text: '*《✧》Se acabó el tiempo, no se obtuvo respuesta. La propuesta de matrimonio fue cancelada.*' }, { quoted: m });
                    delete confirmation[proposeeJid];
                }, 60000)
            };

        } else if (isDivorce) {
            if (!userIsMarried(proposerJid)) throw new Error('No estás casado con nadie.');

            const partner = marriages[proposerJid].partner;
            delete marriages[proposerJid];
            delete marriages[partner];
            saveMarriages();

            if (global.db.data.users[proposerJid]) global.db.data.users[proposerJid].marry = '';
            if (global.db.data.users[partner]) global.db.data.users[partner].marry = '';

            await conn.reply(m.chat, `✐ ${conn.getName(proposerJid)} y ${conn.getName(partner)} se han divorciado.`, m);
        }
    } catch (error) {
        await conn.reply(m.chat, `《✧》 ${error.message}`, m);
    }
}

handler.before = async (m, { conn, participants }) => {
    if (m.isBaileys) return;

    let senderJid = m.sender;
    if (m.sender.endsWith('@lid') && m.isGroup) {
        const pInfo = participants.find(p => p.lid === m.sender);
        if (pInfo && pInfo.id) senderJid = pInfo.id;
    }

    if (!(senderJid in confirmation)) return;
    if (!m.text) return;

    const { proposer, timeout } = confirmation[senderJid];

    if (/^No$/i.test(m.text)) {
        clearTimeout(timeout);
        delete confirmation[senderJid];
        return conn.sendMessage(m.chat, { text: '*《✧》Han rechazado tu propuesta de matrimonio.*' }, { quoted: m });
    }

    if (/^Si$/i.test(m.text)) {
        delete proposals[proposer];

        const fecha = Date.now();

        marriages[proposer] = { partner: senderJid, date: fecha };
        marriages[senderJid] = { partner: proposer, date: fecha };
        saveMarriages();

        if (global.db.data.users[proposer]) global.db.data.users[proposer].marry = senderJid;
        if (global.db.data.users[senderJid]) global.db.data.users[senderJid].marry = proposer;

        conn.sendMessage(m.chat, { text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩
¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n*•.¸♡ Esposo ${conn.getName(proposer)}\n*•.¸♡ Esposa ${conn.getName(senderJid)}\n\n\`Disfruten de su luna de miel\`

✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`, mentions: [proposer, senderJid] }, { quoted: m });

        clearTimeout(timeout);
        delete confirmation[senderJid];
    }
};

handler.tags = ['fun'];
handler.help = ['marry *@usuario*', 'divorce'];
handler.command = ['marry', 'divorce'];
handler.group = true;

export default handler;