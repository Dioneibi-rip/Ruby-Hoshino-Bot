const voices = {
'es': 'es',
'anime': 'ja',
'chica': 'ko',
'ingles': 'en',
'ruso': 'ru'
}
const defaultVoice = 'es'
const handler = async (m, { conn, args, usedPrefix, command }) => {
let voice = defaultVoice
let text = ''
if (args.length > 0 && voices[args[0].toLowerCase()]) {
voice = voices[args[0].toLowerCase()]
text = args.slice(1).join(' ')
} else {
text = args.join(' ')
}
if (!text && m.quoted?.text) text = m.quoted.text
if (!text) {
const voiceList = Object.keys(voices).map(v => `*${v}*`).join(', ')
return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖥⍺𝗅𝗍⍺ 𝖾𝗅 𝗍𝖾𝗑𝗍𝗈...\n> 💡 *𝖴𝗌𝗈:* ${usedPrefix}${command} <voz> <texto>\n> 🗣️ *𝖵𝗈𝖼𝖾𝗌:* ${voiceList}\n> 🌸 *𝖤𝗃𝖾𝗆𝗉𝗅𝗈:* ${usedPrefix}${command} anime Hola soy Ruby`)
}
let res
try {
res = await tts(text, voice)
} catch (e) {
return m.reply(e + '')
}
if (res) return conn.sendFile(m.chat, res, 'tts.opus', null, m, true)
}
handler.help = ['tts <voz> <texto>']
handler.tags = ['transformador']
handler.group = true
handler.register = true
handler.command = ['tts', 'voz']
export default handler
async function tts(text, lang) {
if (!text) throw new Error('Texto vacío')
const chunks = String(text).match(/.{1,180}(?:\s|$)/g)?.map(part => part.trim()).filter(Boolean) || []
const buffers = []
for (const chunk of chunks) {
const url = new URL('https://translate.google.com/translate_tts')
url.searchParams.set('ie', 'UTF-8')
url.searchParams.set('client', 'tw-ob')
url.searchParams.set('tl', lang)
url.searchParams.set('q', chunk)
const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
if (!response.ok) throw new Error(`TTS HTTP ${response.status}`)
buffers.push(Buffer.from(await response.arrayBuffer()))
}
return Buffer.concat(buffers)
}