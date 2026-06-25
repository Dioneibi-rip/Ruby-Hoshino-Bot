import axios from 'axios'
import cheerio from 'cheerio'

let handler = async (m, { text }) => {
	if (!text) {
	await conn.reply(m.chat, `${emoji} Ingresa lo que quieres buscar en Wikipedia.`, m);
	return false;
	}
	
    try {
	const link =  await axios.get(`https://es.wikipedia.org/wiki/${text}`)
	const $ = cheerio.load(link.data)
	let wik = $('#firstHeading').text().trim()
	let resulw = $('#mw-content-text > div.mw-parser-output').find('p').text().trim()
	m.reply(`▢ *Wikipedia*

‣ Buscado : ${wik}

${resulw}`)
} catch (e) {
  m.reply(`${emoji2} No se encontraron resultados.`)
  return false;
}
}
handler.help = ['wikipedia']
handler.tags = ['tools']
handler.command = ['wiki', 'wikipedia'] 

export default handler
