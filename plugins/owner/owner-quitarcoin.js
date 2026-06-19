let handler = async (m, { conn, text }) => {
    let who
    if (m.isGroup) {
        who = m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : m.quoted 
            ? m.quoted.sender 
            : false
    } else {
        who = m.chat
    }

    if (!who) return m.reply('⚠️ Menciona al usuario o cita un mensaje.')

    if (who.endsWith('@lid')) {
        try {
            const pp = await conn.groupMetadata(m.chat)
            const dbUser = pp.participants.find(u => u.lid === who)
            if (dbUser) who = dbUser.id
        } catch (e) { console.error('[quitarcoin] Error resolviendo LID:', e) }
    }

    let user = global.db?.getUser ? global.db.getUser(who) : global.db.getUser(who)
    if (!user) {
        user = global.db.getUser(who)
        user.coin = 0
        user.bank = 0
    }

    let txt = text.replace('@' + who.split('@')[0], '').trim()
    let dmt

    if (txt.toLowerCase().includes('all') || txt.toLowerCase().includes('todo')) {
        dmt = (user.coin || 0) + (user.bank || 0)
    } else {
        let cleanNum = txt.replace(/[^\d]/g, '')
        if (!cleanNum) return m.reply('⚠️ Ingresa la cantidad a quitar.')
        dmt = parseInt(cleanNum)
    }

    let total = (user.coin || 0) + (user.bank || 0)
    if (total < dmt)
        return m.reply(`⚠️ No tiene suficiente dinero.\n💸 Billetera: ${user.coin}\n🏦 Banco: ${user.bank}`)

    // 🔻 quitar primero de la billetera
    try {
        if (global.db && typeof global.db.updateUser === 'function') {
            const nextCoin = Math.max(0, (Number(user.coin) || 0) - dmt)
            const remainder = Math.max(0, dmt - (Number(user.coin) || 0))
            const nextBank = Math.max(0, (Number(user.bank) || 0) - remainder)
            global.db.updateUser(who, { coin: nextCoin, bank: nextBank })
        } else if (user.coin >= dmt) {
            user.coin -= dmt
            await global.db.write?.()
        } else {
            let resto = dmt - user.coin
            user.coin = 0
            user.bank -= resto
            await global.db.write?.()
        }
    } catch (error) {
        console.error(`[quitarcoin] No se pudo quitar dinero a ${who}:`, error)
        return m.reply('❌ No se pudo actualizar la economía en SQLite. Revisa la consola.')
    }

    m.reply(
        `💸 *Dinero quitado*\n» ${dmt}\n👤 @${who.split('@')[0]}`,
        null,
        { mentions: [who] }
    )
}

handler.help = ['quitarcoin <@user> <cantidad|all>']
handler.tags = ['owner']
handler.command = ['quitarcoin', 'removecoin', 'removecoins']
handler.rowner = true

export default handler
