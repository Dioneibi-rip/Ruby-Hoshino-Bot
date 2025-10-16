import { WAMessageStubType } from '@whiskeysockets/baileys';

global.fkontak = {
    "key": {
        "participants": "0@s.whatsapp.net",
        "remoteJid": "status@broadcast",
        "fromMe": false,
        "id": "Halo"
    },
    "message": {
        "contactMessage": {
            "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
    },
    "participant": "0@s.whatsapp.net"
};

async function generarBienvenida({ conn, userId, groupMetadata, chat }) {
    const username = `@${userId.split('@')[0]}`;
    const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg');
    const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' });
    const groupSize = groupMetadata.participants.length;
    const desc = groupMetadata.desc?.toString() || 'Sin descripción';
    
    const mensaje = (chat.welcomeText || '¡Disfruta tu estadía en el grupo!')
        .replace(/@user/g, username)
        .replace(/@subject/g, groupMetadata.subject)
        .replace(/@desc/g, desc);
    const caption = `❀ Bienvenido a *"_${groupMetadata.subject}_"*\n✰ _Usuario_ » ${username}\n● ${mensaje}\n◆ _Ahora somos ${groupSize} Miembros._\nꕥ Fecha » ${fecha}\n૮꒰ ˶• ᴗ •˶꒱ა Disfruta tu estadía en el grupo!\n> *➮ Puedes usar _#help_ para ver la lista de comandos.*`;
    
    return { pp, caption, mentions: [userId] };
}

async function generarDespedida({ conn, userId, groupMetadata, chat }) {
    const username = `@${userId.split('@[0]')[0]}`;
    const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg');
    const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' });
    const groupSize = groupMetadata.participants.length;
    const desc = groupMetadata.desc?.toString() || 'Sin descripción';

    const mensaje = (chat.byeText || '¡Vuelve pronto!')
        .replace(/@user/g, username)
        .replace(/@subject/g, groupMetadata.subject);

    const caption = `❀ Adiós de *"_${groupMetadata.subject}_"*\n✰ _Usuario_ » ${username}\n● ${mensaje}\n◆ _Ahora somos ${groupSize} Miembros._\nꕥ Fecha » ${fecha}\n(˶˃⤙˂˶) Te esperamos pronto!`;
    
    return { pp, caption, mentions: [userId] };
}

let handler = m => m;

handler.before = async function (m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return true;

    const primaryBot = global.db.data.chats[m.chat].primaryBot;
    if (primaryBot && conn.user.jid !== primaryBot) return;

    const chat = global.db.data.chats[m.chat];
    const userId = m.messageStubParameters[0];

    const rcanal = {
        contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363335626706839@newsletter',
                newsletterName: '⏤͟͞ू⃪፝͜⁞⟡『 𝐓͢ᴇ𝙖፝ᴍ⃨ 𝘾𝒉꯭𝐚𝑛𝑛𝒆𝑙: 𝑹ᴜ⃜ɓ𝑦-𝑯ᴏ𝒔𝑯𝙞꯭𝑛𝒐 』࿐⟡',
                serverMessageId: -1,
            },
            externalAdReply: {
                title: 'ׄ❀ׅᮢ໋۬۟   ׁ ᮫᩠𝗥ᥙ᜔᪲𝖻ֹ𝘺 𝐇֢ᩚᨵ̷̸ׁׅׅ𝗌𝗁𝗂ᮬ𝗇֟፝͡𝗈̷̸  ꫶֡ᰵ࡙🌸̵໋ׄᮬ͜✿֪',
                body: dev,
                thumbnail: icons,
                sourceUrl: redes,
                mediaType: 1,
                renderLargerThumbnail: false,
            }
        }
    };

    if (chat.welcome && m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_ADD) {
        const { pp, caption, mentions } = await generarBienvenida({ conn, userId, groupMetadata, chat });
        
        rcanal.contextInfo.mentionedJid = [...new Set([m.sender, ...mentions])];

        await conn.sendMessage(m.chat, { image: { url: pp }, caption, ...rcanal }, { quoted: null });
    }

    if (chat.welcome && (m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_REMOVE || m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_LEAVE)) {
        const { pp, caption, mentions } = await generarDespedida({ conn, userId, groupMetadata, chat });
        
        rcanal.contextInfo.mentionedJid = [...new Set([m.sender, ...mentions])];
        
        await conn.sendMessage(m.chat, { image: { url: pp }, caption, ...rcanal }, { quoted: null });
    }
};

export { generarBienvenida, generarDespedida };
export default handler;