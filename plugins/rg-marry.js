/* Código hecho por Destroy, adaptado y mejorado por ChatGPT
 - https://github.com/The-King-Destroy
 - Créditos respetados.
*/

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

const handler = async (m, { conn, command }) => {
    const isPropose = /^marry$/i.test(command);
    const isDivorce = /^divorce$/i.test(command);

    const userIsMarried = (user) => marriages[user] !== undefined;

    try {
        if (isPropose) {
            const proposee = m.quoted?.sender || m.mentionedJid?.[0];
            const proposer = m.sender;

            if (!proposee) {
                if (userIsMarried(proposer)) {
                    return await conn.reply(m.chat, `《✧》 Ya estás casado con *${conn.getName(marriages[proposer].partner)}*\n> Puedes divorciarte con el comando: *#divorce*`, m);
                } else {
                    throw new Error('Debes mencionar a alguien para aceptar o proponer matrimonio.\n> Ejemplo » *#marry @Usuario*');
                }
            }

            if (userIsMarried(proposer)) throw new Error(`Ya estás casado con ${conn.getName(marriages[proposer].partner)}.`);
            if (userIsMarried(proposee)) throw new Error(`${conn.getName(proposee)} ya está casado con ${conn.getName(marriages[proposee].partner)}.`);
            if (proposer === proposee) throw new Error('¡No puedes proponerte matrimonio a ti mismo!');

            proposals[proposer] = proposee;
            const proposerName = conn.getName(proposer);
            const proposeeName = conn.getName(proposee);
            const confirmationMessage = `♡ ${proposerName} te ha propuesto matrimonio, ${proposeeName} 💍\n\n¿Aceptas? •(=^●ω●^=)•\n\n*Debes responder con:*\n> ✐ "Si" para aceptar 💞\n> ✐ "No" para rechazar 💔`;
            await conn.reply(m.chat, confirmationMessage, m, { mentions: [proposee, proposer] });

            confirmation[proposee] = {
                proposer,
                timeout: setTimeout(() => {
                    conn.sendMessage(m.chat, { text: '*《✧》Se acabó el tiempo, no se obtuvo respuesta. La propuesta de matrimonio fue cancelada.*' }, { quoted: m });
                    delete confirmation[proposee];
                }, 60000)
            };

        } else if (isDivorce) {
            if (!userIsMarried(m.sender)) throw new Error('No estás casado con nadie.');

            const partner = marriages[m.sender].partner;
            delete marriages[m.sender];
            delete marriages[partner];
            saveMarriages();

            if (global.db.data.users[m.sender]) global.db.data.users[m.sender].marry = '';
            if (global.db.data.users[partner]) global.db.data.users[partner].marry = '';

            await conn.reply(m.chat, `✐ ${conn.getName(m.sender)} y ${conn.getName(partner)} se han divorciado. 💔`, m);
        }
    } catch (error) {
        await conn.reply(m.chat, `《✧》 ${error.message}`, m);
    }
};

handler.before = async (m, { conn }) => {
    if (m.isBaileys) return;
    if (!(m.sender in confirmation)) return;
    if (!m.text) return;

    const respuesta = m.text.trim().toLowerCase();
    const { proposer, timeout } = confirmation[m.sender];

    if (respuesta === 'no') {
        clearTimeout(timeout);
        delete confirmation[m.sender];
        return conn.sendMessage(m.chat, { text: `《✧》 ${conn.getName(m.sender)} ha rechazado la propuesta de matrimonio 💔` }, { quoted: m });
    }

    if (respuesta === 'si' || respuesta === 'sí') {
        clearTimeout(timeout);
        delete confirmation[m.sender];
        delete proposals[proposer];

        const fecha = Date.now();

        marriages[proposer] = { partner: m.sender, date: fecha };
        marriages[m.sender] = { partner: proposer, date: fecha };
        saveMarriages();

        if (global.db?.data?.users[proposer]) global.db.data.users[proposer].marry = m.sender;
        if (global.db?.data?.users[m.sender]) global.db.data.users[m.sender].marry = proposer;

        await conn.sendMessage(m.chat, {
            text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩
💞 ¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧

*•.¸♡ Esposo:* ${conn.getName(proposer)}
*•.¸♡ Esposa:* ${conn.getName(m.sender)}

🎉 ¡Disfruten de su luna de miel! 🍓💍
✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
            mentions: [proposer, m.sender]
        }, { quoted: m });
    }
};

handler.tags = ['fun'];
handler.help = ['marry *@usuario*', 'divorce'];
handler.command = ['marry', 'divorce'];
handler.group = true;

export default handler;
