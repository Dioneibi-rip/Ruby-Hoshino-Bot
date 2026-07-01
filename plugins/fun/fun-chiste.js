const { generateWAMessageFromContent, proto } = (await import('@whiskeysockets/baileys')).default

var handler = async (m, { conn, text}) => {

conn.reply(m.chat, `⏳ Buscando un chiste...`, m)

let chiste = pickRandom(global.chiste)

let newChiste = `
╭━━━[ 🤣 *CHISTE* ]━━━╮
│${chiste}
╰━━━━━━━━━━━━━━━━━━━━╯
`
conn.reply(m.chat, newChiste, m)

}
handler.help = ['chiste']
handler.tags = ['fun']
handler.command = ['chiste']
handler.fail = null
handler.exp = 0
handler.group = true;
handler.register = true

export default handler

function pickRandom(list) {
return list[Math.floor(list.length * Math.random())]
}

global.chiste = [
"¿Qué le dice un semáforo a otro? ¡No me mires, que me estoy cambiando!",
"Papá, ¿qué se siente tener un hijo tan guapo? \n- No sé hijo, pregúntale a tu abuelo.",
"¿Por qué los pájaros vuelan hacia el sur en invierno? \n- ¡Porque es demasiado lejos para caminar!",
"Un pez le dice al otro: '¿Qué hace tu papá?' \n- 'Nada. ¿Y el tuyo?' \n- 'Nada también.'",
"¿Cuál es el café más peligroso del mundo? \n- El ex-preso.",
"Mi jefe me dijo: '¡Vístase para el trabajo que quiere, no para el que tiene!' \n- Al día siguiente me presenté vestido de Batman.",
"¿Qué es un punto verde en una esquina? \n- Un guisante castigado.",
"Entra un hombre a una óptica y le dice al vendedor: 'Quiero unas gafas'. \n- El vendedor pregunta: '¿Para el sol?' \n- Y el hombre responde: 'No, ¡para mí!'",
"¿Qué le dice una impresora a otra? \n- '¿Esa hoja es tuya o es impresión mía?'",
"¿Cómo se queda un mago después de comer? \n- Magordito.",
"Jaimito, ¿cuánto es 2x2? \n- Empate. \n- ¿Y 2x1? \n- ¡Oferta!",
"Oye, ¿cuál es tu plato favorito y por qué? \n- Pues el hondo, porque cabe más comida.",
"Me robaron todas las sillas de mi casa. No saben cómo me siento.",
"¿Qué hace una abeja en un gimnasio? \n- ¡Zum-ba!",
"¿Sabes por qué el mar no se seca? \n- Porque no tiene toalla.",
"Le dice un amigo a otro: 'Ayer me compré un reloj de pulsera.' \n- '¿Qué marca?' \n- 'Pues la hora.'",
"¿Para qué va una caja al gimnasio? \n- Para hacerse caja fuerte.",
"Si los zombies se descomponen con el tiempo, ¿eso es un apocalipsis zombie o un 'zombiodegradable'?",
"¿Qué le dice una pared a otra pared? \n- Nos vemos en la esquina.",
"¿Por qué el libro de matemáticas se suicidó? \n- Porque tenía demasiados problemas."
];
