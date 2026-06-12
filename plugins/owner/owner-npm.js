import { exec } from 'child_process';

let handler = async (m, { conn }) => {
  m.reply(`${emoji2} instalando dependencias...`);

  exec('npm install ytdl-core sharp', (err, stdout, stderr) => {
    if (err) {
      conn.reply(m.chat, `${msm} log de la instalacion:.\nRazón: ${err.message}`, m);
      return;
    }

    if (stderr) {
      console.warn('Advertencia durante la instalacion de dependencias:', stderr);
    }

    if (stdout.includes('Already up to date.')) {
      conn.reply(m.chat, `${emoji4} El bot ya está actualizado.`, m);
    } else {
      conn.reply(m.chat, `${emoji} instalacion completa.\n\n${stdout}`, m);
    }
  });
};

handler.help = ['npm install'];
handler.tags = ['owner'];
handler.command = ['npm'];
handler.rowner = true;

export default handler;
