import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch, rmSync, promises as fsPromises } from "fs";
const fs = { ...fsPromises, existsSync };
import path, { join } from 'path';
import ws from 'ws';


let handler = async (m, { conn: _envio, command, usedPrefix, args, text, isOwner }) => {
  const isDeleteSession = /^(deletesesion|deletebot|deletesession|deletesesaion)$/i.test(command);
  const isPauseBot = /^(stop|pausarai|pausarbot)$/i.test(command);
  const isShowBots = /^(bots|sockets|socket)$/i.test(command);

  const reportError = async (e) => {
    await m.reply(`⚠️ Ocurrió un error inesperado, lo siento mucho...`);
    console.error(e);
  };

  switch (true) {
    case isDeleteSession: {
      const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
      const uniqid = `${who.split('@')[0]}`;
      const dirPath = `./${jadi}/${uniqid}`;

      if (!await fs.existsSync(dirPath)) {
        await conn.sendMessage(m.chat, {
          text: `🚫 *Sesión no encontrada*\n\n✨ No tienes una sesión activa.\n\n🔰 Puedes crear una con:\n*${usedPrefix + command}*\n\n📦 ¿Tienes un ID?\nUsa este comando seguido del ID:\n*${usedPrefix + command}* \`\`\`(ID)\`\`\``
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
      try {
        const allConnections = [...new Set([...global.conns.filter(conn => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED)])];
        const cantidadSubBots = allConnections.length;

        const metadata = await _envio.groupMetadata(m.chat);
        const participantes = metadata.participants || [];
        const botsEnEsteGrupo = participantes.filter(p => global.db.data.users[p.id]?.isBot).length;

        const convertirMsADiasHorasMinutosSegundos = (ms) => {
          let segundos = Math.floor(ms / 1000);
          let minutos = Math.floor(segundos / 60);
          let horas = Math.floor(minutos / 60);
          segundos %= 60;
          minutos %= 60;
          horas %= 24;
          return `${horas} horas, ${minutos} minutos, ${segundos} segundos`;
        };

        const detallesBots = allConnections.map((connBot) => {
          const numero = connBot.user?.jid?.split('@')[0] || 'Desconocido';
          const nombre = connBot.user?.name || 'Sub-Bot';
          const uptime = connBot.uptime ? convertirMsADiasHorasMinutosSegundos(Date.now() - connBot.uptime) : 'Desconocido';
          return `
✧ Bot » ${nombre}
> 🜸 Uptime » ${uptime}`.trim();
        }).join('\n\n');

        const textoFinal = `
*ꕥ Números de Sockets Activos*

❀ Principal » *1*
✿ Subs » *${cantidadSubBots}*

❏ En este grupo » *${botsEnEsteGrupo}* bots

${detallesBots}

> ${dev}`.trim();

        await _envio.sendMessage(m.chat, {
          text: textoFinal,
          mentions: [...allConnections.map(v => v.user?.jid), m.sender].filter(Boolean)
        }, { quoted: m });
      } catch (e) {
        reportError(e);
      }
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
