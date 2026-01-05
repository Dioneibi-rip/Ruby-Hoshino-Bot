import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';
const claimMsgFile = './src/database/userClaimConfig.json';
export const cooldowns = {};

async function loadCharacters() {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
}

async function saveCharacters(characters) {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
}

async function loadClaimMessages() {
    try {
        const data = await fs.readFile(claimMsgFile, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function getCustomClaimMessage(userId, username, characterName) {
    const messages = await loadClaimMessages();
    const template = messages[userId] || '✧ *$user* ha reclamado a *$character* ✦';
    return template.replace(/\$user/g, username).replace(/\$character/g, characterName);
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = cooldowns[userId] - now;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return conn.reply(m.chat, `⏳ 𝗗𝗲𝗯𝗲𝘀 𝗲𝘀𝗽𝗲𝗿𝗮𝗿 *${minutes}m ${seconds}s* 𝗮𝗻𝘁𝗲𝘀 𝗱𝗲 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿 𝗼𝘁𝗿𝗼 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲.`, m);
    }

    if (!m.quoted || !m.quoted.text) {
        return conn.reply(m.chat, '⚠️ 𝗗𝗲𝗯𝗲𝘀 *𝗰𝗶𝘁𝗮𝗿 𝘂𝗻 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘃𝗮́𝗹𝗶𝗱𝗼* 𝗽𝗮𝗿𝗮 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿𝗹𝗼.', m);
    }

    try {
        const characters = await loadCharacters();
        const match = m.quoted.text.match(/🆔.*?\*(\d+)\*/);
        if (!match) return conn.reply(m.chat, '⚠️ 𝗡𝗼 𝘀𝗲 𝗽𝘂𝗱𝗼 𝗱𝗲𝘁𝗲𝗰𝘁𝗮𝗿 𝗲𝗹 𝗜𝗗 𝗱𝗲𝗹 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲.', m);

        const id = match[1].trim();
        const character = characters.find(c => c.id === id);

        if (!character) return conn.reply(m.chat, '🚫 𝗣𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝗻𝗼 𝗲𝗻𝗰𝗼𝗻𝘁𝗿𝗮𝗱𝗼.', m);

        const rollData = global.activeRolls ? global.activeRolls[id] : null;

        let timeElapsedStr = "";

        if (rollData) {
            const timeElapsed = now - rollData.time;
            const protectionTime = 30000;
            const expirationTime = 60000;

            if (timeElapsed > expirationTime) {
                delete global.activeRolls[id];
                return conn.reply(m.chat, "🍂 𝗘𝘀𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘆𝗮 𝗲𝘅𝗽𝗶𝗿𝗼́ 𝘆 𝗻𝗮𝗱𝗶𝗲 𝗽𝘂𝗲𝗱𝗲 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿𝗹𝗼.", m);
            }

            if (timeElapsed < protectionTime && rollData.user !== userId) {
                const protectedBy = await conn.getName(rollData.user);
                const remainingProtection = Math.ceil((protectionTime - timeElapsed) / 1000);
                return conn.reply(m.chat, `🛡️ el personaje *${character.name}* esta siendo protegido por *${protectedBy}* durante *${remainingProtection} segundos*.`, m);
            }
            
            timeElapsedStr = ` (${(timeElapsed / 1000).toFixed(1)}s)`;
        } else {
            if (!character.user) {
                return conn.reply(m.chat, "🍂 𝗘𝘀𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘆𝗮 𝗲𝘅𝗽𝗶𝗿𝗼́ 𝘆 𝗻𝗮𝗱𝗶𝗲 𝗽𝘂𝗲𝗱𝗲 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿𝗹𝗼.", m);
            }
        }

        const owner = '18294868853@s.whatsapp.net';
        if (character.id === "35" && userId !== owner) {
            return conn.reply(m.chat, '👑 ¡𝗘𝘀𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 𝘀𝗼𝗹𝗼 𝗽𝘂𝗲𝗱𝗲 𝘀𝗲𝗿 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗱𝗼 𝗽𝗼𝗿 𝗗𝗶𝗼𝗻𝗲𝗶𝗯𝗶!', m);
        }

        if (character.user && character.user !== userId) {
            return conn.reply(m.chat, `❌ El personaje *${character.name}* ya fue reclamado por @${character.user.split('@')[0]}.`, m, { mentions: [character.user] });
        }

        character.user = userId;
        character.status = 'Reclamado';
        await saveCharacters(characters);

        if (global.activeRolls && global.activeRolls[id]) {
            delete global.activeRolls[id];
        }

        const username = await conn.getName(userId);
        const baseMessage = await getCustomClaimMessage(userId, username, character.name);
        const mensajeFinal = `${baseMessage}${timeElapsedStr}`; 

        await conn.reply(m.chat, mensajeFinal, m);

        cooldowns[userId] = now + 30 * 60 * 1000;

    } catch (e) {
        conn.reply(m.chat, `✘ 𝗘𝗿𝗿𝗼𝗿 𝗮𝗹 𝗿𝗲𝗰𝗹𝗮𝗺𝗮𝗿 𝘄𝗮𝗶𝗳𝘂:\n${e.message}`, m);
    }
};

handler.help = ['claim'];
handler.tags = ['waifus'];
handler.command = ['claim', 'reclamar', 'c'];
handler.group = true;
export default handler;