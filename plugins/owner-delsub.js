import { promises as fsPromises, existsSync } from "fs"
import path from 'path'
import ws from 'ws'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = (await import("@whiskeysockets/baileys")).default

let handler = async (m, { conn, command, usedPrefix, args, isOwner }) => {
    
    const toFancy = (str) => {
        const map = {
            'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ',
            'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴',
            'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x',
            'y': 'ᥡ', 'z': 'z', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F',
            'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
            'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V',
            'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
        }
        return str.split('').map(c => map[c] || c).join('')
    }

    if (!isOwner) {
        return conn.reply(m.chat, `🚫 ${toFancy("Solo el propietario puede usar este comando.")}`, m)
    }

    const users = [...new Set([...global.conns.filter(c => c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED)])]

    if (users.length === 0) {
        return conn.reply(m.chat, `💤 ${toFancy("No hay Sub-Bots conectados actualmente.")}`, m)
    }

    if (args[0] === '-all' || args[0] === '--all') {
        await m.react('🗑️')
        
        let eliminados = 0
        let errores = 0

        for (const subBot of users) {
            try {
                const numero = subBot.user.jid.split('@')[0]
                const dirPath = `./${jadi}/${numero}`
                try {
                    subBot.ws.close()
                } catch (e) {
                    console.error(`Error cerrando conexión de ${numero}:`, e)
                }
                subBot.ev.removeAllListeners()
                let i = global.conns.indexOf(subBot)
                if (i >= 0) {
                    delete global.conns[i]
                    global.conns.splice(i, 1)
                }
               
                if (existsSync(dirPath)) {
                    await fsPromises.rm(dirPath, { recursive: true, force: true })
                }
                
                eliminados++
            } catch (error) {
                console.error(`Error eliminando sub-bot:`, error)
                errores++
            }
        }

        await m.react('✅')
        return conn.reply(m.chat, 
            `🌈 *${toFancy("Limpieza Completa")}*\n\n` +
            `✨ ${toFancy("Sub-Bots eliminados:")} ${eliminados}\n` +
            `${errores > 0 ? `⚠️ ${toFancy("Errores:")} ${errores}\n` : ''}` +
            `\n${toFancy("Todas las sesiones han sido eliminadas.")}`, 
            m
        )
    }

    if (!args[0]) {
        let listaSubBots = users.map((v, i) => {
            const numero = v.user.jid.split('@')[0]
            const nombre = v.user.name || toFancy('Sin Nombre')
            return `*${i + 1}.* ${nombre}\n   ➤ *${toFancy("Número")}:* +${numero}`
        }).join('\n\n')

        const headerText = `*${toFancy("ELIMINAR SUB-BOT")}* 🗑️\n\n` +
            `${toFancy("Selecciona el número del Sub-Bot que deseas eliminar:")}\n\n` +
            `${listaSubBots}\n\n` +
            `───────────────\n` +
            `📝 *${toFancy("Uso")}:*\n` +
            `• ${usedPrefix}${command} <número>\n` +
            `• ${usedPrefix}${command} -all ${toFancy("(eliminar todos)")}`

        let mediaMessage = await prepareWAMessageMedia({ 
            image: { url: 'https://files.catbox.moe/65rdkc.jpg' } 
        }, { upload: conn.waUploadToServer })

        let buttons = users.map((v, i) => ({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: `🗑️ ${toFancy("Eliminar")} #${i + 1}`,
                id: `${usedPrefix}${command} ${i + 1}`
            })
        }))

        buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: `💥 ${toFancy("Eliminar Todos")}`,
                id: `${usedPrefix}${command} -all`
            })
        })

        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: headerText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: toFancy('Gestión de Sub-Bots')
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            hasMediaAttachment: true,
                            imageMessage: mediaMessage.imageMessage
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: buttons.slice(0, 10) // WhatsApp limita a 10 botones
                        })
                    })
                }
            }
        }, { quoted: m })

        return await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    }

    const seleccion = parseInt(args[0])
    
    if (isNaN(seleccion) || seleccion < 1 || seleccion > users.length) {
        return conn.reply(m.chat, 
            `❌ ${toFancy("Número inválido. Debe ser entre 1 y")} ${users.length}`, 
            m
        )
    }

    const subBotSeleccionado = users[seleccion - 1]
    const numero = subBotSeleccionado.user.jid.split('@')[0]
    const nombre = subBotSeleccionado.user.name || toFancy('Sin Nombre')
    const dirPath = `./${jadi}/${numero}`

    try {
        await m.react('🗑️')

        // Cerrar conexión
        try {
            subBotSeleccionado.ws.close()
        } catch (e) {
            console.error(`Error cerrando conexión:`, e)
        }
        subBotSeleccionado.ev.removeAllListeners()
        let i = global.conns.indexOf(subBotSeleccionado)
        if (i >= 0) {
            delete global.conns[i]
            global.conns.splice(i, 1)
        }

        // Eliminar carpeta de sesión
        if (existsSync(dirPath)) {
            await fsPromises.rm(dirPath, { recursive: true, force: true })
        }

        await m.react('✅')
        return conn.reply(m.chat, 
            `🗑️ *${toFancy("Sub-Bot Eliminado")}*\n\n` +
            `✨ *${toFancy("Usuario")}:* ${nombre}\n` +
            `📱 *${toFancy("Número")}:* +${numero}\n\n` +
            `${toFancy("La sesión ha sido eliminada exitosamente.")}`, 
            m
        )

    } catch (error) {
        console.error('Error eliminando sub-bot:', error)
        await m.react('❌')
        return conn.reply(m.chat, 
            `⚠️ ${toFancy("Ocurrió un error al eliminar el Sub-Bot.")}`, 
            m
        )
    }
}

handler.help = ['delsub']
handler.tags = ['serbot']
handler.command = ['delsub', 'deletesubot', 'eliminarsubot']
handler.rowner = true

export default handler