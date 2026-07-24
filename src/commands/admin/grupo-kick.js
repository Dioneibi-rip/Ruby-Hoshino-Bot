import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

function isAdminParticipant(participant = {}) {
return ['admin', 'superadmin'].includes(participant.admin)
}

async function handler(m, { conn, participants = [] }) {
let user = await resolveInteractionTarget(m, conn)

if (!user) {
await m.react?.('❔')
return conn.reply(m.chat, `> 𝜗ৎ ¡𝖧𝗈𝗅𝖺 𝗅𝗂𝗇𝖽𝗑! 𝖣𝖾𝖻𝖾𝗌 𝗆𝖾𝗇𝖼𝗂𝗈𝗇𝖺𝗋 𝗈 𝗋𝖾𝗌𝗉𝗈𝗇𝖽𝖾𝗋 𝖺 𝗎𝗇 𝗎𝗌𝗎𝖺𝗋𝗂𝗈 𝗉𝖺𝗋𝖺 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋𝗅𝗈 🪽`, m)
}

const groupInfo = await conn.groupMetadata(m.chat)
const groupParticipants = Array.isArray(groupInfo?.participants) && groupInfo.participants.length ? groupInfo.participants : participants
const botJid = conn.user?.jid || conn.user?.id || ''
const ownerGroup = groupInfo.owner || `${m.chat.split('-')[0]}@s.whatsapp.net`
const ownerBot = `${global.owner?.[0]?.[0] || ''}@s.whatsapp.net`

let nameTarget = await resolveIdentityName(conn, user, { fallback: `${String(user).split('@')[0]}` })

const targetParticipant = groupParticipants.find(p => p.id === user || p.lid === user || p.id.includes(user.split('@')[0]) || (p.lid && p.lid.includes(user.split('@')[0])))

if (!targetParticipant) return conn.reply(m.chat, `> 🌨️ (っ- ‸ - ς) \`${nameTarget}\` 𝗒𝖺 𝗇𝗈 𝖾𝗌𝗍𝖺́ 𝖾𝗇 𝖾𝗅 𝗀𝗋𝗎𝗉𝗈... 💧`, m)
if (user.includes(botJid.split(':')[0].split('@')[0])) return conn.reply(m.chat, `> 🧊 ¡𝖤𝗒! 𝖭𝗈 𝗆𝖾 𝗉𝗎𝖾𝖽𝗈 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺 𝗆𝗂́ 𝗆𝗂𝗌𝗆𝗈 𝖽𝖾𝗅 𝗀𝗋𝗎𝗉𝗈 🪺`, m)
if (user.includes(ownerGroup.split('@')[0])) return conn.reply(m.chat, `> 💍 𝖭𝗈 𝗉𝗎𝖾𝖽𝗈 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺𝗅 𝗉𝗋𝗈𝗉𝗂𝖾𝗍𝖺𝗋𝗂𝗈 𝖽𝖾𝗅 𝗀𝗋𝗎𝗉𝗈, ¡𝖾𝗌 𝖾𝗅 𝗃𝖾𝖿𝖾! 👑`, m)
if (user.includes(ownerBot.split('@')[0])) return conn.reply(m.chat, `> 🩵 𝖭𝗈 𝗉𝗎𝖾𝖽𝗈 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺 𝗆𝗂 𝖼𝗋𝖾𝖺𝖽𝗈𝗋... 🍥`, m)
if (isAdminParticipant(targetParticipant)) return conn.reply(m.chat, `> 🧼 𝖫𝗈 𝗌𝗂𝖾𝗇𝗍𝗈, 𝗇𝗈 𝗉𝗎𝖾𝖽𝗈 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺 \`${nameTarget}\` 𝗉𝗈𝗋𝗊𝗎𝖾 𝖾𝗌 𝖺𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋 🐟`, m)

await m.react?.('⏳')
try {
await conn.groupParticipantsUpdate(m.chat, [targetParticipant.id], 'remove')
await m.react?.('✅')
const kickMsg = `
🌨️ㅤׅ  \`${nameTarget}\`ㅤׂ   𝖿𝗎𝖾 𝖾𝗅𝗂𝗆𝗂𝗇𝖺𝖽𝗈ㅤ֔ 🪽
`.trim()
return conn.reply(m.chat, kickMsg, m, { mentions: [targetParticipant.id] })
} catch (error) {
console.error('[admin:kick] groupParticipantsUpdate failed', error)
await m.react?.('💔')
return conn.reply(m.chat, `> 💧 (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖺𝗅 𝗂𝗇𝗍𝖾𝗇𝗍𝖺𝗋 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺 \`${nameTarget}\`... 🪟`, m)
}
}

handler.help = ['kick']
handler.tags = ['grupo']
handler.command = ['kick','echar','hechar','sacar','ban']
handler.admin = true
handler.group = true
handler.register = true
handler.botAdmin = true
export default handler