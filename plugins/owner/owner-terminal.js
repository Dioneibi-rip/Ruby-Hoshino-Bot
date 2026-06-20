const handler = async (m, { conn, text }) => {
  if (!text) return m.reply('⚠️ Ingresa el comando a ejecutar.\n\nEjemplo: `.$ git status`');
  
  const { exec } = await import('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  const blockedCommands = ['rm -rf', 'rm -r', 'dd if=', 'mkfs', 'shred'];
  
  if (blockedCommands.some(cmd => text.toLowerCase().includes(cmd))) {
    return m.reply('❌ Ese comando está bloqueado por seguridad.');
  }
  
  try {
    const { stdout, stderr } = await execPromise(text, { timeout: 10000 });
    const result = stdout || stderr || 'Comando ejecutado sin salida.';
    
    const output = result.length > 2000 
      ? result.substring(0, 2000) + '\n...(truncado)' 
      : result;
    
    conn.reply(m.chat, '```\n' + output + '\n```', m);
  } catch (error) {
    conn.reply(m.chat, '❌ Error:\n```\n' + error.message + '\n```', m);
  }
};

handler.help = ['$ <comando>'];
handler.tags = ['owner'];
handler.command = ['$'];
handler.rowner = true;

export default handler;