import db from '../../lib/database.js'

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

    // Resolver @lid
    if (who.endsWith('@lid')) {
        try {
            const pp = await conn.groupMetadata(m.chat)
            const dbUser = pp.participants.find(u => u.lid === who)
            if (dbUser) who = dbUser.id
        } catch (e) {}
    }

    let user = global.db.data.users[who]
    if (!user) {
        user = global.db.data.users[who] = { coin: 0, bank: 0 }
    }

    let txt = text.replace('@' + who.split('@')[0], '').trim()
    let dmt

    if (txt.toLowerCase().includes('all') || txt.toLowerCase().includes('todo')) {
        return m.reply('⚠️ Usa una cantidad válida. `all` no aplica para dar dinero.')
    } else {
        let cleanNum = txt.replace(/[^\d]/g, '')
        if (!cleanNum) return m.reply('⚠️ Ingresa la cantidad a dar.')
        dmt = parseInt(cleanNum)
    }

    if (dmt <= 0) return m.reply('⚠️ La cantidad debe ser mayor a 0.')

    user.coin += dmt

    m.reply(
        `💰 *Dinero agregado*\n» ${dmt}\n👤 @${who.split('@')[0]}\n📥 Billetera`,
        null,
        { mentions: [who] }
    )
}

handler.help = ['darcoin <@user> <cantidad>']
handler.tags = ['owner']
handler.command = ['darcoin', 'addcoin', 'givecoin']
handler.rowner = true

export default handler
