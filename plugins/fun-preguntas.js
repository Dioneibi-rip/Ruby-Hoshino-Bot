const respuestas = ['Si','Tal vez sí','Posiblemente','Probablemente no','No','Imposible','Por que haces estas preguntas','Por eso te dejo','Para que quieres saber','No te dire la respuesta']

var handler = async (m, { conn, text }) => {

if (!text) return conn.reply(m.chat, `${emoji} Por favor, ingrese un texto a pregunta.`, m)

await m.react('❔')
await delay(1000 * 1)
await m.react('❓')
await delay(1000 * 1)
await m.react('❔')
await delay(1000 * 1)

const res = respuestas[Math.floor(Math.random() * respuestas.length)]
await conn.reply(m.chat, `${dev}\n\n•*Pregunta:* ${text}\n• *Respuesta:* ${res}`, m)

}
handler.help = ['pregunta']
handler.tags = ['fun']
handler.command = ['pregunta','preguntas']
handler.group = true
handler.register = true

export default handler

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
