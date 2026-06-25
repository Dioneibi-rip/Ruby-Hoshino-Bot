import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.botNumber = ''

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.owner = [
// <-- Número @s.whatsapp.net -->
  ['18093519169', '⏤͟͞ू⃪ ፝͜⁞𝘿𝙞𝙤𝙣𝙚𝙞𝙗𝙞-ʳⁱᵖ ִֶ ࣪˖ ִֶָ🐇་༘', true],
  ['573235915041', '⏤͟͞ू⃪ ፝͜𝐅ꫀl͟𝐢𝘅 o͜͡𝗳𝐜⁞་༘', true],
  ['18096758983', '⟆⃝༉⃟⸙ ᯽ N͙e͙v͙i͙-D͙e͙v͙ ⌗⚙️࿐', true],
  ['573508941325', 'FELIX-DEV', true],
  ['5216671548329', 'ू⃪ ꒰˘͈ᵕ ˘͈ 𝑳𝒆𝒈𝒏𝒂-𝒄𝒉𝒂𝒏 🪽 ꒱𖦹', true],
  ['573114910796', 'Arlette 🎀', true],

// <-- Número @lid -->
  ['122544745111646', 'Dioneibi', true],
  ['236391074132098', 'NEOTOKIO', true],
  ['260081845334105', 'nevi', true],
  ['58566677377081', 'legna', true],
  ['177266856313074', 'speed3xz', true]
]

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.mods = []
global.suittag = ['18294868853']
global.prems = []

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.libreria = 'Baileys'
global.baileys = 'V 6.7.16'
global.languaje = 'Español'
global.vs = '2.2.0'
global.nameqr = 'Ruby-Hoshino-Bot-MD'
global.namebot = '꒰ 🥥 ꒱ؘ 𝙍𝙪𝙗𝙮-𝙃𝙤𝙨𝙝𝙞𝙣𝙤-𝘽𝙤𝙩 ♪ ࿐ ࿔*:･ﾟ'
global.Rubysessions = 'RubySessions'
global.jadi = 'RubyJadiBots'
global.RubyJadibts = true
global.subbotlimitt = 22

global.baileysSocketConfig = {
  connectTimeoutMs: 45000,
  keepAliveIntervalMs: 20000,
  retryRequestDelayMs: 1500,
  defaultQueryTimeoutMs: 30000
}

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.packname = '⏤̛̣̣̣̣̣̣̣̣̣̣̣͟͟͞͞⏤͟͟͞͞🍭𝐑υׁׅ𝐛𝐲 𝐇ᨵׁׅׅ𝐬𝐡𝐢𝐧ᨵׁׅׅ ૮(˶ᵔᵕᵔ˶)ა'
global.botname = ' ࣪☀ ࣭𝗥𝘂𝗯𝘆 𝗛𝗼𝘀𝗵𝗶𝗻𝗼 𝗕𝗼𝘁࣪ 𝟹𝟹 ✿'
global.wm = '‧˚꒰🍷꒱ ፝͜⁞R͢ᴜʙʏ-H͢ᴼ꯭s፝֟ʜɪɴᴏ-𝘉𝘰𝘵-𝑴𝑫✰⃔⃝🦋'
global.author = 'Made By 𐔌Dioneibi-rip ͡꒱ ۫'
global.dev = '⌬ Modified by: Dioneibi-rip ⚙️💻 '
global.textbot = '⏤͟͞ू⃪ 𝑹𝒖𝒃𝒚-𝐻𝒐𝒔𝒉𝒊𝒏𝒐🌸⃝𖤐 • 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗕𝘆 ᴰⁱᵒⁿᵉⁱᵇⁱ⁻ʳⁱᵖ'
global.etiqueta = 'ˑ 𓈒 𐔌 D͙i͙o͙n͙e͙i͙b͙i͙-r͙i͙p͙ ͡꒱ ۫'

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.moneda = 'Zenis'
global.banner = 'https://files.catbox.moe/b93cts.jpg'
global.avatar = 'https://qu.ax/RYjEw.jpeg'
global.catalogo = fs.readFileSync('./src/catalogo.jpg')

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.gp1 = 'https://chat.whatsapp.com/D070oCPt4it7M2MohvYoOn'
global.comunidad1 = 'https://chat.whatsapp.com/BjlcnMjRlYhEL1uUBEWTNg'
global.channel = 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P'
global.channel2 = 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P'
global.md = 'https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot'
global.correo = 'nimierdalopondre@gmail.com'
global.cn = 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P'
global.ch = { ch1: '120363335626706839@newsletter' }

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.estilo = { key: { fromMe: false, participant: `0@s.whatsapp.net`, ...(false ? { remoteJid: "5219992095479-1625305606@g.us" } : {}) }, message: { orderMessage: { itemCount : -999999, status: 1, surface : 1, message: packname, orderTitle: 'Bang', thumbnail: catalogo, sellerJid: '0@s.whatsapp.net'}}}

global.getBuffer = global.getBuffer || async function getBuffer(url, options = {}) {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        DNT: 1,
        'User-Agent': 'GoogleBot',
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (e) {
    console.log(`Error : ${e}`)
    return null
  }
}

global.fakeIconUrls = [
  'https://files.catbox.moe/ahp3bc.jpeg', 'https://files.catbox.moe/ffkx61.jpg',
  'https://files.catbox.moe/uc272d.webp', 'https://files.catbox.moe/nuoard.jpg',
  'https://files.catbox.moe/edsflw.jpg', 'https://files.catbox.moe/ilkgfh.webp',
  'https://files.catbox.moe/fslr4h.jpg', 'https://files.catbox.moe/k25pcl.jpg',
  'https://files.catbox.moe/5qglcn.jpg', 'https://files.catbox.moe/nvhomc.jpeg',
  'https://files.catbox.moe/d81jgr.jpg', 'https://files.catbox.moe/6x9q51.jpg',
  'https://files.catbox.moe/i7vsnr.jpg', 'https://files.catbox.moe/e9zgbu.jpg',
  'https://files.catbox.moe/jm6j5b.jpeg', 'https://files.catbox.moe/jobvjq.jpg',
  'https://files.catbox.moe/iph9xr.jpeg', 'https://files.catbox.moe/z962x9.jpg',
  'https://files.catbox.moe/k8griq.jpeg', 'https://files.catbox.moe/104xtw.jpeg',
  'https://files.catbox.moe/pjuo2b.jpg', 'https://files.catbox.moe/7bn1pf.jpg',
  'https://files.catbox.moe/fe6pw6.jpeg'
]

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.creador = 'Wa.me/18294868853'
global.asistencia = 'Wa.me/18294868853'
global.namechannel = '⏤͟͞ू⃪፝͜⁞⟡『 𝐓͢ᴇ𝙖፝ᴍ⃨ 𝘾𝒉꯭𝐚𝑛𝑛𝒆𝑙: 𝑹ᴜ⃜ɓ𝑦-𝑯ᴏ𝒔𝑯𝙞꯭𝑛𝒐 』࿐⟡'
global.namechannel2 = '⟡『 𝐓𝐞𝐚𝐦 𝐂𝐡𝐚𝐧𝐧𝐞𝐥: 𝑹𝒖𝒃𝒚-𝑯𝒐𝒔𝒉𝒊𝒏𝒐 』⟡'
global.namegrupo = '⏤͟͞ू⃪ 𝑹𝒖𝒃𝒚-𝑯𝒐𝒔𝒉𝒊𝒏𝒐-𝐵ot ⌬⃝𓆩⚘𓆪 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥'
global.namecomu = '⏤͟͞ू⃪ 𝑹𝒖𝒃𝒚-𝑯𝒐𝒔𝒉𝒊𝒏𝒐 ✦⃝𖤐 𝑪𝒐𝒎𝒎𝒖𝒏𝒊𝒕𝒚'
global.listo = '❀ *Aquí tienes ฅ^•ﻌ•^ฅ*'
global.fotoperfil = global.avatar || 'https://files.catbox.moe/xr2m6u.jpg'
global.canalIdM = ['120363335626706839@newsletter', '120363335626706839@newsletter']
global.canalNombreM = [global.namechannel, global.namechannel2]

global.rwait = '🕒'
global.done = '✅'
global.error = '✖️'
global.msm = '⚠︎'
global.emoji = '🍨'
global.emoji2 = '🍭'
global.emoji3 = '🌺'
global.emoji4 = '💗'
global.emoji5 = '🍡'
global.emojis = global.emoji
global.wait = '⚘𖠵⃕❖𖥔 𝑪𝒂𝒓𝒈𝒂𝒏𝒅𝒐...ꪶꪾ❍̵̤̂ꫂ\n❝ 𝐴𝑔𝑢𝑎𝑟𝑑𝑒 𝑢𝑛 𝑚𝑜𝑚𝑒𝑛𝑡𝑜 ❞'

global.redesList = [global.channel, global.channel2, 'https://github.com/Dioneibi-rip', global.md, global.correo].filter(Boolean)
global.redes = global.redesList[0]
global.icono = global.catalogo
global.icons = global.catalogo
global.readMore = String.fromCharCode(8206).repeat(850)
global.packsticker = global.packsticker || global.botname
global.packsticker2 = '𝚁𝚄𝙱𝚈 𝙱𝙾𝚃 𝙼𝙳 ˃ 𖥦 ˂'

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.getRandomChannel = function getRandomChannel() {
  const ids = global.canalIdM || []
  const names = global.canalNombreM || []
  const index = Math.floor(Math.random() * Math.max(ids.length, 1))
  return { id: ids[index] || global.channel, name: names[index] || global.namechannel }
}

global.createFakeContact = function createFakeContact(sender = '0@s.whatsapp.net') {
  const number = String(sender || '0@s.whatsapp.net').split('@')[0]
  return {
    key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
    message: { contactMessage: { vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${number}:${number}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` } },
    participant: '0@s.whatsapp.net'
  }
}

global.getSaludo = function getSaludo(date = new Date()) {
  const hour = date.getHours()
  if ([0, 1, 2].includes(hour)) return 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'
  if ([3, 4, 5, 6, 8, 9].includes(hour)) return 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌄'
  if (hour === 7) return 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌅'
  if ([10, 11, 12, 13].includes(hour)) return 'Lɪɴᴅᴏ Dɪᴀ 🌤'
  if ([14, 15, 16, 17].includes(hour)) return 'Lɪɴᴅᴀ Tᴀʀᴅᴇ 🌆'
  return 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'
}

global.updateMessageGlobals = async function updateMessageGlobals(m = {}, conn = {}) {
  const sender = m.sender || m.key?.participant || m.key?.remoteJid || '0@s.whatsapp.net'
  const now = new Date(Date.now() + 3600000)
  global.fkontak = global.createFakeContact(sender)
  global.ofcbot = conn.user?.jid?.split('@')[0] || conn.user?.id?.split('@')[0] || global.botNumber || ''
  global.channelRD = global.getRandomChannel()
  global.d = now
  global.locale = 'es'
  global.dia = now.toLocaleDateString(global.locale, { weekday: 'long' })
  global.fecha = now.toLocaleDateString('es', { day: 'numeric', month: 'numeric', year: 'numeric' })
  global.mes = now.toLocaleDateString('es', { month: 'long' })
  global.año = now.toLocaleDateString('es', { year: 'numeric' })
  global.tiempo = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
  global.emojis = [global.emoji, global.emoji2, global.emoji3, global.emoji4][Math.floor(Math.random() * 4)]
  global.redes = global.redesList[Math.floor(Math.random() * global.redesList.length)] || global.md
  global.saludo = global.getSaludo(now)
  global.nombre = m.pushName || 'Anónimo'
  global.taguser = '@' + String(sender).split('@')[0]
  global.packsticker = global.nombre
}

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

const imagenes = [
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8C%9FRuby%20Hoshino%F0%9F%8C%9F.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%97%8B%F0%9D%97%8E%F0%9D%6BB%F0%9D%97%92%20%F0%9D%97%81%F0%9D%97%88%F0%9D%97%8C%F0%9D%97%81%F0%9D%97%82%F0%9D%97%87%F0%9D%97%88.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%93%A1%F0%9D%93%BE%F0%9D%93%AB%F0%9D%14%82%20%F0%9D%93%98%F0%9D%93%AC%F0%9D%93%B8%F0%9D%93%B7%F0%9D%93%BC%20%E2%AD%90%F0%9F%92%AB.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%20%F0%9D%91%AF%F0%9D%92%90%F0%9D%92%94%F0%9D%92%89%F0%9D%92%8A%F0%9D%92%8F%F0%9D%92%90.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%86Hoshino%20Ruby%E2%98%86.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(2).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(1).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%CB%9A%20%E0%BC%98%E2%99%A1%20%E2%8B%86%EF%BD%A1%CB%9A%20Hoshino%20Ruby.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/ruby%20hoshino%20(9).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/ruby%20hoshino%20(11).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(15).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(14).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(13).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20hoshino%20%F0%9F%A7%A1.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20_%20oshi%20no%20ko%20_.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20-%20%F0%9F%8C%9F%5BOshi%20no%20Ko%5D%F0%9F%8C%9F%20icons.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(10).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20%23oshinokk.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20(3).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%23oshinoko%20%23%EC%B5%9C%EC%95%A0%EC%9D%98%EC%95%84%EC%9D%B4.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%99%8D%F0%9D%99%AA%F0%9D%99%97%F0%9D%99%AE%20%F0%9D%99%83%F0%9D%99%A4%F0%9D%99%A8%F0%9D%99%9D%F0%9D%99%A4%F0%9D%99%9E%F0%9D%99%A3%F0%9D%99%A4.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8E%80%20%E2%8B%AE%20%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%20%F0%9D%92%8A%F0%9D%92%84%F0%9D%92%90%F0%9D%92%8F.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(3).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4%EF%B8%8F%F0%9D%91%AF%F0%9D%92%90%F0%9D%92%94%F0%9D%92%89%F0%9D%92%8A%F0%9D%92%8F%F0%9D%92%90%20%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%E2%9D%A4%EF%B8%8F.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E0%AD%A8%E0%A7%8E.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(19).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(18).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(17).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(16).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(16).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(15).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(14).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(13).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(12).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20%E2%99%A1.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20(4).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/(%F0%9F%8E%80)%20%20%E2%80%A6%20%20%E2%97%9E%20ruby%20%E2%97%9F%20%E2%98%86.jpeg"
]

const fallbackImage = 'https://files.catbox.moe/xr2m6u.jpg'
const matchedUrl = 'https://github.com/Dioneibi-rip'

global.rcanal = async (textoDelMensaje, m) => {
  const randomUrl = imagenes[Math.floor(Math.random() * imagenes.length)] || fallbackImage
  let rimg

  try {
    const response = await fetch(randomUrl)
    if (response.ok) {
      rimg = Buffer.from(await response.arrayBuffer())
    } else {
      throw new Error()
    }
  } catch (error) {
    try {
      const fallbackRes = await fetch(fallbackImage)
      rimg = Buffer.from(await fallbackRes.arrayBuffer())
    } catch {
      rimg = null
    }
  }

  return {
    extendedTextMessage: {
      text: `${matchedUrl}\n\n${textoDelMensaje}`,
      matchedText: matchedUrl,
      canonicalUrl: matchedUrl,
      title: global.botname || '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡in͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥',
      description: global.dev || '꒰ 🧺 ᑲіᥱᥒ᥎ᥱᥒіძ᥆ ᥲᥣ sᥙ́ρᥱr ᑲ᥆𝗍 ძᥱ ᥕһᥲ𝗍sᥲρρ ꒱',
      previewType: 'shadow',
      jpegThumbnail: rimg,
      contextInfo: {
        quotedMessage: m ? m.message : undefined,
        participant: m ? m.sender : undefined,
        stanzaId: m ? m.id : undefined,
        remoteJid: m ? m.chat : undefined,
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
          newsletterJid: global.channelRD?.id || '120363335626706839@newsletter',
          newsletterName: global.channelRD?.name || '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏsʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭',
          serverMessageId: -1
        }
      }
    }
  }
}

global.fkontak = global.createFakeContact()
global.channelRD = global.getRandomChannel()
global.saludo = global.getSaludo()
global.nombre = 'Anónimo'
global.taguser = '@0'

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'settings.js'"))
  import(`${file}?update=${Date.now()}`)
})