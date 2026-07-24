function getTargetJid(m) {
return m.mentionedJid?.[0] || m.quoted?.sender || ''
}

function participantJid(participant = {}) {
return participant.id || participant.jid || participant.lid || ''
}

function isAdminParticipant(participant = {}) {
return ['admin', 'superadmin'].includes(participant.admin)
}

function isSameJid(a = '', b = '') {
return String(a || '').split(':')[0] === String(b || '').split(':')[0]
}

async function handler(m, { conn, participants = [] }) {
const user = getTargetJid(m)
if (!user) {
await m.react?.('❔')
return conn.reply(m.chat, `> 𝜗ৎ 𝖣𝖾𝖻𝖾𝗌 𝗆𝖾𝗇𝖼𝗂𝗈𝗇𝖺𝗋 𝖺 𝗎𝗇 𝗎𝗌𝗎𝖺𝗋𝗂𝗈 𝗉𝖺𝗋𝖺 𝗉𝗈𝖽𝖾𝗋 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋𝗅𝗈 𝖽𝖾𝗅 𝗀𝗋𝗎𝗉𝗈 🪽`, m)
}

const groupInfo = await conn.groupMetadata(m.chat)
const groupParticipants = Array.isArray(groupInfo?.participants) && groupInfo.participants.length ? groupInfo.participants : participants
const botJid = conn.user?.jid || conn.user?.id || ''
const botParticipant = groupParticipants.find(p => isSameJid(participantJid(p), botJid))
const targetParticipant = groupParticipants.find(p => isSameJid(participantJid(p), user))
const ownerGroup = groupInfo.owner || `${m.chat.split('-')[0]}@s.whatsapp.net`
const ownerBot = `${global.owner?.[0]?.[0] || ''}@s.whatsapp.net`

if (!targetParticipant) return conn.reply(m.chat, `> 🌨️ (っ- ‸ - ς) 𝖤𝗅 𝗎𝗌𝗎𝖺𝗋𝗂𝗈 𝗊𝗎𝖾 𝗆𝖾𝗇𝖼𝗂𝗈𝗇𝖺𝗌𝗍𝖾 𝗒𝖺 𝗇𝗈 𝖾𝗌𝗍𝖺́ 𝖾𝗇 𝖾𝗅 𝗀𝗋𝗎𝗉𝗈... 💧`, m)
if (isSameJid(user, botJid)) return conn.reply(m.chat, `> 🧊 ¡𝖤𝗒! 𝖭𝗈 𝗆𝖾 𝗉𝗎𝖾𝖽𝗈 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺 𝗆𝗂́ 𝗆𝗂𝗌𝗆𝗈 𝖽𝖾𝗅 𝗀𝗋𝗎𝗉𝗈 🪺`, m)
if (isSameJid(user, ownerGroup)) return conn.reply(m.chat, `> 💍 𝖭𝗈 𝗉𝗎𝖾𝖽𝗈 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺𝗅 𝗉𝗋𝗈𝗉𝗂𝖾𝗍𝖺𝗋𝗂𝗈 𝖽𝖾𝗅 𝗀𝗋𝗎𝗉𝗈, ¡𝖾𝗌 𝖾𝗅 𝗃𝖾𝖿𝖾! 👑`, m)
if (isSameJid(user, ownerBot)) return conn.reply(m.chat, `> 🩵 𝖭𝗈 𝗉𝗎𝖾𝖽𝗈 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺 𝗆𝗂 𝖼𝗋𝖾𝖺𝖽𝗈𝗋... 🍥`, m)
if (isAdminParticipant(targetParticipant)) return conn.reply(m.chat, `> 🧼 𝖫𝗈 𝗌𝗂𝖾𝗇𝗍𝗈, 𝗇𝗈 𝗉𝗎𝖾𝖽𝗈 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺 𝗈𝗍𝗋𝗈 𝖺𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋 𝖽𝖾𝗅 𝗀𝗋𝗎𝗉𝗈 🐟`, m)

await m.react?.('⏳')
try {
await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
await m.react?.('✅')
const kickMsg = `
∩᷼∩ׂㅤ 𝖴𝗌𝗎𝖺𝗋𝗂𝗈  𝖤𝗑𝗉𝗎𝗅𝗌𝖺𝖽𝗈 ㅤׄ꣓꣓🌨️ㅤׅ  
`.trim()
return conn.reply(m.chat, kickMsg, m)
} catch (error) {
console.error('[admin:kick] groupParticipantsUpdate failed', error)
await m.react?.('💔')
return conn.reply(m.chat, `> 💧 (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖺𝗅 𝗂𝗇𝗍𝖾𝗇𝗍𝖺𝗋 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋 𝖺𝗅 𝗎𝗌𝗎𝖺𝗋𝗂𝗈... 🪟`, m)
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