const { generateWAMessageFromContent, proto } = (await import('@whiskeysockets/baileys')).default

var handler = async (m, { conn, text}) => {

conn.reply(m.chat, `⏳ Buscando una frase...`, m)

let animeQuote = pickRandom(global.frases)

let newFrase = `
ㅤㅤ╭ᒋ⏜︵⁀⌒⁔ᗝ   🏛️   ᗝ⁔⌒⁀︵⏜ᒉ
𓏸𓈒  "${animeQuote.quote}" ֺ۪ ㅤ⃝🫖

> *- ${animeQuote.author}*
ㅤㅤ╰ᒋ⏝︵⁀⌒⁔ᗝ   🏯   ᗝ⁔⌒⁀︵⏝ᒉ╮
`
conn.reply(m.chat, newFrase, m)

}
handler.help = ['frase']
handler.tags = ['fun']
handler.command = ['frase']
handler.fail = null
handler.exp = 0
handler.group = true;
handler.register = true

export default handler

function pickRandom(list) {
return list[Math.floor(list.length * Math.random())]
}

global.frases = [
  { quote: "Aquellos que rompen las reglas son escoria, pero aquellos que abandonan a sus amigos son peor que escoria.", author: "Kakashi Hatake (Naruto)" },
  { quote: "Si no te gusta tu destino, no lo aceptes. En vez de eso, ten el coraje de cambiarlo como tú quieras.", author: "Naruto Uzumaki (Naruto)" },
  { quote: "El miedo no es malo. Te dice cuál es tu debilidad. Y una vez que conoces tu debilidad, puedes volverte más fuerte.", author: "Gildarts Clive (Fairy Tail)" },
  { quote: "Un sueño no es algo que se cumple solo. Es algo que haces realidad.", author: "Monkey D. Luffy (One Piece)" },
  { quote: "Si tienes tiempo para pensar en un final hermoso, ¿por qué no vives hermosamente hasta el final?", author: "Gintoki Sakata (Gintama)" },
  { quote: "Levántate y camina. Sigue adelante. Tienes tus propias piernas para hacerlo.", author: "Edward Elric (Fullmetal Alchemist)" },
  { quote: "No creas en ti. Cree en el mí que cree en ti.", author: "Kamina (Tengen Toppa Gurren Lagann)" },
  { quote: "El mundo no es perfecto. Pero está ahí para nosotros, haciendo lo mejor que puede. Eso es lo que lo hace tan maravilloso.", author: "Roy Mustang (Fullmetal Alchemist)" },
  { quote: "El trabajo duro no sirve de nada para aquellos que no creen en sí mismos.", author: "Might Guy (Naruto)" },
  { quote: "No importa cuán talentoso seas, no puedes cambiar el mundo solo.", author: "L (Death Note)" },
  { quote: "La gente muere cuando es olvidada.", author: "Dr. Hiriluk (One Piece)" },
  { quote: "Rendirse es la opción de los débiles.", author: "Vegeta (Dragon Ball Z)" },
  { quote: "No vivas con falsedades ni miedos. Porque al final, tú eres el único que saldrá lastimado.", author: "Lelouch Lamperouge (Code Geass)" },
  { quote: "Incluso si te sientes desesperado, no debes rendirte. Si siempre te lamentas, tu vida será una eterna pesadilla.", author: "Guts (Berserk)" },
  { quote: "El poder no viene de la habilidad, sino de la voluntad.", author: "Monkey D. Luffy (One Piece)" },
  { quote: "A veces, la mejor manera de resolver los problemas de alguien es dejar que los resuelvan ellos mismos.", author: "Saitama (One-Punch Man)" },
  { quote: "No saber es malo, pero no querer saber es aún peor.", author: "Satoru Gojo (Jujutsu Kaisen)" },
  { quote: "Si mueres, no podrás cumplir tus sueños. No importa lo frustrante que sea, tienes que seguir viviendo.", author: "Eren Jaeger (Attack on Titan)" },
  { quote: "La vida no es un juego de suerte. Si quieres ganar, tendrás que trabajar duro.", author: "Sora (No Game No Life)" }
];