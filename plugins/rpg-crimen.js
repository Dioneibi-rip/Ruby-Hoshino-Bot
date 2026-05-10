import { ensureJobFields, getJobData } from '../lib/rpg-jobs.js';

let cooldowns = {};
let jail = {};

let handler = async (m, { conn, usedPrefix }) => {
  let users = global.db.data.users;
  let senderId = m.sender;
  let user = users[senderId];
  ensureJobFields(user);

  let job = getJobData(user);
  if (!job) {
    return conn.reply(m.chat, `💼 No tienes trabajo. Busca uno con *${usedPrefix}trabajo elegir <trabajo>* para desbloquear #crime.`, m);
  }

  let cooldown = 8 * 60; 
  let jailCooldown = 16 * 60; 
  let now = Date.now();

  if (jail[senderId] && now < jail[senderId]) {
    let remaining = segundosAHMS(Math.ceil((jail[senderId] - now) / 1000));
    return conn.reply(m.chat, `🚔 Sigues en la cárcel we. Te faltan *${remaining}* para ver la luz del sol.`, m);
  }

  if (cooldowns[senderId] && now - cooldowns[senderId] < cooldown * 1000) {
    let remaining = segundosAHMS(Math.ceil((cooldowns[senderId] + cooldown * 1000 - now) / 1000));
    return conn.reply(m.chat, `🚨 La zona está muy caliente loco, espera *${remaining}* pa no caer preso.`, m);
  }

  let skill = Math.min(0.07, (user.jobXp || 0) / 300000);
  
  // --- LÓGICA DE BOLSA DE TRABAJO EN CRIMEN ---
  let crimeBonus = 1; let jailNerf = 0; let lossResist = 1;
  if (job.key === 'programador') { crimeBonus = 1.25; jailNerf = 0.10; } // Muy fuerte en crimen técnico
  if (job.key === 'albañil') { crimeBonus = 1.10; jailNerf = 0.05; } // Buen rendimiento oportunista
  if (job.key === 'repartidor') { crimeBonus = 1.05; jailNerf = 0.02; } // Balanceado
  if (job.key === 'basurero') { lossResist = 0.8; } // Mejor aguante en pérdidas
  // ---------------------------------------------

  let baseJailChance = Math.max(0.04, (user.premium ? 0.09 : 0.13) - (job.crimeSuccessBonus * 0.4) - (skill * 0.5));
  let jailChance = Math.max(0.01, baseJailChance - jailNerf); 
  let successChance = Math.min(0.86, (user.premium ? 0.6 : 0.5) + job.crimeSuccessBonus + skill + jailNerf);
  
  let roll = Math.random();
  let useGeneric = Math.random() < 0.35; 

  let jobName = job.name.toUpperCase();
  let jobEmoji = job.emoji;

  if (roll < jailChance) {
    jail[senderId] = now + (jailCooldown * 1000);
    cooldowns[senderId] = now;

    let phraseList = useGeneric ? frasesCrimenGenericas.jail : (frasesCrimenPorTrabajo[job.key]?.jail || frasesCrimenGenericas.jail);
    let phrase = pickRandom(phraseList);

    let textoJail = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐂𝐨𝐧𝐝𝐞𝐧𝐚: *16 Minutos Preso*\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
    return conn.reply(m.chat, textoJail, m);
  }

  if (roll < jailChance + successChance) {
    let baseAmount = Math.floor(Math.random() * 4500 + 3000);
    let amount = Math.floor(baseAmount * job.crimeRewardMultiplier * (user.premium ? 1.18 : 1) * crimeBonus);
    user.coin = (user.coin || 0) + amount;
    cooldowns[senderId] = now;

    let phraseList = useGeneric ? frasesCrimenGenericas.success : (frasesCrimenPorTrabajo[job.key]?.success || frasesCrimenGenericas.success);
    let phrase = pickRandom(phraseList);

    let texto = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐁𝐨𝐭𝐢́𝐧: *${toNum(amount)}* ( *${amount}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
    return conn.reply(m.chat, texto, m);
  }

  let rawLossAmount = Math.floor((Math.random() * 1000 + 500) * (user.premium ? 0.85 : 1) * lossResist);
  let loss = Math.min(Math.floor((user.coin || 0) * 0.55), rawLossAmount);
  user.coin = Math.max(0, (user.coin || 0) - loss);
  cooldowns[senderId] = now;

  let phraseList = useGeneric ? frasesCrimenGenericas.fail : (frasesCrimenPorTrabajo[job.key]?.fail || frasesCrimenGenericas.fail);
  let phrase = pickRandom(phraseList);

  let textoLoss = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐏𝐞𝐫𝐝𝐢𝐬𝐭𝐞: *${toNum(loss)}* ( *${loss}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
  return conn.reply(m.chat, textoLoss, m);
};

handler.help = ['crimen'];
handler.tags = ['economy'];
handler.command = ['crimen', 'crime'];
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

const frasesCrimenGenericas = {
  success: [
    "Le metiste el pie a un mirrey, se cayó y le volaste el rolex",
    "Te disfrazaste de cajero del Oxxo, te pagaron la luz y te largaste con el efectivo",
    "Le sacaste la cartera a un fresa con la técnica de los dos dedos, fino papá",
    "Le vendiste la torre latinoamericana a un turista gringo, te depositó y huiste",
    "Secuestraste al perro de tu vecino odioso y te pagó un rescate millonario",
    "Fingiste ser inspector del SAT, asustaste al de la tiendita y te dio mordida",
    "Entraste a una boda ajena, te robaste todos los sobres de regalo y te diste a la fuga",
    "Extorsionaste a tu profe de matemáticas con fotos vergonzosas y cobraste cuota",
    "Le tumbaste los rines a un carro deportivo estacionado en la esquina en menos de un minuto",
    "Le hiciste creer a tu compa que metiste su dinero en Bitcoin y te lo clavaste tú"
  ],
  fail: [
    "Intentaste robarle a la abuelita del barrio y toda la pandilla te cayó encima quitándote la lana",
    "Te pusiste máscara de Spiderman para asaltar, te enredaste y la víctima te robó a ti",
    "Hackeaste el banco para robarte un millón y por error te debitaste todo tu saldo",
    "Un cholo te quitó tus tenis y encima le tuviste que dar el dinero que traías",
    "Fuiste a comprar ganzúas carísimas por Amazon y te llegaron cepillos de dientes (estafa)",
    "Fingiste un choque para extorsionar, pero chocaste tu auto de verdad y salió contraproducente"
  ],
  jail: [
    "Te atoraste en los ductos de ventilación del banco nivel Misión Imposible, te sacaron los tombos",
    "Robaste el carro equivocado (era del jefe de policía) y te mandaron derechito a la celda",
    "Te subiste a asaltar la combi, pero venían puros militares de civil... rip tu libertad",
    "Subiste tu atraco a TikTok para hacerte viral, la fiscalía lo vio y te fueron a buscar",
    "Dejaste tu INE tirada en la escena del crimen, la jura no tardó ni media hora en pescarte"
  ]
};

const frasesCrimenPorTrabajo = {
  albañil: {
    success: [
      "Te llevaste una revolvedora amarrada en la bici y la vendiste por piezas",
      "Escondiste las herramientas de oro del arquitecto y pediste rescate por ellas",
      "Te robaste toda la instalación eléctrica de una cuadra, sacaste harto cobre puro",
      "Cobraste adelanto para construir una barda y te mudaste de ciudad con la lana",
      "Clonaste la tarjeta del ingeniero usando una cuchara y un ladrillo (no sabemos cómo, pero funcionó)"
    ],
    fail: [
      "Te cayó un bulto de cemento en el pie mientras lo robabas, gastaste la plata en doctores",
      "La pandilla del barrio de enfrente te robó el cobre que tú acababas de robar",
      "Extorsionaste a la constructora equivocada y te cobraron cuota de piso a ti"
    ],
    jail: [
      "Intentaste robarte la retroexcavadora en pleno día, no sabías manejarla y chocaste con una patrulla",
      "El dueño te agarró infraganti metiendo inodoros nuevos a tu mochila (era gigante la mochila)",
      "Un dron de vigilancia te grabó saqueando la obra y llegó un operativo por ti"
    ]
  },
  basurero: {
    success: [
      "Secuestraste bolsas de basura de millonarios y vendiste su información privada carísima",
      "Te metiste a una subestación fingiendo que recogías escombros y te robaste medio transformador",
      "Le cobraste peaje a todos los carros que querían pasar por la calle que tú cerraste 'limpiando'",
      "Vendiste partes del camión de basura por refacciones mientras andabas en la ruta",
      "Te adueñaste de un lote baldío llenándolo de basura y luego cobraste para limpiarlo"
    ],
    fail: [
      "Trataste de robarle a un pepenador legendario, te agarró a batazos y perdiste tu dinero",
      "Un gato callejero furioso defendió su basurero, te rasguñó todo y pagaste vacunas carísimas",
      "Te estafaron cobrándote el doble por permiso de reciclaje falso en el mercado negro"
    ],
    jail: [
      "El camión de la basura tenía GPS y reportaron que te lo llevaste a vender a la frontera",
      "Te cacharon tirando desechos tóxicos donde no era para cobrarle por debajo del agua a una empresa",
      "Encontraron tu bodega llena de tapas de alcantarilla robadas y te cayeron las fuerzas especiales"
    ]
  },
  chef: {
    success: [
      "Robaste la receta secreta del coronel y se la vendiste a la competencia por millones",
      "Emborrachaste a un cliente VIP, le clonaste las tres Amex negras y facturaste duro",
      "Te robaste el inventario entero de azafrán y caviar, compraste una isla con eso",
      "Creaste un restaurante fantasma en Uber Eats, la gente pagaba y tú solo mandabas cajas vacías",
      "Pusiste laxante en la comida del restaurante rival, se fueron a la quiebra y tú absorbiste sus clientes"
    ],
    fail: [
      "Extorsionaste a un crítico culinario, pero mandó golpeadores a destruirte la cocina y te costó un ojo",
      "Tú mismo te intoxicaste probando tu sopa envenenada que iba para el gerente, fuiste al hospital",
      "Gastaste los fondos robados en trufas ilegales que resultaron ser simples piedras pintadas"
    ],
    jail: [
      "La policía te descubrió cocinando algo azul que definitivamente no era comida",
      "Trataste de envenenar a un político que fue a comer y sus guardaespaldas te arrestaron al instante",
      "El SAT rastreó el lavado de dinero que hacías con el puesto de hot dogs falso y te torcieron"
    ]
  },
  programador: {
    success: [
      "Hackeaste las cámaras del tráfico, las borraste todas y le cobraste a la mafia por el servicio",
      "Secuestraste el sistema informático de Televisa y pusiste memes hasta que te depositaron en Bitcoin",
      "Desviaste un centavo de cada transacción nacional hacia tu cuenta bancaria y te hiciste rico",
      "Programaste un bot que compra boletos de Ticketmaster en milisegundos y los revendiste carísimos",
      "Creaste una estafa piramidal con un token crypto que tenía nombre de perrito y huiste con el liquidity pool"
    ],
    fail: [
      "Trataste de hackear al Cártel por creer que era fácil, te rastrearon y tuviste que pagarles para seguir vivo",
      "Te cayó un virus a ti mientras programabas el tuyo, te robaron tus contraseñas y vaciaron tu banco",
      "Compraste servidores en la dark web pero era un honeypot de estafadores y perdiste la inversión"
    ],
    jail: [
      "Dejaste tu cuenta de Spotify abierta en el servidor hackeado del banco y el FBI te identificó",
      "Te cayó la SWAT por el techo porque se te olvidó encender tu VPN para tu súper hackeo maestro",
      "Te creíste Anonymous y tiraste la página de gobierno, a la hora ya estabas rodeado de patrullas"
    ]
  },
  repartidor: {
    success: [
      "Interceptaste un camión de Amazon blindado, lo abriste con un láser y sacaste pura tecnología",
      "Te robaste la motocicleta del repartidor rival para dominar el monopolio de las pizzas",
      "Falsificaste 50 entregas de iPhone, te quedaste con todos y los vendiste en la Frikiplaza",
      "Le entregaste el paquete equivocado al jefe de la mafia y encima le cobraste rescate para darle el real",
      "Fingiste que te chocaron, hiciste todo un drama de Óscar, cobraste seguro y la víctima te dio mil pesos"
    ],
    fail: [
      "Te metiste a asaltar usando tu mochila de Didi Food, pero te asaltaron a ti en la esquina",
      "Trataste de robar un paquete pero dentro había un enjambre de abejas agresivas, fuiste al hospital",
      "Chocaste tu moto a propósito por el seguro de vida falso, pero no pegó el trámite y pagaste tú"
    ],
    jail: [
      "Toda la ciudad te vio robarte a un niño en la caja de la moto (no cabía, la caja estaba abierta)",
      "Te cacharon metiendo sustancias ilegales dentro de los bolillos de las tortas a domicilio",
      "Atropellaste a una patrulla mientras huías de un asalto y no tuviste escapatoria"
    ]
  },
  comerciante: {
    success: [
      "Vendiste el Ángel de la Independencia a un multimillonario japonés diciendo que eras el dueño de México",
      "Importaste clones exactos de iPhone, los vendiste como originales en tienda formal y desapareciste",
      "Creaste una pirámide Ponzi tan perfecta que hasta los políticos invirtieron y te pelaste con todo",
      "Aseguraste tu tienda por millones, la incendiaste tú mismo y cobraste el cheque limpio",
      "Falsificaste firmas de un testamento millonario y ahora eres dueño de 3 hoteles"
    ],
    fail: [
      "Le intentaste hacer fraude al cartel vendiéndole mercancía mala, te torturaron y te dejaron pobre",
      "Contrataste golpeadores para destruir el negocio de enfrente pero se equivocaron y destruyeron el tuyo",
      "Un hacker internacional (probablemente un programador del bot) te vació tus cuentas en las Bahamas"
    ],
    jail: [
      "Te atraparon intentando vender billetes falsos pintados a mano (y te quedaron bien feos)",
      "La Profeco te denunció ante tribunales por vender agua del grifo como agua bendita importada de Marte",
      "El gobierno intervino tus cuentas bancarias y encontró la bóveda con el lavado de dinero de 10 años"
    ]
  }
};