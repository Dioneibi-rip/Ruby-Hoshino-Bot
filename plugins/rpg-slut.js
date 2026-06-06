import { ensureJobFields, getJobData } from '../lib/rpg-jobs.js';

let cooldowns = {};

let handler = async (m, { conn, usedPrefix }) => {
  let users = global.db.data.users;
  let senderId = m.sender;
  let user = users[senderId];
  ensureJobFields(user);

  let job = getJobData(user);
  if (!job) {
    return conn.reply(m.chat, `💼 Primero consigue trabajo con *#trabajo lista*. Tu oficio afecta el rendimiento en #slut.`, m);
  }

  let tiempo = 5 * 60; // 5 minutos
  if (cooldowns[senderId] && Date.now() - cooldowns[senderId] < tiempo * 1000) {
    let tiempo2 = segundosAHMS(Math.ceil((cooldowns[senderId] + tiempo * 1000 - Date.now()) / 1000));
    return conn.reply(m.chat, `🥵 Ya te venís usando mucho eso we, necesitas recuperar el aliento. Vuelve en *${tiempo2}*.`, m);
  }

  let userIds = Object.keys(users).filter(u => u !== senderId && !users[u].banned);
  let targetId = userIds.length > 0 ? userIds[Math.floor(Math.random() * userIds.length)] : senderId;

  let prof = Math.min(0.08, (user.jobXp || 0) / 300000);
  
  // --- LÓGICA DE BOLSA DE TRABAJO EN SLUT ---
  let slutBonus = 1; let slutLossResist = 1; let slutWinChance = 0;
  if (job.key === 'chef') { slutBonus = 1.15; slutWinChance = 0.05; } // Excelente socialmente
  if (job.key === 'repartidor') { slutBonus = 1.05; } // Balanceado
  if (job.key === 'basurero') { slutBonus = 0.85; slutLossResist = 0.75; } // Menor ganancia, pero resistente a pérdidas
  // ------------------------------------------

  let winChance = Math.min(0.87, 0.64 + (user.premium ? 0.06 : 0) + prof + slutWinChance);
  let didWin = Math.random() < winChance;
  let useGeneric = Math.random() < 0.35; 

  cooldowns[senderId] = Date.now();
  let jobName = job.name.toUpperCase();
  let jobEmoji = job.emoji;
  let mentionStr = '@' + targetId.split('@')[0];

  if (didWin) {
    let baseAmount = Math.floor(Math.random() * 3500 + 2200);
    let amount = Math.floor(baseAmount * job.slutMultiplier * (user.premium ? 1.2 : 1) * slutBonus);
    user.coin = (user.coin || 0) + amount;

    let phraseList = useGeneric ? frasesSlutGenericas.success : (frasesSlutPorTrabajo[job.key]?.success || frasesSlutGenericas.success);
    // REEMPLAZO MAGICO DE {user}
    let phrase = pickRandom(phraseList).replace(/\{user\}/g, mentionStr);

    let texto = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐏𝐚𝐠𝐨: *${toNum(amount)}* ( *${amount}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
    return conn.sendMessage(m.chat, { text: texto, contextInfo: { mentionedJid: [targetId] } }, { quoted: m });
  }

  let amountLoss = Math.floor((Math.random() * 700 + 300) * job.slutLossMultiplier * slutLossResist);
  let loss = Math.min((user.coin || 0) + (user.bank || 0), amountLoss);
  let rest = loss;
  let fromCoin = Math.min(user.coin || 0, rest);
  user.coin = Math.max(0, (user.coin || 0) - fromCoin);
  rest -= fromCoin;
  user.bank = Math.max(0, (user.bank || 0) - rest);

  let phraseList = useGeneric ? frasesSlutGenericas.fail : (frasesSlutPorTrabajo[job.key]?.fail || frasesSlutGenericas.fail);
  let phrase = pickRandom(phraseList).replace(/\{user\}/g, mentionStr);

  let textoLoss = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐏𝐞𝐫𝐝𝐢𝐬𝐭𝐞: *${toNum(loss)}* ( *${loss}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜  ⬫`;
  return conn.sendMessage(m.chat, { text: textoLoss, contextInfo: { mentionedJid: [targetId] } }, { quoted: m });
};

handler.help = ['slut'];
handler.tags = ['economy'];
handler.command = ['slut', 'prostituirse'];
handler.group = true;
handler.register = true;

export default handler;

function toNum(number) {
  if (number >= 1000 && number < 1000000) return (number / 1000).toFixed(1) + 'k';
  if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M';
  return number.toString();
}

function segundosAHMS(segundos) {
  let minutos = Math.floor((segundos % 3600) / 60);
  let segundosRestantes = segundos % 60;
  return `${minutos} minutos y ${segundosRestantes} segundos`;
}

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())];
}

const frasesSlutGenericas = {
  success: [
    "Le agarraste la onda a {user} y lo dejaste temblando de placer.",
    "Le diste una nalgada a {user} que gritó 'ay mami/papi' y te premió con dinero extra.",
    "Le hiciste el gawk gawk 3000 sin piedad a {user}, quedó tan mudo que solo te depositó.",
    "Usaste las dos manos y la boca a la vez, a {user} le voló la mente y facturaste doble.",
    "Le rebotaste encima a {user} como lavadora en pleno centrifugado y te ganaste su respeto.",
    "Le hiciste un baile privado súper sucio a {user} y literal te llovieron los billetes.",
    "Te pusiste en 4 frente a {user} y no dudó en meterte propina pesada en el short.",
    "Te disfrazaste de Furro a petición de {user} y aunque pasaste calor, cobraste tarifa premium.",
    "Jugaste al doctor con {user}, le revisaste la próstata y te dio un bono de salud.",
    "Amarraste a {user} a la cama, le dejaste ahí 3 horas y te pagó más por la 'experiencia límite'.",
    "Te metiste al jacuzzi con {user}, se prendieron y el agua casi hierve de tanta pasión.",
    "Tus gemidos despertaron a todo el edificio de {user}, pero a ti te valió porque cobraste el triple.",
    "Le hiciste el salto del tigre desde el clóset a {user} y te pagó por el show acrobático.",
    "Lloraste a media faena, a {user} le dio tanta culpa que te pagó la terapia y la hora completa."
  ],
  fail: [
    "Le mordiste donde no debías a {user} sin querer, te demandó y pagaste sus gastos médicos.",
    "Olías súper mal, {user} te vomitó encima del asco, canceló el servicio y gastaste en tintorería.",
    "Te resbalaste de la emoción, rompiste la mesa de cristal de {user} y te tocó pagarla nuevecita.",
    "No te bañaste, {user} te canceló y encima le tuviste que dar una indemnización por el susto nasal.",
    "Te cayó la policía por ruidosos, {user} se escondió y tú soltaste plata para que te soltaran.",
    "Le confesaste tu amor a {user} en medio acto, se re asustó, huyó y no te pagó el motel.",
    "Se te acalambró la pierna a la mitad, {user} se enojó, te fuiste a urgencias y perdiste lana.",
    "Arruinaste tu mejor lencería con aceite barato, a {user} ni le gustó y perdiste tu inversión."
  ]
};

const frasesSlutPorTrabajo = {
  albañil: {
    success: [
      "Llegaste marcado de cemento y {user} se prendió por tus músculos de obrero/a.",
      "Le diste como buen maestro de obra a {user}: a puros martillazos y gritando albures finos.",
      "Sudado y con la pala, le cumpliste a {user} su fantasía de 'clase obrera rebelde'.",
      "Armaste un rapidín con {user} arriba de un andamio a 15 metros, cobraste riesgo laboral.",
      "Usaste el nivelador para asegurarte que a {user} le estabas dando derechito y te premió.",
      "Te quitaste el chaleco reflejante al ritmo de reggaeton y {user} perdió la cabeza por ti.",
      "Empotraste a {user} tan fuerte contra el muro de tabique que tumbaste la barda, pero valió la pena.",
      "Rellenaste las 'grietas' de {user} con tu mezcla especial y te pagó con transferencia inmediata."
    ],
    fail: [
      "Tenías cal en las manos, le raspaste todas las partes nobles a {user} y le pagaste crema curativa.",
      "El chaleco reflejante que llevabas cortó todo el mood de {user}, te corrió a patadas.",
      "Te cayó mezcla fresca en un lugar hiper sensible, {user} se burló y te fuiste llorando al médico.",
      "Llevaste un martillo a la cama por error, asustaste a {user} y terminaste rompiendo un espejo."
    ]
  },
  basurero: {
    success: [
      "Te disfrazaste de mapache callejero y le cumpliste a {user} su fantasía más bizarra y salvaje.",
      "Tu actitud pesada de barrio le fascinó a {user} y cerraron el trato en la parte de atrás del camión.",
      "Le hiciste el 'reciclaje profundo' a {user}, tanto que te dejó hasta los ahorros del banco.",
      "Le dejaste las tuberías de {user} más limpias que las calles de la colonia tras tu turno.",
      "Compactaste a {user} contra la pared del cuarto con tanta fuerza que te pagó tarifa triple.",
      "Hiciste de su cuerpo tu propio basurero y a {user} extrañamente le pareció fascinante."
    ],
    fail: [
      "Olías a lixiviado de 3 días, {user} no aguantó las náuseas, te corrió y gastaste en perfumería.",
      "Una bolsa de basura rota que llevabas encima arruinó la cama de {user}, pagaste lavandería.",
      "Por tu trabajo llevaste pulgas al encuentro, {user} se infectó y tú pagaste el exterminador."
    ]
  },
  chef: {
    success: [
      "Untaste crema batida en el cuerpo de {user} y te lo comiste como el postre más caro del menú.",
      "Le serviste una cena afrodisíaca sobre tu cuerpo a {user}, quien devoró todo y dejó propina.",
      "Usaste el rodillo de amasar para darle unos golpecitos a {user} que le encantaron muchísimo.",
      "Demostraste tus habilidades probando caldos directamente con {user} y se rindió a tus pies.",
      "Le hiciste un 'glaseado' especial a {user} y te dio calificación Michelin en la cama.",
      "Lo hicieron juntos sin ropa cerca de la estufa, {user} estaba hirviendo de pasión."
    ],
    fail: [
      "Te equivocaste de frasco y usaste salsa habanera en las partes de {user}, se fue gritando al doctor.",
      "Se te quemó la cena romántica previa con {user}, activaste los aspersores y pagaste los daños del hotel.",
      "Olías tanto a ajo picado que {user} vomitó al besarte y te demandó por daños emocionales.",
      "Mientras cortabas verduras de exhibición con {user}, te rebanaste un dedo por querer lucirte."
    ]
  },
  programador: {
    success: [
      "Le montaste un show en VR espectacular a {user} y te pagó la sesión en puros Bitcoins.",
      "Hiciste el juego de rol de 'Hackeando tu corazón', a {user} le derretiste el firewall al instante.",
      "Tecleaste comandos rápido mientras le dabas placer, {user} cumplió su fantasía nerd contigo.",
      "Vendiste el agua donde lavaste tu teclado mecánico y {user} pagó cientos de dólares por ella.",
      "Ejecutaste el script 'placer_infinito.exe' con {user} y no dejaste que parara en toda la noche.",
      "Vestiste de colegiala de anime, abriste stream privado para {user} y la donación fue gigante."
    ],
    fail: [
      "Tu mamá entró a tu cuarto en pleno show con {user}, cerraste de golpe y devolviste el dinero.",
      "Te dio síndrome del túnel carpiano acariciando a {user}, no terminaste y pagaste fisioterapia.",
      "En medio del acto con {user} te hackearon la billetera cripto, por distraerte perdiste tus ahorros.",
      "Hiciste un corto circuito con tus juguetes USB sincronizados y {user} te cobró la PC que le quemaste."
    ]
  },
  repartidor: {
    success: [
      "{user} te pidió 'el paquete completo' por la app secreta y cobraste muchísimos extras jugosos.",
      "Usaste tu mochila térmica para calentar los ánimos, {user} nunca había sudado tanto de placer.",
      "Hiciste tu famoso 'delivery de salchicha' con {user} y te calificó con 5 súper estrellas.",
      "Te aventaste un rapidín en las escaleras del depa con {user} antes de que llegara el conserje.",
      "Llegaste empapado en sudor y lluvia, {user} se prendió impresionantemente y te jaló pa' adentro.",
      "Aceleraste en la cama con {user} como cuando aceleras para cruzar el semáforo en amarillo."
    ],
    fail: [
      "El conserje los descubrió a {user} y a ti en plena acción en el pasillo, te pusieron multota.",
      "Dejaste tu moto afuera prendida, entraste al cuarto con {user} y a los 5 minutos te la robaron.",
      "{user} te amarró a la cama, pero resultó ser trampa: se robó la comida, tu cartera y tu moto.",
      "Te derramaste una sopa ardiendo encima por quitarte la ropa rápido, {user} se rió y pagaste curación."
    ]
  },
  comerciante: {
    success: [
      "Regateaste tu propio cuerpo con maestría, a {user} le sacaste una tarifa exorbitante y redonda.",
      "Con puro verbo lavacerebros convenciste a {user} de pagarte hasta por respirar cerca tuyo.",
      "Ofreciste una promo de 'Pague 1 lleve 2' incluyendo a tu compa, a {user} le encantó y facturaste.",
      "Después del acto, le vendiste tu ropa interior usada a {user} al triple de lo que te costó.",
      "Aplicaste técnicas de marketing emocional en la cama, ahora {user} es tu cliente VIP fidelizado.",
      "Obligaste a {user} a firmar un contrato mensual de cariño y ya te aseguró ingresos fijos."
    ],
    fail: [
      "La terminal falló por falta de red, {user} aprovechó, fingió ir al baño y huyó sin pagarte nada.",
      "Invertiste en juguetes eróticos piratas para impresionar a {user}, se rompieron y pagaste la urgencia médica.",
      "Le vendiste una experiencia VIP a {user} pero fue pésima, te quemó en Facebook y perdiste ventas.",
      "{user} te pagó con transferencia falsa, no checaste bien y entregaste el 'producto' gratis."
    ]
  }
};