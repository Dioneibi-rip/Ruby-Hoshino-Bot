import fs from 'fs/promises';

const userConfigFile = './src/database/userClaimConfig.json';

let handler = async (m, { args, command }) => {
    const userId = m.sender;
    
    let config = {};
    try {
        const data = await fs.readFile(userConfigFile, 'utf-8');
        config = JSON.parse(data);
    } catch { 
        config = {}; 
    }

    if (command === 'delclaimmsg') {
        if (config[userId]) {
            delete config[userId];
            await fs.writeFile(userConfigFile, JSON.stringify(config, null, 2));
            return m.reply(`《✧》Tu mensaje personalizado ha sido eliminado. Ahora usarás el mensaje por defecto.`);
        } else {
            return m.reply(`《✧》No tienes ningún mensaje personalizado guardado para eliminar.`);
        }
    }

    let texto = args.join(' ').trim();

    if (!texto) {
        return m.reply(`《✧》Debes especificar un mensaje para reclamar un personaje.\n\n> Ejemplos:\n*#setclaim $user ha reclamado a $character!*\n*#setclaim Ahora $user es dueño de $character.*`);
    }

    texto = texto.replace(/\*?\$user\*?/gi, '*$user*');
    texto = texto.replace(/\*?\$character\*?/gi, '*$character*');

    config[userId] = texto;

    await fs.writeFile(userConfigFile, JSON.stringify(config, null, 2));

    m.reply(`✧ ¡Tu mensaje personalizado fue guardado correctamente!\n(Si tenías uno anterior, ha sido actualizado)\n\n*Vista previa del formato:*\n${texto}`);
};

handler.help = ['setclaim <mensaje>', 'delclamsg'];
handler.tags = ['waifus'];
handler.command = ['setclaim', 'setclaimmsg', 'delclaimmsg'];
handler.group = true;

export default handler;