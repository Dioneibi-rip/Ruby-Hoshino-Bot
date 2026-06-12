const { generateWAMessageFromContent, proto } = (await import('@whiskeysockets/baileys')).default

var handler = async (m, { conn, text}) => {


let facto = pickRandom(global.factos)
let newFacto = `
꒰ ͜ㅤ𝅼ㅤ۫ㅤ | ͜ 𝄄 ͜ 𝄄⏝۪𝆹𝅥۪⏝𝄄 ͜ 𝄄 ͜ |ㅤ۫ㅤ𝅼ㅤ͜ ꒱
${facto}
   ‎‎ ︶⏝ ͝  ׅ    ⊹ 🪔 ⊹     ׅ   ͝ ⏝︶
`
conn.reply(m.chat, newFacto, m)

}
handler.help = ['facto']
handler.tags = ['fun']
handler.command = ['facto']
handler.fail = null
handler.exp = 0
handler.group = true;
handler.register = true

export default handler

function pickRandom(list) {
return list[Math.floor(list.length * Math.random())]
}

global.factos = [
    "Es imposible estornudar con los ojos abiertos.",
    "El corazón de una gamba (camarón) está en su cabeza.",
    "En Suiza, es ilegal tener una sola cobaya; se considera maltrato animal porque se sienten solas.",
    "La piel de los osos polares es negra, no blanca. Su pelaje es translúcido y refleja la luz.",
    "El sudor de los hipopótamos es de color rosa y actúa como protector solar.",
    "El país con más pirámides en el mundo es Sudán, no Egipto.",
    "Un pulpo tiene tres corazones y nueve cerebros.",
    "La miel es el único alimento que no caduca. Se ha encontrado miel comestible en tumbas egipcias de 3000 años.",
    "Venus es el único planeta del sistema solar que gira en sentido horario.",
    "El animal nacional de Escocia es el unicornio.",
    "El tomate es una fruta, no una verdura. Botánicamente, es una baya.",
    "Una nube cúmulus media puede pesar más de un millón de toneladas.",
    "Los bebés nacen con aproximadamente 300 huesos, pero los adultos solo tienen 206.",
    "Las vacas tienen 'mejores amigas' y se estresan si se separan de ellas.",
    "La Coca-Cola originalmente era de color verde.",
    "En Finlandia hay más saunas que coches.",
    "El 50% del ADN humano es idéntico al de un plátano.",
    "Comer una manzana por la mañana te despierta más eficazmente que una taza de café.",
    "El encendedor se inventó antes que los fósforos (cerillas).",
    "Las nutrias de mar duermen cogidas de la mano para no separarse mientras flotan en el agua.",
    "El ojo de un avestruz es más grande que su cerebro.",
    "Las hormigas no duermen. Sin embargo, toman 'descansos' de 8 minutos dos veces al día.",
    "Los elefantes son los únicos mamíferos que no pueden saltar.",
    "El miedo a las palabras largas se llama 'Hipopotomonstrosesquipedaliofobia'.",
    "El sonido no puede viajar a través del vacío del espacio.",
    "El corazón de una ballena azul es tan grande como un coche pequeño y su latido se puede oír a 3 km de distancia.",
    "Las estrellas de mar no tienen cerebro.",
    "El graznido de un pato (cuac) es uno de los pocos sonidos que no produce eco.",
    "La Gran Muralla China no es visible desde el espacio a simple vista.",
    "Las medusas están compuestas en un 95% de agua.",
    "Un caracol puede dormir durante 3 años seguidos.",
    "Las mariposas saborean la comida con sus patas.",
    "El colibrí es el único pájaro que puede volar hacia atrás.",
    "Los koalas duermen aproximadamente 22 horas al día.",
    "La silla eléctrica fue inventada por un dentista.",
    "La mayoría de los lápices labiales contienen escamas de pescado.",
    "Los gemelos idénticos no tienen las mismas huellas dactilares.",
    "Si masticas chicle mientras cortas cebolla, es menos probable que llores.",
    "La lengua es el único músculo del cuerpo humano que está unido solo por un extremo.",
    "El material más resistente creado por la naturaleza es la tela de araña.",
    "Los gatos no tienen la capacidad de saborear las cosas dulces.",
    "En la Luna, tu peso corporal sería aproximadamente 6 veces menor.",
    "En el planeta Urano, las estaciones duran 21 años terrestres cada una.",
    "Para conseguir un kilo de miel, las abejas deben visitar más de 1.4 millones de flores.",
    "Aunque es extremadamente raro, ha nevado en el desierto del Sahara.",
    "Los pulpos tienen sangre azul.",
    "Las jirafas no tienen cuerdas vocales y se comunican haciendo vibrar el aire a su alrededor.",
    "Los dientes humanos son casi tan duros como las rocas.",
    "Las ratas se ríen cuando les haces cosquillas.",
    "Las zanahorias originalmente eran de color morado, no naranja.",
    "Hay más árboles en la Tierra que estrellas en la Vía Láctea.",
    "El 'Bluetooth' se nombró en honor a un rey vikingo, Harald Bluetooth.",
    "Los flamencos son rosas porque su dieta se basa en camarones y algas ricas en carotenoides.",
    "Solo hay dos países en el mundo donde la Coca-Cola no se vende oficialmente: Corea del Norte y Cuba.",
    "Las abejas pueden reconocer rostros humanos.",
    "El primer avión voló solo 12 segundos.",
    "Las cabras tienen pupilas rectangulares.",
    "Rusia tiene una superficie más grande que la de Plutón.",
    "Los plátanos son curvados porque crecen hacia el sol.",
    "El Océano Atlántico es más salado que el Océano Pacífico.",
    "Los canguros no pueden caminar hacia atrás.",
    "El Monte Everest crece unos 4 milímetros cada año."
];