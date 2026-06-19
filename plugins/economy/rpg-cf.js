let handler = async (m, { conn, text, usedPrefix, command }) => {
  let [eleccion, cantidad] = text.trim().split(' ');

  if (!eleccion || !cantidad) {
    return m.reply(`${emoji} Por favor, elige *cara* o *cruz* y una cantidad de ${m.moneda} para apostar.\nEjemplo: *${usedPrefix + command} cara 5000*`);
  }

  eleccion = eleccion.toLowerCase();
  cantidad = parseInt(cantidad);

  if (!['cara', 'cruz'].includes(eleccion)) {
    return m.reply(`${emoji2} Elección no válida. Usa *cara* o *cruz*.\nEjemplo: *${usedPrefix + command} cara 5000*`);
  }

  if (isNaN(cantidad) || cantidad <= 0) {
    return m.reply(`${emoji2} Debes ingresar una cantidad válida mayor que cero.\nEjemplo: *${usedPrefix + command} cara 5000*`);
  }

  let user = global.db.getUser(m.sender);
  if (!user || user.coin < cantidad) {
    return m.reply(`${emoji2} No tienes suficientes ${m.moneda} para apostar. Tienes *${user.coin.toLocaleString()} ${m.moneda}*.`);
  }

  // Resultado aleatorio
  let resultado = Math.random() < 0.5 ? 'cara' : 'cruz';

  if (resultado === eleccion) {
    let ganancia = Math.floor(cantidad + Math.random() * cantidad * 1.25);
    user.coin += ganancia;

    return conn.reply(m.chat,
`「✿」La moneda ha caído en *${resultado.toUpperCase()}* y has ganado *¥${ganancia.toLocaleString()} ${m.moneda}*! 🍀
> Tu elección fue *${eleccion.toUpperCase()}*
✨ ¡La suerte estuvo de tu lado! ✨`, m);
  } else {
    let perdida = Math.floor(cantidad + Math.random() * cantidad * 1.15);
    user.coin -= perdida;

    return conn.reply(m.chat,
`🥀 La moneda cayó en *${resultado.toUpperCase()}* y perdiste *¥${perdida.toLocaleString()} ${m.moneda}*...
> Tú habías elegido *${eleccion.toUpperCase()}*
💔 ¡Sigue intentando, no te rindas!`, m);
  }
};

handler.help = ['cf <cara|cruz> <cantidad>']
handler.tags = ['economy']
handler.command = ['cf', 'suerte', 'caracruz']
handler.group = true
handler.register = true

export default handler;