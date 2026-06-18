const parseDuration = (args = []) => {
    const timeArg = args.find(arg => /^\d+[smh]$/i.test(arg))
    if (!timeArg) return { duration: null, label: '' }

    const value = Number.parseInt(timeArg.slice(0, -1), 10)
    const unit = timeArg.slice(-1).toLowerCase()
    if (!Number.isFinite(value) || value <= 0) return { duration: null, label: '' }

    const multipliers = { s: 1000, m: 60000, h: 3600000 }
    const names = { s: 'segundo(s)', m: 'minuto(s)', h: 'hora(s)' }
    return {
        duration: value * multipliers[unit],
        label: `\n⏱️ *Tiempo:* ${value} ${names[unit]}`
    }
}

const handler = async (m, { conn, command, args, groupMetadata, isOwner }) => {
    let who
    if (m.mentionedJid?.[0]) who = m.mentionedJid[0]
    else if (m.quoted) who = m.quoted.sender
    else return m.reply('Debes mencionar o responder al mensaje del usuario. 🧐')

    const botJid = conn.decodeJid?.(conn.user?.jid || conn.user?.id) || conn.user?.jid
    if (who === botJid) return m.reply('No puedo mutearme a mí mismo. 🤖')

    let user = global.db.getUser(who)
    if (!user) user = global.db.getUser(who)
    if (!user.mutedChats || typeof user.mutedChats !== 'object') user.mutedChats = {}

    const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
    const groupAdmins = participants
        .filter(v => v.admin === 'admin' || v.admin === 'superadmin' || v.admin === 'creator' || v.admin === true)
        .map(v => v.jid || v.id)
    if (groupAdmins.includes(who) && !isOwner) return m.reply('No puedo mutear a otro administrador. 🛡️')

    if (command === 'unmute' || command === 'desmutear') {
        if (!user.mutedChats[m.chat] && !(user.muto && (!user.mutoChat || user.mutoChat === m.chat))) {
            return m.reply('El usuario no estaba muteado. 🤷‍♂️')
        }

        user.mutedChats[m.chat] = false
        if (!Object.values(user.mutedChats).some(Boolean)) user.muto = false
        if (user.mutoChat === m.chat) delete user.mutoChat

        return conn.reply(m.chat, `✅ *El usuario @${who.split`@`[0]} ha sido desmuteado.*\nYa puede hablar de nuevo.`, m, { mentions: [who] })
    }

    if (user.mutedChats[m.chat] || (user.muto && (!user.mutoChat || user.mutoChat === m.chat))) {
        return m.reply('El usuario ya está muteado. 🤐')
    }

    user.muto = true
    user.mutoChat = m.chat
    user.mutedChats[m.chat] = true

    const { duration, label } = parseDuration(args)
    await conn.reply(m.chat, `🔇 *Usuario Silenciado*\n@${who.split`@`[0]} ha sido muteado.${label}\n\nSus mensajes serán eliminados automáticamente.`, m, { mentions: [who] })

    if (duration) {
        setTimeout(async () => {
            if (user.mutedChats?.[m.chat]) {
                user.mutedChats[m.chat] = false
                if (!Object.values(user.mutedChats).some(Boolean)) user.muto = false
                if (user.mutoChat === m.chat) delete user.mutoChat
                await conn.sendMessage(m.chat, { text: `🔔 *El mute temporal de @${who.split`@`[0]} ha terminado.*`, mentions: [who] }).catch(() => {})
            }
        }, duration)
    }
}

handler.command = ['mute','silenciar','unmute','desmutear']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
