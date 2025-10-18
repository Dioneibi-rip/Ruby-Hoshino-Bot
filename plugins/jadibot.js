import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch, rmSync, promises as fsPromises } from "fs";
const fs = { ...fsPromises, existsSync };
import path, { join } from 'path';
import ws from 'ws';

let handler = async (m, { conn: _envio, command, usedPrefix, args, text, isOwner }) => {
  const isDeleteSession = /^(deletesesion|deletebot|deletesession|deletesesaion)$/i.test(command);
  const isPauseBot = /^(stop|pausarai|pausarbot)$/i.test(command);
  const isShowBots = /^(bots|sockets|socket)$/i.test(command);

  const reportError = async (e) => {
    await m.reply(`⚠️ Ocurrió un error inesperado, lo siento mucho...`)
    console.error(e);
  };

  switch (true) {
    case isDeleteSession: {
      const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
      const uniqid = `${who.split('@')[0]}`;
      const dirPath = `./${jadi}/${uniqid}`;

      if (!await fs.existsSync(dirPath)) {
        await conn.sendMessage(m.chat, {
          text: `🚫 *Sesión no encontrada*\n\n✨ No tienes una sesión activa.\n\n🔰 Puedes crear una con:\n*${usedPrefix}qr*\n\n📦 ¿Tienes un ID?\nUsa este comando seguido del ID:\n*${usedPrefix}code* \`\`\`(ID)\`\`\``
        }, { quoted: m });
        return;
      }

      if (global.conn.user.jid !== conn.user.jid) {
        await conn.sendMessage(m.chat, {
          text: `💬 Este comando solo puede usarse desde el *Bot Principal*.\n\n🔗 Accede desde aquí:\nhttps://api.whatsapp.com/send/?phone=${global.conn.user.jid.split`@`[0]}&text=${usedPrefix + command}&type=phone_number&app_absent=0`
        }, { quoted: m });
        return;
      }

      await conn.sendMessage(m.chat, {
        text: `🗑️ Tu sesión como *Sub-Bot* ha sido eliminada con éxito.`
      }, { quoted: m });

      try {
        fs.rmdir(`./${jadi}/${uniqid}`, { recursive: true, force: true });
        await conn.sendMessage(m.chat, {
          text: `🌈 ¡Todo limpio! Tu sesión y sus rastros han sido borrados por completo.`
        }, { quoted: m });
      } catch (e) {
        reportError(e);
      }
      break;
    }

    case isPauseBot: {
      if (global.conn.user.jid == conn.user.jid) {
        conn.reply(m.chat, `🚫 No puedes pausar el bot principal.\n🛟 Si deseas ser un *Sub-Bot*, contacta con el número principal.`, m);
      } else {
        await conn.reply(m.chat, `🔕 *${botname} ha sido pausada.*`, m);
        conn.ws.close();
      }
      break;
    }

    case isShowBots: {
      const users = [...new Set([...global.conns.filter(conn => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED)])];

      const convertirMsAFormato = (ms) => {
        if (!ms || ms < 1000) return 'Recién conectado';
        let segundos = Math.floor(ms / 1000);
        let minutos = Math.floor(segundos / 60);
        let horas = Math.floor(minutos / 60);
        let días = Math.floor(horas / 24);
        
        segundos %= 60;
        minutos %= 60;
        horas %= 24;

        const parts = [];
        if (días > 0) parts.push(`${días}d`);
        if (horas > 0) parts.push(`${horas}h`);
        if (minutos > 0) parts.push(`${minutos}m`);
        if (segundos > 0) parts.push(`${segundos}s`);
        
        return parts.join(', ') || 'Justo ahora';
      };

      const listaSubBots = users.map((v, i) => {
          const uptime = v.uptime ? convertirMsAFormato(Date.now() - v.uptime) : 'Desconocido';
          const numero = v.user.jid.split('@')[0];
          const nombre = v.user.name || 'Sin Nombre';
          return `╭━ • 🤖 *SUB-BOT ${i + 1}* • ━
│➤ *Usuario:* ${nombre}
│➤ *Número:* wa.me/${numero}
│➤ *Activo:* ${uptime}
╰━━━━━━━━━━━━━`;
        }).join('\n\n');

      const finalMessage = users.length > 0
        ? listaSubBots
        : '💤 Actualmente no hay Sub-Bots conectados.';

      const msg = `*SUB-BOTS CONECTADOS* ✨
      
Aquí tienes la lista de los bots que están activos en este momento.

*Total Conectados:* ${users.length}
${users.length > 0 ? '\n───────────────\n' : ''}
${finalMessage}

*Nota:* El bot principal no se hace responsable por el uso que se le de a los Sub-Bots.`.trim();

      await _envio.sendMessage(m.chat, {
        image: { url: 'https://files.catbox.moe/65rdkc.jpg' },
        caption: msg,
        mentions: _envio.parseMention(msg)
      }, { quoted: m });
      
      break;
    }
  }
};

handler.tags = ['serbot'];
handler.help = ['sockets', 'deletesesion', 'pausarai'];
handler.command = [
  'deletesesion', 'deletebot', 'deletesession', 'deletesesaion',
  'stop', 'pausarai', 'pausarbot',
  'bots', 'sockets', 'socket'
];

export default handler;