const { generateWAMessageFromContent, proto } = (await import('@whiskeysockets/baileys')).default

var handler = async (m, { conn, text}) => {

conn.reply(m.chat, `⏳ Buscando un consejo útil...`, m)

let consejo = pickRandom(global.consejo)

let newConsejo = `
╭━━━[ 💡 *CONSEJO ÚTIL* ]━━━╮
│${consejo}
╰━━━━━━━━━━━━━━━━━━━━╯
`
conn.reply(m.chat, newConsejo, m)

}
handler.help = ['consejo']
handler.tags = ['fun']
handler.command = ['consejo']
handler.fail = null
handler.exp = 0
handler.group = true;
handler.register = true

export default handler

function pickRandom(list) {
return list[Math.floor(list.length * Math.random())]
}

global.consejo = [
"La 'regla de los 2 minutos': Si una tarea toma menos de dos minutos, hazla ahora mismo.",
"Aprende a decir 'no' sin sentirte culpable. Tu tiempo y energía son limitados.",
"No tomes decisiones importantes cuando estés enojado o muy eufórico.",
"Bebe un vaso de agua tan pronto como te despiertes.",
"La 'regla 20/20/20': Cada 20 minutos, mira algo a 20 pies (6 metros) de distancia durante 20 segundos para descansar tus ojos de la pantalla.",
"Antes de comprar algo no esencial, espera 24 horas. Si todavía lo quieres, cómpralo. Esto evita compras impulsivas.",
"Haz una copia de seguridad de tus archivos importantes en la nube y en un disco externo.",
"Escucha para entender, no solo para responder.",
"Cuida tu postura. Tu 'yo' futuro te lo agradecerá.",
"Escribe las cosas. Tu cerebro está para tener ideas, no para almacenarlas.",
"Si estás en una discusión, enfócate en el problema, no en la persona.",
"Aprende a cocinar al menos 5 comidas saludables que te gusten.",
"Revisa tus finanzas personales al menos una vez al mes.",
"Camina al menos 30 minutos al día.",
"No te vayas a dormir con la cocina sucia. Empezar el día con orden reduce el estrés.",
"Pide ayuda cuando la necesites. Ser vulnerable no es ser débil.",
"Agradece algo todos los días, por pequeño que sea.",
"Lee al menos un libro al mes. Sobre el tema que sea.",
"Nunca dejes de aprender. Dedica 15 minutos al día a aprender una nueva habilidad.",
"Estira tu cuerpo durante 5 minutos cada mañana."
];
