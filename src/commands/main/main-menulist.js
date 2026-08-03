import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import { getMenuMedia } from '../../core/menu-media.js'

const menuMediaCache = new WeakMap()
const localCatalogoPath = path.join(process.cwd(), 'src', 'catalogo.jpg')

function getLocalCatalogoBuffer() {
return fs.readFileSync(localCatalogoPath)
}

let handler = async (m, { conn, usedPrefix }) => {
try {
const profile = conn.botProfile || {}
const botName = profile.botName || 'Ruby'
const prefix = (typeof usedPrefix === 'string' ? usedPrefix : (profile.customPrefix || '.'))
const isMainBot = conn.user.jid === global.conn?.user?.jid
const botStatusText = isMainBot ? '👑 *𝖡𝗈𝗍 𝖮𝖿𝗂𝖼𝗂𝖺𝗅 (𝖯𝗋𝗂𝗇𝖼𝗂𝗉𝖺𝗅)*' : '💫 *𝖲𝗎𝖻-𝖡𝗈𝗍 𝖠𝖼𝗍𝗂𝗏𝗈*'
let { exp, level, role } = global.db?.getUser?.(m.sender) || { exp: 0, level: 0, role: 'Novato' }
let name = await conn.getName(m.sender)
let _uptime = process.uptime() * 1000
let uptime = clockString(_uptime)
let totalreg = await Promise.resolve(global.db?.countUsers?.() ?? 0)
const fkontak = await getMenuQuoted(conn, m, botName)
const menuImage = global.db?.data?.bots?.[conn.user?.jid]?.menu
const media = await getMenuMedia(conn, 'menu', menuImage)
const headerMedia = media.videoMessage ? { videoMessage: media.videoMessage } : { imageMessage: media.imageMessage }
let sections = [{
title: '𝐒𝐄𝐋𝐄𝐂𝐂𝐈𝐎𝐍𝐄 𝐀𝐐𝐔𝐈',
rows: [
{ title: '⏤͟͟͞͞🪷⃞⃝⃤ 𝗠𝗘𝗡𝗨 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗢', description: `🍧 ꒰ 𝗺𝘂𝗲𝘀𝘁𝗿𝗮 𝘁𝗼𝗱𝗼𝘀 𝗹𝗼𝘀 𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝗱𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀 𝗲𝗻 ${botName} ꒱`, id: `${prefix}menuall` },
{ title: '⏤͟͟͞͞🍜⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦', description: '🎧 ꒰ 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮 𝗮𝘂𝗱𝗶𝗼𝘀, 𝘃𝗶𝗱𝗲𝗼𝘀, 𝗜𝗴, 𝗙𝗕, 𝗧𝗶𝗸𝗧𝗼𝗸 𝘆 𝗺𝗮́𝘀 ꒱', id: `${prefix}menudescargas` },
{ title: '⏤͟͟͞͞🫧⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗘𝗖𝗢𝗡𝗢𝗠𝗜́𝗔 & 𝗥𝗣𝗚', description: '🎮 ꒰ ¡𝗖𝗿𝗲𝗮 𝘁𝘂 𝗮𝘃𝗲𝗻𝘁𝘂𝗿𝗮! 𝗠𝗶𝗻𝗮, 𝗰𝗮𝘇𝗮, 𝗴𝗮𝗻𝗮 𝗼𝗿𝗼 𝘆 𝗱𝗼𝗺𝗶𝗻𝗮 𝗲𝗹 𝗥𝗣𝗚. ꒱', id: `${prefix}menueconomia` },
{ title: '⏤͟͟͞͞🐝⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗚𝗔𝗖𝗛𝗔', description: '🎭 ꒰ ¡𝗚𝗶𝗿𝗮 𝗲𝗹 𝗱𝗲𝘀𝘁𝗶𝗻𝗼 𝘆 𝗰𝗼𝗹𝗲𝗰𝗰𝗶𝗼𝗻𝗮 𝗵𝗲́𝗿𝗼𝗲𝘀 𝗲́𝗽𝗶𝗰𝗼𝘀! ꒱', id: `${prefix}menugacha` },
{ title: '⏤͟͟͞͞🫛⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗦𝗧𝗜Clikers', description: '✨ ꒰ 𝗖𝗿𝗲𝗮 𝘀𝘁𝗶𝗰𝗸𝗲rs 𝗮𝗻𝗶𝗺𝗮𝗱𝗼𝘀, 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗹𝗶𝘇𝗮𝗱𝗼𝘀 𝘆 𝘂́𝗻𝗶𝗰𝗼𝘀 ꒱', id: `${prefix}menusticker` },
{ title: '⏤͟͟͞͞🧊⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗛𝗘𝗥𝗥𝗔𝗠𝗜𝗘𝗡𝗧𝗔𝗦', description: '⚙️ ꒰ 𝗖𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝘂́𝘁𝗶𝗹𝗲𝘀 𝘆 𝗱𝗶𝘃𝗲𝗿𝘀𝗼𝘀 𝗽𝗮𝗿𝗮 𝗰𝗮𝗱𝗮 𝘀𝗶𝘁𝘂𝗮𝗰𝗶𝗼́𝗻 ꒱', id: `${prefix}menuherramientas` },
{ title: '⏤͟͟͞͞🍬⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗣𝗘𝗥𝗙𝗜🇱', description: '🧩 ꒰ 𝗔𝗱𝗮𝗽𝘁𝗮 𝘁𝘂 𝘂𝘀𝘂𝗮𝗿𝗶𝗼, 𝗿𝗲𝗴𝗶́𝘀𝘁𝗿𝗮𝘁𝗲 𝘆 𝗿𝗲𝘃𝗶𝘀𝗮 𝘁𝘂 𝗲𝘀𝘁𝗮𝗱𝗼 ꒱', id: `${prefix}menuperfil` },
{ title: '⏤͟͟͞͞🍟⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗚𝗥𝗨𝗣𝗢𝗦', description: '🌐 ꒰ 𝗛𝗲𝗿𝗿𝗮𝗺𝗶𝗲𝗻𝘁𝗮𝘀 𝗽𝗮𝗿𝗮 𝗹𝗮 𝗮𝗱𝗺𝗶𝗻𝗶𝘀𝘁𝗿𝗮𝗰𝗶𝗼́𝗻 𝗱𝗲 𝘁𝘂 𝗴𝗿𝘂𝗽𝗼 ꒱', id: `${prefix}menugrupo` },
{ title: '⏤͟͟͞͞🤖⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗜𝗔', description: '🧠 ꒰ 𝗖𝗵𝗮𝘁𝗚𝗣𝗧, 𝗚𝗲𝗺𝗶𝗻𝗶 𝘆 𝗖𝗼𝗽𝗶𝗹𝗼𝘁 𝗽𝗮𝗿𝗮 𝗰𝗼𝗻𝘃𝗲𝗿𝘀𝗮𝗿 𝘆 𝗿𝗲𝘀𝗼𝗹𝘃𝗲𝗿 𝗱𝘂𝗱𝗮𝘀 ꒱', id: `${prefix}menuia` },
{ title: '⏤͟͟͞͞🍥⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗔𝗡𝗜𝗠𝗘', description: '💢 ꒰ 𝗘𝘅𝗽𝗿𝗲́𝘀𝗮𝘁𝗲 𝗰𝗼𝗻 𝗿𝗲𝗮𝗰𝗰𝗶𝗼𝗻𝗲𝘀 𝗱𝗲 𝗮𝗻𝗶𝗺𝗲 𝗶𝗰𝗼́𝗻𝗶𝗰𝗮𝘀 ꒱', id: `${prefix}menuanime` },
{ title: '⏤͟͟͞͞🥡⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗝𝗨𝗘𝗚𝗢𝗦', description: '🎲 ꒰ 𝗣𝗿𝘂𝗲𝗯𝗮 𝘁𝘂 𝘀𝘂𝗲𝗿𝘁𝗲 𝘆 𝗿𝗲𝘁𝗮 𝗮 𝘁𝘂𝘀 𝗮𝗺𝗶𝗴𝗼𝘀 𝗲𝗻 𝗺𝗶𝗻𝗶-𝗷𝘂𝗲𝗴𝗼𝘀 ꒱', id: `${prefix}menujuegos` },
{ title: '⏤͟͟͞͞🍹⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗣𝗜𝗖𝗔𝗡𝗧𝗘 (NSFW)', description: '🔞 ꒰ 𝗔𝗰𝗰𝗲𝘀𝗼 𝗮 𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝗡𝗦𝗙𝗪, 𝘀𝗼𝗹𝗼 𝗽𝗮𝗿𝗮 𝗮𝗱𝘂𝗹𝘁𝗼𝘀 (+18) ꒱', id: `${prefix}menunsfw` },
{ title: '⏤͟͟͞͞🎲⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗗𝗘 𝗕𝗨́𝗦𝗤𝗨𝐄𝐃𝐀𝐒', description: '🌍 ꒰ 𝗕𝘂𝘀𝗰𝗮 𝗶𝗻𝗳𝗼, 𝗹𝗲𝘁𝗿𝗮𝘀, 𝘃𝗶𝗱𝗲𝗼𝘀 𝘆 𝗺𝘂𝗰𝗵𝗼 𝗺𝗮́𝘀 𝗲𝗻 𝗹𝗶́𝗻𝗲𝗮 ꒱', id: `${prefix}menubusquedas` },
{ title: '⏤͟͟͞͞🤖⃞⃝⃤ 𝗠𝗘𝗡𝗨́ 𝗝𝗔𝗗𝗜𝗕𝗢𝗧', description: '✨ ꒰ 𝗦𝘂𝗯-𝗕𝗼𝘁𝘀, 𝗰𝗼́𝗱𝗶𝗴𝗼𝘀, 𝗿𝘂𝘁𝗮𝘀 𝘆 𝘀𝗲𝘀𝗶𝗼𝗻𝗲𝘀 ꒱', id: `${prefix}menujadibot` }
]
}]
let beforeText = `𝙃𝙤𝙡𝙖 *${name}* ${ucapan()}
𝙢𝙞 𝙣𝙤𝙢𝙗𝙧𝙚 𝙚𝙨 *${botName}* ¡𝙚𝙨𝙥𝙚𝙧𝙤 𝙦𝙪𝙚 𝙚𝙨𝙩𝙚𝙨 𝙩𝙚𝙣𝙞𝙚𝙣𝙙𝙤 𝙪𝙣 𝙚𝙭𝙘𝙚𝙡𝙚𝙣𝙩𝙚 𝙙𝙞𝙖! 🧴  𖹥

♡  ∩_∩
（„• ֊ •„)♡
┏━━∪∪━⏤͟͟͞͞★꙲⃝͟🌷❈┉━━━┓
┃  *𝖨𝖭𝖥𝖮 𝖣𝖤L 𝖫𝖠 𝖡𝖮𝖳* ┃┈──❊:::::::¨¨*:::::::❊──┈
┃ ◦ 👑 *Creador:* Dioneibi
┃ ◦ 🌎 *Modo:* Pública
┃ ◦ 💻 *Baileys:* Multi Device
┃ ◦ ⏰ *Tiempo Activa:* ${uptime}
┃ ◦ 👥 *Usuarios:* ${totalreg}
┃ ${botStatusText}
┗━━━━⏤͟͟͞͞★꙲⃝͟🌷❈┉━━━━━━┛`
let bodyText = `🪷ᩚ⃟꙰⟡˖ ࣪𝗜𝖭𝖥𝖮 𝖣𝖤𝖫 𝖴𝖲𝖴𝖠𝖱𝖨𝖮 🪷⃟✿˚
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─
ი ̯ 🎋̸̶ *𝖭𝖮𝖬𝖡𝖱𝖤*: ${name}
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─
ი ̯ 🎋̸̶ *𝖤𝖷𝖯𝖤𝖱𝖨𝖤𝖭𝖢𝖨𝖠:* ${exp}
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─
ი ̯ 🎋̸̶ *𝖭𝖨𝖵𝖤𝖫:* ${level}
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─
ი ̯ 🎋̸̶ *𝖱𝖠𝖭𝖦𝖮:* ${role}
─━━━━┉❈⏤͟͟͞͞★꙲⃝͟🍁❈┉━━━━─`
const nativeButtons = [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '꒰꒰ 🍒 𝐌𝖾𝗇𝗎 𝐌𝖺𝗇𝗎𝖺𝗅 Ი꯭ᰍ', id: `${prefix}menumanual` }) }, { name: 'single_select', buttonParamsJson: JSON.stringify({ title: ' ❀⃘⃛͜ ۪۪۪݃𓉘᳟ี ⃞̸͢𑁃 ̚𓉝᳟ี𝐌𝐄𝐍𝐔 𝐁𝐎𝐓❀⃘⃛͜', sections }) }]
const interactiveMessage = proto.Message.InteractiveMessage.fromObject({ header: proto.Message.InteractiveMessage.Header.fromObject({ title: '', hasMediaAttachment: true, ...headerMedia }), body: proto.Message.InteractiveMessage.Body.fromObject({ text: `${beforeText}\n\n${bodyText}` }), footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `usa ${prefix}menumanual si no puedes usar los botones` }), nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: nativeButtons, messageParamsJson: JSON.stringify({ version: 1 }) }) })
let msgi = generateWAMessageFromContent(m.chat, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage } } }, { userJid: conn.user.jid, quoted: fkontak || m })
await conn.relayMessage(m.chat, msgi.message, { messageId: msgi.key.id })
m.react('💞')
} catch (e) {
conn.reply(m.chat, `꒰ 💔 Oops... ꒱ 𝗻𝗼 𝘀𝗲 𝗽𝘂𝗱𝗼 𝗰𝗮𝗿𝗴𝗮𝗿 𝗲𝗹 𝗺𝗲𝗻𝘂́.\n\n*Razón:* ${e}`, m)
throw e
}
}

handler.help = ['menu']
handler.tags = ['main']
handler.register = true
handler.command = ['menu', 'menú', 'help', 'listmenu']
export default handler

async function getMenuQuoted(conn, m, botName) {
const thumb = getLocalCatalogoBuffer()
return { key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' }, message: { productMessage: { product: { productImage: { jpegThumbnail: thumb }, title: `𝖬𝖤𝖭𝖴 𝖫𝖨𝖲𝖳 • ${botName.toUpperCase()}`, description: '╰┈➤ 𝖨𝖭𝖳𝖤𝖱𝖠𝖢𝖳𝖨𝖵𝖤 𝖬𝖤𝖭𝖴', retailerId: 'INFO • ESTADO', productImageCount: 1 }, businessOwnerJid: '0@s.whatsapp.net' } }, participant: '0@s.whatsapp.net' }
}


function clockString(ms) {
let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
return [d, 'D', h, 'H', m, 'M'].map(v => v.toString().padStart(2, '0')).join(' ')
}

function getHourInTimeZone(timeZone = 'America/Lima', date = new Date()) {
const hour = new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone }).format(date)
return Number(hour) % 24
}

function ucapan() {
const time = getHourInTimeZone('America/Lima')
if (time >= 5 && time < 12) return '𝘽𝙪𝙚𝙣𝙤𝙨 𝘿𝙞́𝙖𝙨 ☀️'
if (time >= 12 && time < 18) return '𝘽𝙪𝙚𝙣𝙖𝙨 𝙏𝙖𝙧𝙙𝙚𝙨 🌤️'
return '𝘽𝙪𝙚𝙣𝙖𝙨 𝙉𝙤𝙘𝙝𝙚𝙨 🌙'
}
