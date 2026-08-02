import { fbdl, fetchMediaBuffer } from '../../library/scrapers.js'
import { enqueueMediaJob, getMediaQueueConnection } from '../../library/queue.js'
import cheerio from '../../library/htmlTools.js'

var handler = async (m, { conn, args, command, usedPrefix, text }) => {

const isCommand7 = /^(facebook|fb|facebookdl|fbdl)$/i.test(command)

async function reportError(e) {
await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝙍𝙾𝚁`, m, rcanal)
console.log(e)
}

async function scrapeMetadata(pageUrl) {
try {
const resp = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
const html = await resp.text()
const $ = cheerio.load(html)
const getMeta = (name, attr = 'content') =>
$(`meta[property="${name}"]`).attr(attr) ||
$(`meta[name="${name}"]`).attr(attr) ||
null
return {
title: getMeta('og:title') || getMeta('twitter:title'),
description: getMeta('og:description') || getMeta('twitter:description'),
siteName: "Facebook"
}
} catch (e) {
return { title: null, description: null, siteName: "Facebook" }
}
}

if (isCommand7) {

if (!text) return conn.reply(m.chat, `🚩 *Ingrese un enlace de facebook*`, m, rcanal)

if (!args[0].match(/www.facebook.com|fb.watch|web.facebook.com|business.facebook.com|video.fb.com/g))
return conn.reply(m.chat, '🚩 *ᥒ᥆ ᥱs ᥙᥒ ᥱᥒᥣᥲᥴᥱ ᥎ᥲ́ᥣіძ᥆*', m, rcanal)

conn.reply(m.chat, '🚀 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝗻𝗱𝗼 𝗘𝗹 𝗩𝗶𝗱𝗲𝗼 𝗗𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸, 𝗘𝘀𝗽𝗲𝗿𝗲 𝗨𝗻 𝗠𝗼𝗺𝗲𝗻𝘁𝗼....', m, {
contextInfo: {
forwardingScore: 2022,
isForwarded: true}
})

m.react(rwait)
await enqueueMediaJob('facebook', {
chat: m.chat,
url: args[0],
message: { key: m.key, message: m.message, sender: m.sender, chat: m.chat }
}, { conn })
}
}

handler.help = ['fb']
handler.tags = ['descargas']
handler.command = ['fb', 'facebook']
handler.register = true


global.queueHandlers ||= new Map()
global.queueHandlers.set('facebook', async (data) => {
const conn = getMediaQueueConnection()
const m = data.message
async function scrapeMetadata(pageUrl) {
try {
const resp = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
const html = await resp.text()
const $ = cheerio.load(html)
const getMeta = (name, attr = 'content') => $(`meta[property="${name}"]`).attr(attr) || $(`meta[name="${name}"]`).attr(attr) || null
return { title: getMeta('og:title') || getMeta('twitter:title'), description: getMeta('og:description') || getMeta('twitter:description'), siteName: 'Facebook' }
} catch { return { title: null, description: null, siteName: 'Facebook' } }
}
try {
const fb = await fbdl(data.url)
if (!fb?.data?.length) throw new Error('No se obtuvo video.')
const video = fb.data.find(item => /\.mp4|video|hd|sd/i.test(`${item.url} ${item.quality || ''}`)) || fb.data[0]
const media = await fetchMediaBuffer(video)
if (!/^video\//i.test(media.mime) && media.ext !== 'mp4') throw new Error(`La URL extraída no es video: ${media.mime}`)
const meta = await scrapeMetadata(data.url)
let caption = `꒰꒰͡  *𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰* !! ര

┉ ᩿💭 ᩠〪ᷭׄ : *𝙏𝙄𝙏𝙐𝙇𝙊:* ${meta.title || 'No disponible'}
┉ ᩿💭 ᩠〪ᷭׄ : *𝘿𝙀𝙎𝘾𝙍𝙄𝙋𝘾𝙄𝙊́𝙉:* ${meta.description || 'No disponible'}
┉ ᩿💭 ᩠〪ᷭׄ : *𝙎𝙄𝙏𝙄𝙊:* Facebook
┉ ᩿💭 ᩠〪ᷭׄ : *𝙀𝙉𝙇𝘼𝘾𝙀 𝙊𝙍𝙄𝙂𝙄𝙉𝘼𝙇:* ${data.url}
────────────────
> ${global.wm}`
await conn.sendMessage(data.chat, { video: media.buffer, fileName: 'facebook.mp4', caption, mimetype: media.mime || 'video/mp4' }, { quoted: m })
} catch (e) {
await conn.reply(data.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m, rcanal)
console.log(e)
}
})

export default handler