const handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!text) return conn.reply(m.chat, `🍬 Usa de esta forma: *${usedPrefix}calcular [tipo] [@usuario | nombre]*\n\nEjemplos:\n> ${usedPrefix}calcular gay @usuario\n> ${usedPrefix}calcular puta Juan`, m);

  let [tipo, ...rest] = text.split(" ");
  if (!tipo) return m.reply(`🍭 Debes poner el tipo que quieres calcular.\nEjemplo: *${usedPrefix}calcular gay @usuario*`);
  let nombre = rest.join(" ");
  if (!nombre) return m.reply(`🍭 Debes mencionar a alguien o escribir un nombre.\nEjemplo: *${usedPrefix}calcular ${tipo} Juan*`);

  const percentages = (500).getRandom();
  let emoji = '';
  let description = '';

  switch (tipo.toLowerCase()) {
    case 'gay':
      emoji = '🏳️‍🌈';
      if (percentages < 50) {
        description = `💙 Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* Gay ${emoji}\n> ✰ Eso es bajo, ¡Tu eres Joto, no Gay!`;
      } else if (percentages > 100) {
        description = `💜 Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* Gay ${emoji}\n> ✰ ¡Incluso más gay de lo que pensábamos!`;
      } else {
        description = `🖤 Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* Gay ${emoji}\n> ✰ Lo tuyo, lo tuyo es que eres Gay.`;
      }
      break;
    case 'lesbiana':
      emoji = '🏳️‍🌈';
      description = `💗 Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* ${tipo} ${emoji}\n> ✰ Mantén el amor floreciendo!`;
      break;
    case 'pajero':
    case 'pajera':
      emoji = '😏💦';
      description = `💞 Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* ${tipo} ${emoji}\n> ✰ Mantén el buen trabajo (en solitario).`;
      break;
    case 'puto':
    case 'puta':
      emoji = '🔥🥵';
      description = `😺 Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* ${tipo} ${emoji}\n> ✰ Mantén ese encanto ardiente!`;
      break;
    case 'manco':
    case 'manca':
      emoji = '💩';
      description = `🥷 Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* ${tipo} ${emoji}\n> ✰ Mantén esa actitud valiente!`;
      break;
    case 'rata':
      emoji = '🐁';
      description = `👑 Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* ${tipo} ${emoji}\n> ✰ Come queso con responsabilidad!`;
      break;
    case 'prostituto':
    case 'prostituta':
      emoji = '🫦👅';
      description = `✨️ Los cálculos han arrojado que ${nombre.toUpperCase()} es *${percentages}%* ${tipo} ${emoji}\n> ✰ Siempre es hora de negocios!`;
      break;
    default:
      return m.reply(`🍭 Tipo inválido.\nOpciones válidas: gay, lesbiana, pajero/pajera, puto/puta, manco/manca, rata, prostituto/prostituta`);
  }

  const responses = [
    "El universo ha hablado.",
    "Los científicos lo confirman.",
    "¡Sorpresa!"
  ];
  const response = responses[Math.floor(Math.random() * responses.length)];

  const cal = `💫 *CALCULADORA*\n\n${description}\n\n➤ ${response}`.trim();

  async function loading() {
    var hawemod = [
      "《 █▒▒▒▒▒▒▒▒▒▒▒》10%",
      "《 ████▒▒▒▒▒▒▒▒》30%",
      "《 ███████▒▒▒▒▒》50%",
      "《 ██████████▒▒》80%",
      "《 ████████████》100%"
    ];
    let { key } = await conn.sendMessage(m.chat, { text: `🤍 ¡Calculando Porcentaje!`, mentions: conn.parseMention(cal) }, { quoted: fkontak });
    for (let i = 0; i < hawemod.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await conn.sendMessage(m.chat, { text: hawemod[i], edit: key, mentions: conn.parseMention(cal) }, { quoted: fkontak });
    }
    await conn.sendMessage(m.chat, { text: cal, edit: key, mentions: conn.parseMention(cal) }, { quoted: fkontak });
  }
  loading();
};

handler.help = ['calcular <tipo> <@tag|nombre>'];
handler.tags = ['fun'];
handler.register = true;
handler.group = true;
handler.command = ['calcular'];

export default handler;
