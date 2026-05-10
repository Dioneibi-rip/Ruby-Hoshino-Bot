import fetch from 'node-fetch'

let handler = async (m, { conn, command, text, args, participants, isBotAdmin, isAdmin, isOwner }) => {
    

    // Identificar al usuario
    let who
    if (m.mentionedJid[0]) who = m.mentionedJid[0]
    else if (m.quoted) who = m.quoted.sender
    else return m.reply('Debes mencionar o responder al mensaje del usuario. 🧐')

    // Validar que el usuario no sea el bot o un admin
    let user = global.db.data.users[who]
    if (!user) {
        global.db.data.users[who] = { muto: false }
        user = global.db.data.users[who]
    }

    const bot = global.db.data.settings[conn.user.jid] || {}
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
    
    if (who === conn.user.jid) return m.reply('No puedo mutearme a mí mismo. 🤖')
    
    // Comprobar si el objetivo es admin (Opcional: Si quieres que admins se muteen entre sí, borra esto)
    let groupMetadata = await conn.groupMetadata(m.chat)
    let groupAdmins = groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id)
    if (groupAdmins.includes(who) && !isOwner) return m.reply('No puedo mutear a otro administrador. 🛡️')

    // --- LÓGICA DE UNMUTE ---
    if (command === 'unmute' || command === 'desmutear') {
        if (!user.muto) return m.reply('El usuario no estaba muteado. 🤷‍♂️')
        
        user.muto = false
        
        // Mensaje FakeLocation UNMUTE
        let fakeLocationUnmute = {
            key: { participants: '0@s.whatsapp.net', fromMe: false, id: 'Halo' },
            message: {
                locationMessage: {
                    name: '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗱𝗲𝗺𝘂𝘁𝗮𝗱𝗼',
                    jpegThumbnail: await (await fetch('https://telegra.ph/file/aea704d0b242b8c41bf15.png')).buffer(),
                    vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Free;;;\nFN:Free\nEND:VCARD'
                }
            },
            participant: '0@s.whatsapp.net'
        };

        return conn.reply(m.chat, `✅ *El usuario @${who.split`@`[0]} ha sido desmuteado.*\nYa puede hablar de nuevo.`, fakeLocationUnmute, { mentions: [who] })
    }

    // --- LÓGICA DE MUTE ---
    if (command === 'mute' || command === 'silenciar') {
        if (user.muto) return m.reply('El usuario ya está muteado. 🤐')

        user.muto = true

        // Lógica para Mute Temporal
        let duration = null
        let timerLabel = ""
        
        // Intentar leer el tiempo del argumento (ej: .mute @user 1m)
        // Buscamos argumentos que no sean la mención
        let timeArg = args.find(arg => !arg.includes('@') && (arg.endsWith('m') || arg.endsWith('h') || arg.endsWith('s')))
        
        if (timeArg) {
            let value = parseInt(timeArg.slice(0, -1))
            let unit = timeArg.slice(-1)
            
            if (!isNaN(value)) {
                if (unit === 's') duration = value * 1000
                else if (unit === 'm') duration = value * 60000
                else if (unit === 'h') duration = value * 3600000
                
                timerLabel = `\n⏱️ *Tiempo:* ${value}${unit === 'm' ? ' minuto(s)' : unit === 'h' ? ' hora(s)' : ' segundo(s)'}`
            }
        }

        // Mensaje FakeLocation MUTE
        let fakeLocationMute = {
            key: { participants: '0@s.whatsapp.net', fromMe: false, id: 'Halo' },
            message: {
                locationMessage: {
                    name: '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼',
                    jpegThumbnail: await (await fetch('https://telegra.ph/file/f8324d9798fa2ed2317bc.png')).buffer(),
                    vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Muted;;;\nFN:Muted\nEND:VCARD'
                }
            },
            participant: '0@s.whatsapp.net'
        };

        await conn.reply(m.chat, `🔇 *Usuario Silenciado*\n@${who.split`@`[0]} ha sido muteado.${timerLabel}\n\nSus mensajes serán eliminados automáticamente.`, fakeLocationMute, { mentions: [who] })

        // Ejecutar el temporizador si existe duración
        if (duration) {
            setTimeout(async () => {
                // Verificar si sigue muteado antes de desmutear (por si un admin lo desmuteó manualmente antes)
                if (user.muto) {
                    user.muto = false
                    await conn.sendMessage(m.chat, { text: `🔔 *El mute temporal de @${who.split`@`[0]} ha terminado.*`, mentions: [who] })
                }
            }, duration)
        }
    }
}

handler.command = /^(mute|silenciar|unmute|desmutear)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
