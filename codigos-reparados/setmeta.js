const fs = require('fs');
const path = require('path');

const META_FILE = path.join(process.cwd(), 'sticker_meta.json');

function ensureUserMeta(sender) {
    if (!global.db) global.db = { data: {} };
    if (!global.db.data) global.db.data = {};
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[sender]) global.db.data.users[sender] = {};
    return global.db.data.users[sender];
}

async function saveMeta(sender, packname, author) {
    const user = ensureUserMeta(sender);
    user.text1 = packname;
    user.text2 = author;

    if (typeof global.db.write === 'function') {
        await global.db.write();
    }

    // Respaldo para bots que no usan la base de datos global de Ruby Hoshino.
    fs.writeFileSync(
        META_FILE,
        JSON.stringify({ packname, author, users: { [sender]: { packname, author } } }, null, 2),
        'utf8'
    );
}

module.exports = {
    command: ['setmeta', 'delmeta'],
    execute: async (m, { conn, from, args, command, usedPrefix }) => {
        try {
            const sender = m.sender || m.key?.participant || m.key?.remoteJid || from;
            const texto = (args || []).join(' ').trim();
            const cmd = (command || '').toLowerCase();

            if (cmd === 'delmeta') {
                const user = ensureUserMeta(sender);

                if (!user.text1 && !user.text2 && !fs.existsSync(META_FILE)) {
                    return conn.sendMessage(
                        from,
                        { text: '⚠️ No tienes metadatos personalizados guardados.' },
                        { quoted: m }
                    );
                }

                delete user.text1;
                delete user.text2;

                if (typeof global.db.write === 'function') {
                    await global.db.write();
                }

                if (fs.existsSync(META_FILE)) fs.unlinkSync(META_FILE);

                return conn.sendMessage(
                    from,
                    { text: '✅ Se restableció el pack y autor por defecto.' },
                    { quoted: m }
                );
            }

            if (!texto) {
                const prefix = usedPrefix || '.';
                return conn.sendMessage(
                    from,
                    {
                        text:
                            `⚠️ Uso: ${prefix}setmeta Nombre del Pack | Autor\n\n` +
                            `Ejemplos:\n` +
                            `• ${prefix}setmeta Ruby Hoshino | Dioneibi\n` +
                            `• ${prefix}setmeta Solo Pack\n` +
                            `• ${prefix}setmeta | Solo Autor`
                    },
                    { quoted: m }
                );
            }

            const separator = /[|\u2022]/;
            let packname = '';
            let author = '';

            if (separator.test(texto)) {
                const [packInput = '', authorInput = ''] = texto.split(separator);
                packname = packInput.trim();
                author = authorInput.trim();
            } else {
                packname = texto;
                author = '';
            }

            await saveMeta(sender, packname, author);

            await conn.sendMessage(
                from,
                {
                    text:
                        `✅ Metadatos guardados correctamente.\n\n` +
                        `📦 Pack: ${packname || '_Vacío_'}\n` +
                        `✍️ Autor: ${author || '_Vacío_'}`
                },
                { quoted: m }
            );
        } catch (error) {
            console.error('Error en setmeta:', error);

            await conn.sendMessage(
                from,
                { text: '❌ Ocurrió un error al guardar los metadatos.' },
                { quoted: m }
            );
        }
    }
};
