let cooldowns = {};

const handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender];
    if (!user.coin) user.coin = 0;
    if (!user.bank) user.bank = 0;

    const premiumBenefit = user.premium ? 1.25 : 1.0;
    const cooldown = 3 * 60 * 1000;

    if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < cooldown) {
        const remaining = segundosAHMS(Math.ceil((cooldowns[m.sender] + cooldown - Date.now()) / 1000));
        return conn.reply(m.chat, `☕ Hace mucho frío... Tómate un descanso y un chocolate caliente. Vuelve en *${remaining}*.`, m);
    }

    const winChance = 0.85;
    const didWin = Math.random() < winChance;

    if (didWin) {
        const amount = Math.floor((Math.random() * 4000 + 1000) * premiumBenefit);
        user.coin += amount;
        const work = pickRandom(trabajosBuenos);
        await conn.reply(m.chat, `${work} y te llevaste *${m.moneda} ${amount.toLocaleString()}*.\n\n*💰 Cartera:* ${m.moneda} ${user.coin.toLocaleString()} | *🏦 Banco:* ${m.moneda} ${user.bank.toLocaleString()}`, m);
    } else {
        const amount = Math.floor(Math.random() * 3000 + 500);
        let total = user.coin + user.bank;
        let loss = Math.min(total, amount);

        if (user.coin >= loss) {
            user.coin -= loss;
        } else {
            let resto = loss - user.coin;
            user.coin = 0;
            user.bank = Math.max(0, user.bank - resto);
        }

        const work = pickRandom(trabajosMalos);
        await conn.reply(m.chat, `${work} y en el proceso perdiste *${m.moneda} ${loss.toLocaleString()}*.\n\n*💰 Cartera:* *${m.moneda} ${user.coin.toLocaleString()}* | *🏦 Banco:* *${m.moneda} ${user.bank.toLocaleString()}*`, m);
    }

    cooldowns[m.sender] = Date.now();
};

handler.help = ['chamba', 'trabajar', 'work'];
handler.tags = ['economy'];
handler.command = ['chamba', 'trabajar', 'w', 'work', 'chambear'];
handler.group = true;
handler.register = true;

export default handler;

function segundosAHMS(segundos) {
    let minutos = Math.floor(segundos / 60);
    let segundosRestantes = segundos % 60;
    return `${minutos}m ${segundosRestantes}s`;
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

const trabajosBuenos = [
    "✨ Pusiste luces decorativas en el techo de la casa de un vecino sin caerte",
    "🎄 Ayudaste a montar el árbol gigante del centro comercial",
    "📦 Repartiste paquetes de última hora para un servicio de mensajería bajo la nieve",
    "🌰 Vendiste castañas asadas en un puesto callejero y se agotaron",
    "🌨️ Trabajaste quitando nieve de las entradas de varias casas con una pala",
    "🍪 Ayudaste en una panadería a hacer galletas y pan de temporada",
    "🎁 Trabajaste envolviendo regalos en una tienda departamental muy ocupada",
    "🎶 Fuiste DJ en una fiesta de fin de año de una empresa",
    "🐾 Cuidaste las mascotas de una familia que se fue de vacaciones por las fiestas",
    "⛸️ Vendiste boletos para la pista de patinaje sobre hielo",
    "🎅 Fuiste 'Santa' en un centro comercial y los niños te adoraron",
    "🥂 Serviste copas en un catering para una fiesta de gala",
    "☕ Trabajaste de barista preparando bebidas calientes especiales de temporada",
    "🧸 Ayudaste a descargar camiones llenos de juguetes en una gran tienda",
    "🚜 Condujiste un quitanieves en las calles principales después de una tormenta",
    "🍷 Vendiste vino caliente especiado en un mercado navideño",
    "🎸 Tocaste villancicos con tu guitarra en la calle y la gente fue generosa",
    "🎨 Creaste y vendiste adornos hechos a mano por internet",
    "🐶 Ayudaste en un refugio de animales a cuidar cachorros durante el frío",
    "🚗 Hiciste de valet parking en un restaurante de lujo durante una noche muy ocupada",
    "🔧 Reparaste el sistema de calefacción de una anciana y te dio una buena propina",
    "🌺 Ayudaste a una floristería a preparar arreglos de nochebuenas"
];

const trabajosMalos = [
    "💡 Mientras ponías luces, hiciste un cortocircuito. Tuviste que pagar al electricista",
    "🔮 Se te cayeron varias cajas de adornos de cristal frágiles descargando un camión. Te lo descontaron",
    "🤕 Intentaste quitar nieve con una pala, pero resbalaste y rompiste la ventana de un coche. Pagaste la reparación",
    "💧 Repartiendo paquetes, te resbalaste en el hielo y un regalo cayó en un charco. Tuviste que reponerlo",
    "💥 Derramaste una bandeja entera de copas de champán en la fiesta donde servías. Te costó el sueldo del día",
    "🐕 El perro que cuidabas se comió la decoración de un vecino. Tuviste que pagar por los adornos",
    "🧧 Envolviste el regalo equivocado en la caja equivocada. Tuviste que pagar el envío urgente para solucionarlo",
    "🚦 Te quedaste atascado en el tráfico por un desfile y no entregaste un pedido importante. Te penalizaron",
    "🪜 Decorando un árbol, te caíste de la escalera y rompiste una figura de porcelana cara. Tuviste que pagarla",
    "🔥 Se te quemó un lote entero de galletas en la panadería. Tuviste que reponer los ingredientes de tu bolsillo",
    "🧔 Siendo 'Santa', un niño tiró de tu barba falsa tan fuerte que rompió el traje. Tuviste que pagar el alquiler",
    "💨 La máquina de café explotó y te salpicó de leche caliente. Tuviste que pagar parte de la reparación",
    "📱 Patinando sobre hielo, te caíste y rompiste el celular de un cliente al que intentabas ayudar",
    "📫 El quitanieves que manejabas golpeó un buzón escondido bajo la nieve. Pagaste uno nuevo",
    "🧊 Se te congelaron las tuberías del puesto de vino caliente. Perdiste toda la mercancía y pagaste al plomero",
    "🎻 Tocando guitarra, se te rompió una cuerda y saltó a la comida de un puesto cercano. Repusiste la comida",
    "🥶 Te dio hipotermia por estar paleando nieve y gastaste lo ganado en medicinas",
    "🚙 El coche que estabas estacionando rozó una columna oculta por la nieve. Tuviste que pagar el rayón",
    "🌡️ El sistema de calefacción que 'reparaste' volvió a fallar. Tuviste que devolver el dinero y pagar una multa",
    "🪴 Rompiste tres macetas de nochebuenas raras en la floristería. Te las cobraron al triple",
    "🚒 Tu puesto de castañas se incendió levemente. Tuviste que pagar los daños al pavimento",
    "🔋 Se te acabó la batería del coche repartiendo paquetes y tuviste que pagar una grúa en medio de la nada"
];