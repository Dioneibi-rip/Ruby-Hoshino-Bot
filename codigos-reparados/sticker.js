const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const { Sticker } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const execFileAsync = promisify(execFile);
const META_FILE = path.join(process.cwd(), 'sticker_meta.json');

function readSavedMeta(sender) {
    const user = global.db?.data?.users?.[sender];

    if (user && ('text1' in user || 'text2' in user)) {
        return {
            packname: user.text1 ?? '',
            author: user.text2 ?? ''
        };
    }

    if (fs.existsSync(META_FILE)) {
        try {
            const saved = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
            const userSaved = saved.users?.[sender];
            return {
                packname: userSaved?.packname ?? saved.packname ?? global.packsticker ?? global.packname ?? '',
                author: userSaved?.author ?? saved.author ?? global.packsticker2 ?? global.author ?? ''
            };
        } catch (error) {
            console.error('No se pudo leer sticker_meta.json:', error);
        }
    }

    return {
        packname: global.packsticker ?? global.packname ?? '',
        author: global.packsticker2 ?? global.author ?? ''
    };
}

function getQuotedMessage(m) {
    return m.quoted || m;
}

function getMediaMessage(q) {
    return q.message?.imageMessage ||
        q.message?.videoMessage ||
        q.message?.stickerMessage ||
        q.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
        q.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
        q.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
}

function getMediaType(q) {
    if (q.message?.stickerMessage || q.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) return 'sticker';
    if (q.message?.videoMessage || q.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) return 'video';
    return 'image';
}

async function streamToBuffer(stream) {
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

async function addStickerMeta(buffer, packname, author) {
    const sticker = new Sticker(buffer, {
        pack: packname,
        author,
        type: 'full',
        quality: 80,
        categories: ['🎀']
    });

    return sticker.toBuffer();
}

async function convertToWebp(input, output, isVideo) {
    const videoArgs = isVideo
        ? ['-t', '15', '-an', '-vsync', '0']
        : ['-an'];

    await execFileAsync('ffmpeg', [
        '-y',
        '-i', input,
        ...videoArgs,
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0.0,fps=15',
        '-c:v', 'libwebp',
        '-preset', 'default',
        '-loop', '0',
        '-f', 'webp',
        output
    ]);
}

module.exports = {
    command: ['s', 'sticker', 's2'],
    execute: async (m, { conn, from, args }) => {
        const q = getQuotedMessage(m);
        const mediaMessage = getMediaMessage(q);

        if (!mediaMessage) {
            return conn.sendMessage(
                from,
                { text: '⚠️ Envía o responde a una imagen, video o sticker.' },
                { quoted: m }
            );
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const sender = m.sender || m.key?.participant || m.key?.remoteJid || from;
        const savedMeta = readSavedMeta(sender);
        const customMeta = (args || []).join(' ').trim();
        const [packArg, authorArg] = customMeta
            ? customMeta.split(/[|\u2022]/).map(value => value.trim())
            : [];
        const packname = customMeta ? (packArg ?? savedMeta.packname) : savedMeta.packname;
        const author = customMeta && /[|\u2022]/.test(customMeta) ? (authorArg ?? '') : savedMeta.author;

        const id = `${Date.now()}_${m.key?.id || Math.random().toString(16).slice(2)}`.replace(/[^a-zA-Z0-9_-]/g, '');
        const input = path.join(os.tmpdir(), `sticker_${id}.bin`);
        const output = path.join(os.tmpdir(), `sticker_${id}.webp`);

        try {
            const type = getMediaType(q);
            const stream = await downloadContentFromMessage(mediaMessage, type);
            const buffer = await streamToBuffer(stream);

            let stickerBuffer;

            if (type === 'sticker') {
                // Importante: no se reenvía directo; se reescribe el EXIF para cambiar pack/autor.
                stickerBuffer = await addStickerMeta(buffer, packname, author);
            } else {
                fs.writeFileSync(input, buffer);
                await convertToWebp(input, output, type === 'video');
                stickerBuffer = await addStickerMeta(fs.readFileSync(output), packname, author);
            }

            await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('Error en sticker:', error);
            await conn.sendMessage(from, { react: { text: '✖️', key: m.key } });
            await conn.sendMessage(from, { text: `❌ Error: ${error.message || error}` }, { quoted: m });
        } finally {
            if (fs.existsSync(input)) fs.unlinkSync(input);
            if (fs.existsSync(output)) fs.unlinkSync(output);
        }
    }
};
