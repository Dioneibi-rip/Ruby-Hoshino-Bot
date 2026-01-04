import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';
const haremFilePath = './src/database/harem.json';

export const cooldowns = {};

global.activeRolls = global.activeRolls || {};

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error('❀ No se pudo cargar el archivo characters.json.');
    }
}

async function saveCharacters(characters) {
    try {
        await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
    } catch (error) {
        throw new Error('❀ No se pudo guardar el archivo characters.json.');
    }
}

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveHarem(harem) {
    try {
        await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2), 'utf-8');
    } catch (error) {
        throw new Error('❀ No se pudo guardar el archivo harem.json.');
    }
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remainingTime = Math.ceil((cooldowns[userId] - now) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        return await conn.reply(m.chat, `( ⸝⸝･̆⤚･̆⸝⸝) ¡𝗗𝗲𝗯𝗲𝘀 𝗲𝘀𝗽𝗲𝗿𝗮𝗿 *${minutes} minutos y ${seconds} segundos* 𝗽𝗮𝗿𝗮 𝘃𝗼𝗹𝘃𝗲𝗿 𝗮 𝘂𝘀𝗮𝗿 *#rw* 𝗱𝗲 𝗻𝘂𝗲𝘃𝗼.`, m);
    }

    try {
        const characters = await loadCharacters();
        const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
        const randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)];

        const harem = await loadHarem();
        const userEntry = harem.find(entry => entry.characterId === randomCharacter.id);
        
        // Formato para el estado (más limpio)
        const statusMessage = randomCharacter.user 
            ? `🚫 Ocupado (@${randomCharacter.user.split('@')[0]})` 
            : '✅ Libre';

        if (!randomCharacter.user) {
            global.activeRolls[randomCharacter.id] = {
                user: userId,
                time: Date.now()
            };
        }

        const message = `︵ᮬ⌒⏜︵፝֟ᮬ⏜︵ᮬ⌒⏜ᮬ
 ꒰͜  ✦ 𝐂𝐇𝐀𝐑𝐀𝐂𝐓𝐄𝐑 𝐑𝐎𝐋𝐋 ✦ ͜꒱
⎯⎯⎯⎯⎯⎯  ׁ︩︪᷼  ᮫ ︪︩ໍ ܻ݊᷼🍂ܻ݊᷼ᩨᤢ ︩︪᷼ ᮫ ࣫⎯⎯⎯⎯⎯⎯⎯

👤 𝐍𝐨𝐦𝐛𝐫𝐞 ╰┈➤ *${randomCharacter.name}*
⚧ 𝐆𝐞𝐧𝐞𝐫𝐨 ╰┈➤ *${randomCharacter.gender}*
🪙 𝐕𝐚𝐥𝐨𝐫   ╰┈➤ *${randomCharacter.value}*
📊 𝐄𝐬𝐭𝐚𝐝𝐨  ╰┈➤ ${statusMessage}
📖 𝐅𝐮𝐞𝐧𝐭𝐞  ╰┈➤ *${randomCharacter.source}*
🆔 𝐈𝐃      ╰┈➤ *${randomCharacter.id}*

⎯⎯⎯⎯⎯⎯  ׁ︩︪᷼  ᮫ ︪︩ໍ ܻ݊᷼🍪ܻ݊᷼ᩨᤢ ︩︪᷼ ᮫ ࣫⎯⎯⎯⎯⎯⎯⎯`;

        const mentions = statusMessage.includes('@') ? [randomCharacter.user] : [];
        await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.jpg`, message, m, { mentions });

        cooldowns[userId] = now + 15 * 60 * 1000;

    } catch (error) {
        await conn.reply(m.chat, `✘ 𝗘𝗿𝗿𝗼𝗿 𝗮𝗹 𝗰𝗮𝗿𝗴𝗮𝗿 𝗲𝗹 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲: ${error.message}`, m);
    }
};

handler.help = ['rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
handler.group = true;

export default handler;