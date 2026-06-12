import { exec } from 'child_process';

let handler = async (m, { conn, text }) => {
  if (!text) {
    throw 'Debes ingresar el comando que deseas ejecutar en el servidor/terminal.';
  }

  m.reply('Ejecutando comando...');

  exec(text, (err, stdout, stderr) => {
    let response = '';
    if (err) {
      response += `Error:\n${err}`;
    }
    if (stderr) {
      response += `\nStderr:\n${stderr}`;
    }
    if (stdout) {
      response += `\nStdout:\n${stdout}`;
    }

    conn.reply(m.chat, response.trim() || 'Comando ejecutado sin salida.', m);
  });
};

handler.help = ['exec <comando>'];
handler.tags = ['owner'];
handler.command = ['ejecutar'];
handler.rowner = true;

export default handler;
