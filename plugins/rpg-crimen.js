let cooldowns = {};
let jail = {};

const handler = async (m, { conn }) => {
    let users = global.db.data.users;
    let senderId = m.sender;
    const user = users[senderId];

    const premiumBenefit = user.premium ? 0.8 : 1.0;
    const cooldown = 5 * 60 * 1000;
    const jailCooldown = 30 * 60 * 1000;

    if (jail[senderId] && Date.now() < jail[senderId]) {
        const remaining = segundosAHMS(Math.ceil((jail[senderId] - Date.now()) / 1000));
        return m.reply(`🚔 Estás en la Cárcel. No puedes cometer crímenes por ahora. Te quedan *${remaining}*.`);
    }

    if (cooldowns[senderId] && Date.now() - cooldowns[senderId] < cooldown) {
        const remaining = segundosAHMS(Math.ceil((cooldowns[senderId] + cooldown - Date.now()) / 1000));
        return m.reply(`🚔 La policía está patrullando más por las fiestas. Mantén un perfil bajo. Espera *${remaining}*.`);
    }

    const outcome = Math.random();
    const jailChance = 0.15 * premiumBenefit;
    const successChance = 0.70;

    if (outcome < jailChance) {
        jail[senderId] = Date.now() + jailCooldown;
        const reason = pickRandom(frasesPolicia);
        return m.reply(`${reason}. Te atraparon y ahora estás en la cárcel por 30 minutos.`);

    } else if (outcome < jailChance + successChance) {
        const amount = Math.floor(Math.random() * 25000 + 10000);
        user.coin += amount;
        const reason = pickRandom(frasesExito);
        await m.reply(`${reason}. ¡Te embolsaste *${m.moneda} ${amount.toLocaleString()}*!\n> Saldo actual: *${m.moneda} ${user.coin.toLocaleString()}*`);

    } else {
        const amount = Math.floor(Math.random() * 18000 + 7000);
        let restante = amount;

        if (user.coin >= restante) {
            user.coin -= restante;
        } else {
            restante -= user.coin;
            user.coin = 0;
            if (user.bank >= restante) {
                user.bank -= restante;
            } else {
                user.bank = 0;
            }
        }
        const reason = pickRandom(frasesFracaso);
        await m.reply(`${reason}. En el proceso, perdiste *${m.moneda} ${amount.toLocaleString()}*.\n> Te queda: *${m.moneda} ${user.coin.toLocaleString()}* en cartera y *${m.moneda} ${user.bank.toLocaleString()}* en el banco.`);
    }

    cooldowns[senderId] = Date.now();
};

handler.help = ['crimen'];
handler.tags = ['economy'];
handler.command = ['crimen', 'crime'];
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

const frasesExito = [
    "🏦 Robaste un banco. La fuerte tormenta de nieve cubrió tus huellas y facilitó el escape",
    "💻 Hackeaste el sistema de una tienda online y desviaste centavos de miles de compras festivas a tu cuenta",
    "🚚 Interceptaste un camión de reparto lleno de las consolas de videojuegos más nuevas de la temporada",
    "💎 Te colaste en una fiesta de gala de fin de año y robaste las joyas de los abrigos en el guardarropa",
    "💳 Clonaste tarjetas de crédito en una gasolinera muy transitada por viajeros de vacaciones",
    "🔔 Robaste la recaudación de un puesto de 'donaciones' falso que montaste en una esquina concurrida",
    "🧑‍🔧 Te hiciste pasar por técnico de calefacción y robaste varias casas que estaban 'demasiado frías'",
    "🎆 Robaste un cargamento de fuegos artificiales de Año Nuevo y lo vendiste por el triple",
    "📱 Descubriste un fallo en el sistema de 'compra ahora' de una app de regalos y te enviaste productos caros",
    "🌲 Robaste el 'mejor' árbol de un lote de árboles de Navidad y lo revendiste",
    "📦 Te convertiste en 'porch pirate' (ladrón de paquetes) y te llevaste 10 paquetes de las entradas de las casas",
    "💰 Hiciste de carterista en el mercado navideño abarrotado. Nadie se dio cuenta por los empujones",
    "🔑 Robaste un coche que dejaron encendido para que se calentara. Fácil",
    "🍕 Asaltaste a un repartidor de pizzas que iba a una fiesta. Te llevaste el dinero y las pizzas",
    "🎫 Engañaste a un turista para que te comprara un 'boleto' falso para ver el encendido del árbol",
    "☕ Robaste la caja de propinas del barista mientras todos pedían bebidas de temporada",
    "📈 Subastaste un 'juguete exclusivo agotado' falso en internet y cobraste 30 veces",
    "🧑‍💼 Te llevaste los regalos de un 'amigo invisible' de una oficina entera",
    "🧂 Robaste una máquina de sal para la nieve y vendiste el contenido a precio de oro",
    "🎩 Te hiciste pasar por valet parking en una fiesta y 'perdiste' un auto de lujo",
    "🦌 Robaste un trineo decorativo antiguo de un jardín y lo vendiste a un coleccionista"
];

const frasesFracaso = [
    "😵 Intentaste entrar a una casa por la chimenea disfrazado de santa. Te atoraste, te llenaste de hollín y perdiste tu dinero tratando de huir y pagar la tintorería",
    "🌊 Saliste corriendo del banco, pero te resbalaste en una placa de hielo. El botín se deslizó por una alcantarilla y tuviste que pagar los daños de un adorno que rompiste al caer",
    "🥶 Intentaste robar un camión de reparto, pero quedaste atascado en un banco de nieve. Tuviste que pagar una grúa para salir y abandonaste el plan",
    "🛰️ Robaste joyas en una fiesta, pero una era un GPS. Tuviste que tirar el botín al río helado para escapar",
    "💸 El sistema de la tienda que hackeaste revirtió las transacciones y te cobró a ti 'gastos de gestión'",
    "💥 Intentaste robar un quitanieves, pero lo estrellaste contra el escaparate de una tienda. Tuviste que pagar los vidrios rotos",
    "🤑 El dinero que robaste estaba marcado. Lo metiste en tu bolsillo mojado de nieve y la tinta te manchó la cara. Tuviste que pagar una fianza",
    "🥵 Intentaste robar un coche, pero el dueño lo encendió remotamente con la calefacción al máximo. Saliste asfixiado y gastaste en curas",
    "🧨 El camión de fuegos artificiales que robaste tenía un defecto. Uno se encendió, perdiste la mercancía y pagaste por el incendio",
    "🦷 Robaste un bolso, pero solo tenía cupones de descuento y turrón duro. Te rompiste un diente al morderlo",
    "🐱 El 'paquete' que robaste del porche de una casa contenía arena para gatos usada. Tuviste que pagar para limpiar tu coche",
    "🤓 Te hiciste pasar por técnico de calefacción, pero la dueña era ingeniera y te hizo preguntas. Tuviste que pagarle para que no llamara a la policía",
    "⛽ El coche que robaste (porque estaba encendido) se quedó sin gasolina a dos cuadras. Tuviste que pagar el taxi de huida",
    "⛓️ La caja de donaciones que robaste estaba pegada al suelo. Hiciste tanto ruido que rompiste un cristal y lo pagaste",
    "🤦 Te resbalaste en el hielo huyendo y tu celular salió volando. Tuviste que comprar uno nuevo",
    "🍂 Robaste un trineo decorativo, pero estaba podrido. Se rompió y te caíste en un arbusto espinoso",
    "📉 La tarjeta que clonaste estaba sobregirada. El banco te cobró a ti la comisión por intento de fraude",
    "🤢 Te escondiste de la policía en un contenedor de basura, pero te rociaron con anticongelante por error",
    "🦝 El árbol que robaste estaba lleno de mapaches furiosos. Tuviste que pagar vacunas antirrábicas",
    "🧥 Robaste un abrigo caro del guardarropa, pero era de imitación. Se deshizo bajo la lluvia helada"
];

const frasesPolicia = [
    "👣 Te atraparon porque tus huellas en la nieve fresca te llevaron directamente a tu escondite",
    "🎤 Intentaste esconderte en un grupo de cantantes, pero no te sabías la letra y desentonaste",
    "🚕 Te quedaste atascado en el tráfico del desfile de la ciudad y la policía te bloqueó",
    "✨ Te identificaron gracias al reflejo de las luces decorativas en el metal de tu arma",
    "🛴 Huiste en un patinete eléctrico, pero la batería se agotó más rápido por el frío extremo",
    "⛄ Te escondiste dentro de un muñeco de nieve inflable. Te arrestaron cuando un niño empezó a golpearlo",
    "🧣 La víctima te describió perfectamente: 'Llevaba un gorro de lana feo y temblaba de frío'",
    "🏠 Intentaste escapar por una chimenea... que tenía un sistema de alarma. Te encontraron atorado",
    "📍 El GPS de los regalos que robaste guio a la policía directamente a ti",
    "🧵 Dejaste tu bufanda personalizada en la escena del crimen",
    "🤕 Te resbalaste en el hielo y caíste justo a los pies de un oficial que patrullaba",
    "🧑‍🎄 El 'Santa' del centro comercial al que empujaste era un policía encubierto en un operativo anti-carteristas",
    "📱 Te escondiste en un montón de bolsas de regalos, pero tu celular sonó con un villancico a todo volumen",
    "📸 Te grabó la cámara del timbre de una casa mientras robabas un paquete. Tu cara se vio en 4K",
    "📡 El coche que robaste tenía un localizador GPS que no pudiste desactivar",
    "👮 Le vendiste un árbol robado a un policía fuera de servicio. No le gustó",
    "🤦‍♂️ Dejaste tu nombre real al hackear la tienda online porque estabas logueado en tu cuenta principal",
    "🤔 El repartidor que asaltaste te reconoció porque le habías pedido pizza la semana anterior",
    "♨️ Te delató el olor a castañas quemadas. Te siguieron desde el puesto que quemaste",
    "🛸 Un dron que grababa el paisaje nevado te captó en pleno acto",
    "🧱 Corriste hacia un callejón sin salida que estaba bloqueado por un muro de nieve de 3 metros"
];