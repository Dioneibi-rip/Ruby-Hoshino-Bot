import { WAMessageStubType } from '@whiskeysockets/baileys';
import fetch from 'node-fetch';

export async function before(m, { conn, participants, groupMetadata }) {
  if (!m.isGroup || !m.messageStubType) return true;

  const fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo"
    },
    message: {
      contactMessage: {
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${dev}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  };

  const stubParams = m.messageStubParameters || [];
  if (!Array.isArray(stubParams) || stubParams.length === 0) return true;

  let chat = global.db.data.chats[m.chat] || {};
  if (typeof chat.welcome === 'undefined') chat.welcome = true;
  if (!chat.welcome) return true;

  const userJid = stubParams[0];
  const username = userJid.split('@')[0];
  const mention = '@' + username;
  
  const initialMemberCount = groupMetadata.participants?.length || 0;

  let avatar;
  try {
    avatar = await conn.profilePictureUrl(userJid, 'image');
  } catch {
    avatar = 'https://i.imgur.com/8B4QYQY.png';
  }

  const guildName = encodeURIComponent(groupMetadata.subject);
  const apiBase = "https://api.siputzx.my.id/api/canvas";
  const backgroundUrl = encodeURIComponent('https://files.catbox.moe/w1r8jh.jpeg');

  async function fetchImage(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('La API de imágenes falló, usando fallback.');
      return await res.buffer();
    } catch (e) {
      console.error(e);
      const fallbackRes = await fetch(avatar);
      return await fallbackRes.buffer();
    }
  }

  
  if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD || m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_INVITE) {
    const memberCount = initialMemberCount;
    
    const txtWelcome = `🌸 ¡Nuevo miembro! 🌸`;
    const defaultWelcome = `*¡Hola, @user! Te damos la bienvenida a @subject.*

Soy *Ruby Hoshino*, la asistente de este increíble grupo. Espero que tu estancia aquí sea fantástica. ✨

> 💖 Ahora somos ${memberCount} miembros.
> 📌 No olvides leer las reglas para una convivencia armoniosa.
> 🤖 Escribe *#menu* para ver todo lo que puedo hacer.

¡Disfruta de la comunidad!`;
    
    const bienvenida = (chat.welcomeText || defaultWelcome)
      .replace('@user', mention)
      .replace('@subject', groupMetadata.subject)
      .replace('@desc', groupMetadata.desc?.toString() || 'Sin descripción');

    const welcomeApiUrl = `${apiBase}/welcomev2?username=${username}&guildName=${guildName}&memberCount=${memberCount}&avatar=${encodeURIComponent(avatar)}&background=${backgroundUrl}`;
    let imgBuffer = await fetchImage(welcomeApiUrl);

    await conn.sendMini(m.chat, txtWelcome, dev, bienvenida, imgBuffer, imgBuffer, redes, fkontak);

  } else if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE || m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE) {
    const memberCount = initialMemberCount - 1;
    
    const txtGoodbye = `💔 Un miembro se ha ido 💔`;
    const defaultBye = `*Adiós, @user...*

Te extrañaremos en @subject. Esperamos que vuelvas pronto. 👋

> 📉 Ahora quedamos ${memberCount} miembros en el grupo.`;

    const despedida = (chat.byeText || defaultBye)
      .replace('@user', mention)
      .replace('@subject', groupMetadata.subject);
    
    const goodbyeApiUrl = `${apiBase}/goodbyev2?username=${username}&guildName=${guildName}&memberCount=${memberCount}&avatar=${encodeURIComponent(avatar)}&background=${backgroundUrl}`;
    let imgBuffer = await fetchImage(goodbyeApiUrl);
    
    await conn.sendMini(m.chat, txtGoodbye, dev, despedida, imgBuffer, imgBuffer, redes, fkontak);
  }

  return true;
}

