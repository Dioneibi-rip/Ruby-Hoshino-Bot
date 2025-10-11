let handler = async (m, { conn, text }) => {
  if (!m.isGroup) throw 'Este comando solo puede usarse en grupos.'

  if (!text) throw 'Debes escribir el número del bot que deseas establecer como principal.'

  let botJid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}

  if (global.db.data.chats[m.chat].primaryBot === botJid) {
    return conn.reply(m.chat, `✧ @${botJid.split`@`[0]} ya es el bot primario de este grupo.`, m, { mentions: [botJid] });
  }

  global.db.data.chats[m.chat].primaryBot = botJid

  let response = `✐ ¡Listo! Se ha establecido a *@${botJid.split('@')[0]}* como el único bot que responderá en este grupo.

> A partir de ahora, todos los comandos serán ejecutados por él.

> *Nota:* Si quieres que todos los bots vuelvan a responder, un administrador puede usar el comando \`resetbot\` (sin prefijo).`;

    await conn.sendMessage(m.chat, { 
        text: response, 
        mentions: [botJid] 
    }, { quoted: m });
}

handler.help = ['setprimary <número>']
handler.tags = ['owner', 'group']
handler.command = ['setprimary']
handler.admin = true
handler.group = true

export default handler