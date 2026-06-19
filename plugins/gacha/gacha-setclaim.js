
let handler = async (m, { args, command }) => {
    const userId = m.sender;

    const db = global.db;
    let config = db?.getSection?.('claim_config') || {};

    if (command === 'delclaimmsg') {
        if (config[userId]) {
            delete config[userId];
            db.sqlite.prepare('DELETE FROM claim_config WHERE user_id = ?').run(userId);
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

    db.sqlite.prepare('INSERT INTO claim_config(user_id, message, updated_at) VALUES(?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET message = excluded.message, updated_at = excluded.updated_at').run(userId, texto, Date.now());

    m.reply(`✧ ¡Tu mensaje personalizado fue guardado correctamente!\n(Si tenías uno anterior, ha sido actualizado)\n\n*Vista previa del formato:*\n${texto}`);
};

handler.help = ['setclaim <mensaje>', 'delclamsg'];
handler.tags = ['waifus'];
handler.command = ['setclaim', 'setclaimmsg', 'delclaimmsg'];
handler.group = true;

export default handler;
