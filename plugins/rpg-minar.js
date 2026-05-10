const handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender];
  if (!user) return;

  const tiempoMinar = 10 * 60 * 1000;
  const now = Date.now();

  if (now - (user.lastmiming || 0) < tiempoMinar) {
    const restante = msToTime((user.lastmiming + tiempoMinar) - now);
    return conn.reply(m.chat, `⛏️ Aún te recuperas del último minado.\n⏳ Espera *${restante}*.`, m);
  }

  const bonus = user.premium ? 1.25 : 1;
  const esEventoPositivo = Math.random() < (user.premium ? 0.86 : 0.78);
  const evento = esEventoPositivo ? pickRandom(eventosBuenos) : pickRandom(eventosMalos);
  const cambios = evento.cambios(bonus);

  user.coin = Math.max(0, (user.coin || 0) + cambios.coin);
  user.iron = Math.max(0, (user.iron || 0) + cambios.iron);
  user.gold = Math.max(0, (user.gold || 0) + cambios.gold);
  user.emerald = Math.max(0, (user.emerald || 0) + cambios.emerald);
  user.coal = Math.max(0, (user.coal || 0) + cambios.coal);
  user.stone = Math.max(0, (user.stone || 0) + cambios.stone);
  user.exp = (user.exp || 0) + cambios.exp;
  user.health = Math.max(0, (user.health || 100) - 10);
  user.pickaxedurability = Math.max(0, (user.pickaxedurability || 100) - 8);
  user.lastmiming = now;

  const resultado =
    `⛏️ *${evento.texto}*\n\n` +
    `✨ Exp: ${formato(cambios.exp)}\n` +
    `💸 ${m.moneda}: ${formato(cambios.coin)}\n` +
    `♦️ Esmeralda: ${formato(cambios.emerald)}\n` +
    `🔩 Hierro: ${formato(cambios.iron)}\n` +
    `🏅 Oro: ${formato(cambios.gold)}\n` +
    `🕋 Carbón: ${formato(cambios.coal)}\n` +
    `🪨 Piedra: ${formato(cambios.stone)}\n` +
    `👑 Multiplicador premium: x${bonus}`;

  await conn.sendFile(m.chat, 'https://files.catbox.moe/qfx5pn.jpg', 'minado.jpg', resultado, m);
  await m.react('⛏️');
};

handler.help = ['minar'];
handler.tags = ['economy'];
handler.command = ['minar', 'miming', 'mine'];
handler.register = true;
handler.group = true;

export default handler;

const eventosBuenos = [
  { texto: '✨ Encontraste una veta de minerales.', cambios: (b) => ({ exp: n(300, 700, b), coin: n(4000, 9000, b), emerald: n(4, 8, b), iron: n(35, 80, b), gold: n(20, 40, b), coal: n(35, 80, b), stone: n(250, 550, b) }) },
  { texto: '💰 Hallaste un cofre enterrado.', cambios: (b) => ({ exp: n(450, 900, b), coin: n(6500, 10000, b), emerald: n(6, 10, b), iron: n(45, 100, b), gold: n(25, 50, b), coal: n(40, 90, b), stone: n(300, 600, b) }) },
  { texto: '💎 Cueva antigua descubierta.', cambios: (b) => ({ exp: n(600, 1200, b), coin: n(9000, 11000, b), emerald: n(8, 14, b), iron: n(55, 110, b), gold: n(30, 60, b), coal: n(45, 100, b), stone: n(350, 700, b) }) },
];

const eventosMalos = [
  { texto: '💥 Pequeño derrumbe en la mina.', cambios: () => ({ exp: r(150, 320), coin: -r(1500, 3200), emerald: -r(0, 2), iron: -r(2, 8), gold: -r(1, 4), coal: -r(3, 10), stone: -r(20, 60) }) },
  { texto: '🥵 Te perdiste buscando la salida.', cambios: () => ({ exp: r(120, 260), coin: -r(1200, 2800), emerald: 0, iron: r(0, 4), gold: 0, coal: r(2, 8), stone: r(15, 50) }) },
];

function r(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function n(min, max, bonus) {
  return Math.floor(r(min, max) * bonus);
}

function formato(num) {
  return num >= 0 ? `+${num}` : `-${Math.abs(num)}`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  return `${minutes}m y ${seconds}s`;
}
