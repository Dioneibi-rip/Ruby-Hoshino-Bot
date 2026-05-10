const userSpamData = Object.create(null)

const TIME_WINDOW_MS = 5000
const MESSAGE_LIMIT = 10
const PENALTY_RESET = {
  1: 30000,
  2: 60000,
  3: 120000,
}

function resetUserSpamState(userData, user) {
  userData.antiBan = 0
  userData.messageCount = 1
  userData.warnedLevel = 0

  user.antispam = 0
  user.messageSpam = 0
  user.banned = false
}

let handler = m => m
handler.before = async function (m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, isPrems }) {
  const bot = global.db.data.settings[conn.user.jid] || {}
  if (!bot.antiSpam) return

  if (!m.isGroup) return

  const chat = global.db.data.chats[m.chat]
  if (chat.modoadmin) return

  if (isOwner || isROwner || isAdmin || !isBotAdmin || isPrems) return

  const user = global.db.data.users[m.sender]
  const sender = m.sender
  const now = Date.now()

  const userData = userSpamData[sender] || (userSpamData[sender] = {
    lastMessageTime: now,
    messageCount: 1,
    antiBan: 0,
    warnedLevel: 0,
  })

  const timeDifference = now - userData.lastMessageTime

  if (userData.antiBan > 0 && userData.warnedLevel !== userData.antiBan) {
    userData.warnedLevel = userData.antiBan

    const motive = userData.antiBan === 1
      ? '✦ No hagas spam.'
      : userData.antiBan === 2
        ? '✦ No hagas spam...'
        : '✦ Seras eliminado(a) por hacer spam.'

    await conn.reply(m.chat, motive, m, { mentions: [sender] })
    user.messageSpam = motive

    if (userData.antiBan === 3) {
      await conn.groupParticipantsUpdate(m.chat, [sender], 'remove')
    }
  }

  if (timeDifference <= TIME_WINDOW_MS) {
    userData.messageCount += 1

    if (userData.messageCount >= MESSAGE_LIMIT) {
      if (userData.antiBan > 2) {
        userData.lastMessageTime = now
        return
      }

      const mention = `@${sender.split('@')[0]}`
      const warningMessage = `✦ *Mucho Spam*\n\n✐ 𝙐𝙨𝙪𝙖𝙧𝙞𝙤: ${mention}`
      await conn.reply(m.chat, warningMessage, m, { mentions: [sender] })

      user.banned = true
      userData.antiBan += 1
      userData.messageCount = 1

      const currentLevel = userData.antiBan
      setTimeout(() => {
        if (userData.antiBan === currentLevel) {
          resetUserSpamState(userData, user)
        }
      }, PENALTY_RESET[currentLevel])
    }
  } else if (timeDifference >= 2000) {
    userData.messageCount = 1
  }

  userData.lastMessageTime = now
}

export default handler
