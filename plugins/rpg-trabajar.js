import { ensureJobFields, getJobData } from '../lib/rpg-jobs.js';

let cooldowns = {};

let handler = async (m, { conn, usedPrefix }) => {
  let user = global.db.data.users[m.sender];
  ensureJobFields(user);

  let job = getJobData(user);
  if (!job) {
    return conn.reply(m.chat, `💼 No tienes chamba todavía rey.\nUsa *${usedPrefix}trabajo elegir <trabajo>* para empezar a facturar.`, m);
  }

  let tiempo = 3 * 60; // 3 minutos
  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempo * 1000) {
    let tiempo2 = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempo * 1000 - Date.now()) / 1000));
    return conn.reply(m.chat, `✧ Ya chambeaste hace rato we, descansa la espalda. Vuelve en *${tiempo2}*.`, m);
  }

  let premiumBoost = user.premium ? 1.2 : 1;
  let successChance = (user.premium ? 0.88 : 0.82) + Math.min(0.08, (user.jobXp || 0) / 200000);
  let ok = Math.random() < successChance;
  let useGeneric = Math.random() < 0.35; 

  // --- LÓGICA DE BOLSA DE TRABAJO ---
  let jobBonus = 1;
  if (job.key === 'comerciante') jobBonus = 1.25; // Negociación pura, muy rentable
  if (job.key === 'chef') jobBonus = 1.20; // Excelente en work
  if (job.key === 'albañil') jobBonus = 1.10; // Buen rendimiento
  if (job.key === 'repartidor') jobBonus = 1.05; // Balanceado
  // ----------------------------------

  cooldowns[m.sender] = Date.now();
  let jobName = job.name.toUpperCase();
  let jobEmoji = job.emoji;

  if (ok) {
    let baseAmount = Math.floor(Math.random() * 3000 + 2000);
    let amount = Math.floor(baseAmount * job.workMultiplier * premiumBoost * jobBonus);
    let xpEarned = Math.floor(amount * 0.15);
    user.coin = (user.coin || 0) + amount;
    user.jobXp = (user.jobXp || 0) + xpEarned;

    let phraseList = useGeneric ? frasesGenericas.success : (frasesPorTrabajo[job.key]?.success || frasesGenericas.success);
    let phrase = pickRandom(phraseList);

    let texto = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐆𝐚𝐧𝐚𝐬𝐭𝐞: *${toNum(amount)}* ( *${amount}* ) ${m.moneda}\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐗𝐏: *+${xpEarned}*\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
    return conn.reply(m.chat, texto, m);
  }

  // Pérdidas (Comerciante y Basurero pierden menos por su estabilidad/aguante)
  let lossResist = (job.key === 'comerciante' || job.key === 'basurero') ? 0.7 : 1;
  let rawLoss = Math.floor((Math.random() * 400 + 200) * (user.premium ? 0.9 : 1) * lossResist);
  let loss = Math.min((user.coin || 0) + (user.bank || 0), rawLoss);
  
  let rest = loss;
  let fromCoin = Math.min(user.coin || 0, rest);
  user.coin = Math.max(0, (user.coin || 0) - fromCoin);
  rest -= fromCoin;
  user.bank = Math.max(0, (user.bank || 0) - rest);

  let phraseList = useGeneric ? frasesGenericas.fail : (frasesPorTrabajo[job.key]?.fail || frasesGenericas.fail);
  let phrase = pickRandom(phraseList);

  let textoLoss = `❪❨̶  ֶָ֢ ✻̸ ${phrase}\n\nㅤㅤ    ֶָ֢ ✻̸ ➪ 𝐏𝐞𝐫𝐝𝐢𝐬𝐭𝐞: *${toNum(loss)}* ( *${loss}* ) ${m.moneda}\n\nㅤㅤ ⬫   ͜ ۬ ︵࣪᷼⏜݊᷼✿⃘𐇽۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬𝇈ٜ࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬۬𑁍ٜ𐇽࣪࣪࣪࣪࣪۬۬࣪࣪࣪۬ 𝇈⃘۫ꥈ࣪࣪࣪࣪࣪࣪࣪࣪࣪۬۬۬࣪࣪࣪۬۬۬✿݊᷼⏜࣪᷼︵۬ ͜   ⬫`;
  return conn.reply(m.chat, textoLoss, m);
};

handler.help = ['work'];
handler.tags = ['economy'];
handler.command = ['chamba', 'trabajar', 'w', 'work', 'chambear'];
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

const frasesGenericas = {
  success: [
    "Le arreglaste el WiFi a una doña y te invitó a comer y te pagó",
    "Paseaste a un perro con rabia, sobreviviste y cobraste caro",
    "Te disfrazaste de tinaco Rotoplas en la plaza y la gente te dio monedas",
    "Vendiste fotos de tus patas en internet y un raro te depositó",
    "Enseñaste a tu abuela a usar WhatsApp sin mandar piolines y te dio domingo",
    "Participaste en un experimento médico dudoso, se te cayó un mechón de pelo pero facturaste",
    "Fuiste extra en una novela de Televisa, hiciste de árbol y cobraste el día",
    "Le hiciste un amarre a tu vecino por encargo y la brujería dejó ganancias",
    "Fuiste a aplaudir a un mitin político por un frutsi, una torta y un billete",
    "Lloraste en un funeral de un desconocido por encargo y te pagaron extra por el drama",
    "Te alquilaste como novio/a falso/a para una cena familiar y te forraste",
    "Desparasitaste a un gato callejero nivel jefe final y la veterinaria te premió",
    "Encontraste un billete flotando en una alcantarilla y lo pescaste con un chicle",
    "Cuidaste a los chamacos del diablo de tu tía y te pagó la terapia y el sueldo",
    "Le diste reset al módem de la empresa y te llamaron 'el hacker', te subieron el sueldo"
  ],
  fail: [
    "Fuiste a comprar tortillas, te distrajiste viendo un perro y perdiste el billete",
    "Te quedaste dormido en el camión, amaneciste en otra ciudad y gastaste todo en el regreso",
    "Compraste unos audífonos en el semáforo y resulta que eran de jabón, pura pérdida",
    "Te caíste en un bache gigante, se te rompió el pantalón y te descontaron por impresentable",
    "El cajero automático se tragó tu tarjeta, fuiste a pelear al banco y perdiste el día de chamba",
    "Le mandaste un sticker inapropiado al grupo del trabajo, te suspendieron sin goce de sueldo",
    "Quisiste hacer un tutorial de YouTube en la vida real, explotó el microondas y lo pagaste",
    "Apostaste tu quincena en una pelea de gallos imaginarios y te estafaron"
  ]
};

const frasesPorTrabajo = {
  albañil: {
    success: [
      "Levantaste un muro en tiempo récord usando cumbias de fondo para dar ritmo",
      "Hiciste una loza entera comiendo pura Coca con bolillo, superhumano, ganaste bono",
      "Descubriste un tesoro pirata escarbando para los cimientos, te lo quedaste",
      "Pegaste tabique todo el día sin plomada y te quedó perfecto, el Inge lloró de orgullo",
      "Te rifaste cargando de a 3 bultos de cemento en la espalda y te dieron aguinaldo adelantado",
      "Hiciste la mezcla tan perfecta que el patrón te nombró maestro albañil supremo",
      "Dormiste la siesta en unos costales de yeso y aun así fuiste el empleado del mes"
    ],
    fail: [
      "Pusiste la puerta de la casa al revés y te obligaron a pagarla de tu raya",
      "Se te cayó el celular a la revoltura de cemento fresca y quedó fosilizado",
      "Te picó una araña radioactiva en la arena, no te dio poderes, solo te sacó dinero pal hospital",
      "Acomodaste mal los andamios, se cayeron en dominó y pagaste los tabiques rotos"
    ]
  },
  basurero: {
    success: [
      "Encontraste un Nintendo 64 funcional entre los cartones y lo vendiste a un coleccionista",
      "Te colaste a la ruta de los barrios ricos y te llevaste propinas de puro empresario",
      "Dominaste el arte de lanzar bolsas al camión en movimiento a 20 km/h, premio a la eficiencia",
      "Salvaste a un gatito de la compactadora y la doña de la cuadra te premió con dinero",
      "Manejaste el camión por un callejón donde apenas cabía un alfiler sin rayarlo, te ascendieron",
      "Separaste tanto cobre de la chatarra que hoy pareces magnate en el fierro viejo"
    ],
    fail: [
      "Aplastaste tu propio lonche en la máquina compactadora, te quedaste con hambre y sin dinero",
      "Rompiste una bolsa negra llena de pintura vencida, manchaste todo y pagaste la lavandería",
      "Te persiguió el perro más loco de la cuadra, saltaste una barda y se te rompió la cartera",
      "Tiraste la basura de forma ecológica pero la multa por hacerlo fuera de horario te la comiste tú"
    ]
  },
  chef: {
    success: [
      "Se te cayó un pedazo de jamón, le hiciste presentación francesa y cobraste el triple",
      "Cocinaste con los ojos cerrados para impresionar a un crítico y te dejaron propinota",
      "Volteaste la tortilla en el aire haciendo un triple salto mortal, la cocina te aplaudió",
      "Inventaste el taco de sushi empanizado y te hiciste rico vendiendo la receta",
      "Salvaste un evento de 100 personas cocinando solo con papas y queso, cobraste horas extra",
      "Tu sazón hizo que un cliente recordara su infancia a lo Ratatouille, dejó un cheque en blanco",
      "Afilaste los cuchillos tan bien que cortaste la tensión en la cocina, bono de paz mundial"
    ],
    fail: [
      "Confundiste el azúcar con sal en el postre de bodas, te demandaron los novios",
      "Hiciste flamear la sartén tan alto que activaste los rociadores, inundaste todo y pagaste la pérdida",
      "El Gordon Ramsay región 4 entró a tu cocina, te gritó 'burro' y el susto te hizo tirar los platos",
      "Cortaste mal un filete Wagyu de mil dólares y el gerente te lo cobró en cuotas"
    ]
  },
  programador: {
    success: [
      "Reiniciaste el servidor y milagrosamente se arregló todo el proyecto, cobraste bono",
      "Pusiste un 'if (error) { no_error }' y el sistema funcionó, fuiste ascendido a Senior",
      "Vendiste un script de 3 líneas a una empresa grande y te forraste en cripto",
      "Hackeaste el microondas de la oficina para calentar tu pizza más rápido, tus colegas te pagaron por el hack",
      "Resolviste un bug que llevaba 5 años activo borrando un comentario, te dieron acciones",
      "Copiaste un código indio de YouTube de 2012 y salvó la producción del viernes"
    ],
    fail: [
      "Le diste 'Drop Table' a la base de datos principal sin querer, te quitaron todo tu finiquito",
      "Se derramó tu bebida energética G-Fuel sobre el rack de servidores, arruinaste medio millón de pesos",
      "Hiciste deploy en viernes a las 5pm, tiraste Amazon Web Services y pagaste multas",
      "Te hackearon a ti por usar '1234' como contraseña, te vaciaron tu cuenta de banco"
    ]
  },
  repartidor: {
    success: [
      "Hiciste 'caballito' con la moto para no tirar las bebidas, el cliente te dio 5 estrellas y 500 varos",
      "Entregaste el pedido en 5 minutos porque cortaste camino por el monte, propina de velocidad",
      "Subiste 15 pisos por las escaleras sin derramar el ramen, cobraste el bono fitness",
      "Un cliente famoso abrió la puerta, te tomaste una foto, la vendiste y ganaste",
      "Sorteaste tres marchas, dos baches y un choque, llegaste intacto y el cliente te dio en dólares"
    ],
    fail: [
      "Te robaron la llanta de la moto mientras tocabas el timbre, te tocó pagar grua y llanta",
      "Se te enredó el pedido en la cadena de la moto, entregaste puré de pizza y te cobraron el pedido",
      "Un perro bulldog te correteó 4 cuadras, tiraste el sushi caro y tuviste que pagarlo",
      "Te perdiste usando Google Maps, llegaste a otro estado y gastaste la ganancia en gasolina"
    ]
  },
  comerciante: {
    success: [
      "Le vendiste una funda de celular a un wey que ni siquiera tenía celular, nivel dios",
      "Convenciste a la señora que solo venía a 'ver' de comprarse media tienda, forraste la caja",
      "Remataste luces de navidad rotas en pleno junio y la gente te las arrebató",
      "Tus tácticas de regateo dejaron llorando al proveedor, maximizaste la ganancia",
      "Le cambiaste la etiqueta a los productos rezagados por 'Edición Limitada' y te hiciste rico",
      "Te pusiste a gritar en el mercado 'pásele güerita' y atraías a los gringos con dólares"
    ],
    fail: [
      "Hiciste el clásico error de dar cambio de 500 por un billete de 50, perdiste toda la ganancia",
      "Invertiste en un contenedor de mascarillas en pleno 2024, nadie compró y quebraste poquito",
      "Te estafaron pagándote con billetes de lotería falsos, te cuadró la caja en números rojos",
      "Se metió un pájaro al local, rompió tres jarrones finos intentando salir, puro gasto"
    ]
  }
};