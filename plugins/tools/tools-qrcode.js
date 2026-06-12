import fetch from 'node-fetch';

const handler = async (m, { args, usedPrefix, command, conn }) => {
  if (!args[0]) {
    return m.reply(`✳️ *Uso correcto del comando:*\n${usedPrefix + command} <texto o URL>\n\n🧩 Ejemplo:\n${usedPrefix + command} https://wa.me`);
  }

  try {
    const texto = encodeURIComponent(args.join(" "));
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${texto}`;

    await conn.sendMessage(m.chat, {
      image: { url: qrURL },
      caption: `✅ *Código QR generado correctamente*\n📎 *Texto:* ${args.join(" ")}`
    }, { quoted: m });
  } catch (e) {
    console.error(e);
    m.reply('❌ Ocurrió un error al generar el QR.');
  }
};

handler.command = ['qrcode'];
handler.register = true;
export default handler;
