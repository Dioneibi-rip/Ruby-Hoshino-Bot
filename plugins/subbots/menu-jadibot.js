let handler = async (m, {conn, usedPrefix}) => {
const prefix = usedPrefix || '#'
const text = `✦ 𝙍𝙪𝙗𝙮 𝙃𝙤𝙨𝙝𝙞𝙣𝙤 ✦\n✨ 𝙈𝙚𝙣ú 𝙅𝙖𝙙𝙞𝙗𝙤𝙩 ✨\n\n🌟 ${prefix}code\n✦ Vincula un sub-bot con código.\n\n🌟 ${prefix}qr\n✦ Vincula un sub-bot con QR.\n\n🌟 ${prefix}serbot\n✦ Inicia o gestiona una sesión clonada.\n\n🌟 ${prefix}stop\n✦ Detiene la sesión jadibot activa.\n\n🌟 ${prefix}setmoneda\n✦ Configura la moneda del bot.\n\n✨ Disponible para Ruby principal y sub-bots.`
await conn.reply(m.chat, text, m)
}
handler.help = ['menujadibot', 'menuserbot', 'jadibotmenu']
handler.tags = ['jadibot']
handler.command = ['menujadibot', 'menuserbot', 'jadibotmenu', 'menújadibot']
export default handler
