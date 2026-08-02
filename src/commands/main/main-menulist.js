import { getBotProfile } from '../../core/botProfileStore.js'
import { getMenuBanner } from '../../core/menu-banner.js'
const DEFAULT_BANNER = 'https://files.catbox.moe/bi19e7.png'

let handler = async (m, { conn, usedPrefix }) => {
const profile = conn.botProfile || (await getBotProfile(conn.session?.id))
const botName = profile.botName || 'Ruby Hoshino'
const prefix = profile.customPrefix || usedPrefix || '#'
const totalCommands = Object.values(global.plugins || {}).filter(v => v.help && v.tags).length
const uptime = clockString(process.uptime() * 1000)
const totalreg = await Promise.resolve(global.db.countUsers?.() ?? 0)
const name = await conn.getName(m.sender)
const rows = [
['🪷 Menú completo', 'Todos los comandos disponibles.', 'menuall'],
['🍜 Descargas', 'YouTube, TikTok, Instagram, Facebook y más.', 'menudescargas'],
['🫧 Economía & RPG', 'Banco, mina, tienda, aventura y economía.', 'menueconomia'],
['🐝 Gacha', 'Colección, ventas, trades y favoritos.', 'menugacha'],
['🫛 Stickers', 'Stickers, brat, attp, wm y convertidores.', 'menusticker'],
['🧊 Herramientas', 'Utilidades, logos, wiki, ssweb y más.', 'menuherramientas'],
['🍬 Perfil', 'Registro, perfil, niveles y premium.', 'menuperfil'],
['🍟 Grupos', 'Administración y seguridad de grupos.', 'menugrupo'],
['🤖 IA', 'ChatGPT, Gemini, Copilot y asistentes.', 'menuia'],
['🍥 Anime', 'Reacciones y comandos anime.', 'menuanime'],
['🥡 Juegos', 'Mini-juegos y diversión.', 'menujuegos'],
['🍹 NSFW', 'Comandos +18 para grupos autorizados.', 'menunsfw'],
['🎲 Búsquedas', 'Buscadores de anime, npm, manga y más.', 'menubusquedas'],
['🤖 Jadibot', 'Sub-Bots, sesiones y personalización.', 'menujadibot']
]
const list = rows.map(([title, description, id]) => `│ ${title}\n│ ${description}\n│ Comando: ${prefix}${id}`).join('\n├────────────\n')
const text = `╭─「 ${botName} 」\n│ Hola, *${name}*\n│ Prefijo activo: *${prefix}*\n│ Comandos cargados: *${totalCommands}*\n│ Usuarios registrados: *${totalreg}*\n│ Uptime: *${uptime}*\n╰────────────\n\n╭─「 MENÚS DISPONIBLES 」\n${list}\n╰────────────\n\nResponde o escribe cualquier comando mostrado para abrir su categoría.`
return conn.sendMessage(m.chat, { image: { url: getMenuBanner(profile, 'list', DEFAULT_BANNER) }, caption: text, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m })
}

handler.help = ['menulist']
handler.tags = ['main']
handler.register = true
handler.command = ['menu', 'menú', 'help', 'listmenu', 'menulist']
export default handler

function clockString(ms) {
let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
return `${d}D ${h}H ${m}M`
}
