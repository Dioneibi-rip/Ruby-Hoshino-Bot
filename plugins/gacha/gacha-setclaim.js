
let handler = async (m, { args, command }) => {
    const userId = m.sender;

    let config = global.db?.getSection?.('claim_config') || {};

    if (command === 'delclaimmsg') {
        if (config[userId]) {
            delete config[userId];
            global.db.replaceSection('claim_config', config); await global.db.write?.();
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

    global.db.replaceSection('claim_config', config); await global.db.write?.();

    m.reply(`✧ ¡Tu mensaje personalizado fue guardado correctamente!\n(Si tenías uno anterior, ha sido actualizado)\n\n*Vista previa del formato:*\n${texto}`);
};

handler.help = ['setclaim <mensaje>', 'delclamsg'];
handler.tags = ['waifus'];
handler.command = ['setclaim', 'setclaimmsg', 'delclaimmsg'];
handler.group = true;

export default handler;
