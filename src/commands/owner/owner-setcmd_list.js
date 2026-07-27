const handler = async (m, { conn }) => {
const sticker = global.db.getSection('sticker')
const entries = []
const mentions = []
for (const [key, value] of Object.entries(sticker)) {
if (value?.users && typeof value.users === 'object') {
for (const [creator, command] of Object.entries(value.users)) {
entries.push({ key, creator, ...command })
if (Array.isArray(command?.mentionedJid)) mentions.push(...command.mentionedJid)
}
continue
}
entries.push({ key, creator: value?.creator, ...value })
if (Array.isArray(value?.mentionedJid)) mentions.push(...value.mentionedJid)
}
conn.reply(m.chat, `
*< Lista de Comandos / Textos Asignados >*

${entries.map((value, index) => `*${index + 1}.-*\n*Codigo:* ${value.locked ? `*(Bloqueado)* ${value.key}` : value.key}\n*Creador:* ${value.creator || 'Desconocido'}\n*Comando/Texto* ${value.text || ''}`).join('\n\n') || `${emoji2} No hay comandos de stickers guardados.`}
`.trim(), null, { mentions })
}
handler.command = ['listcmd', 'cmdlist']
handler.rowner = true

export default handler
