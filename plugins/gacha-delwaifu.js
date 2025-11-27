import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error('No se pudo cargar el archivo characters.json.');
    }
}

async function saveCharacters(characters) {
    try {
        await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
    } catch (error) {
        throw new Error('No se pudo guardar el archivo characters.json.');
    }
}

let handler = async (m, { conn, text }) => {
    const userId = m.sender;

    if (!text) {
        return m.reply(`《✧》Debes especificar un personaje para eliminar.\n\n> Ejemplo » *#delwaifu ruby hoshino*`);
    }

    try {
        const characters = await loadCharacters();
        const keyword = text.trim().toLowerCase();

        const characterIndex = characters.findIndex(c => 
            c.user === userId && 
            c.name.toLowerCase().includes(keyword)
        );

        if (characterIndex === -1) {
            return m.reply(`《✧》El personaje *${text}* no ha sido reclamado por ti.`);
        }

        const characterName = characters[characterIndex].name;
        
        delete characters[characterIndex].user;
        characters[characterIndex].status = 'Libre';

        await saveCharacters(characters);

        m.reply(`✦ *${characterName}* ha sido eliminado de tu lista de reclamados.`);

    } catch (e) {
        console.error(e);
        m.reply(`✘ Ocurrió un error al intentar eliminar el personaje: ${e.message}`);
    }
};

handler.help = ['delwaifu <nombre>'];
handler.tags = ['waifus'];
handler.command = ['delwaifu', 'deletewaifu', 'delchar'];
handler.group = true;

export default handler;