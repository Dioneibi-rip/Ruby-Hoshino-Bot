import { promises as fsPromises, existsSync, rmSync } from "fs"
import path, { join } from 'path'
import ws from 'ws'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = (await import("@whiskeysockets/baileys")).default

let handler = async (m, { conn, command, usedPrefix, args, text, isOwner }) => {

    const isDeleteSession = /^(deletesesion|deletebot|deletesession|deletesesaion)$/i.test(command)
    const isPauseBot = /^(stop|pausarai|pausarbot)$/i.test(command)
    const isShowBots = /^(bots|sockets|socket)$/i.test(command)

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

    const reportError = async (e) => {
        await m.reply(`⚠️ ${toFancy("Ocurrió un error inesperado, lo siento mucho...")}`)
        console.error(e)
    }

    const convertirMsAFormato = (ms) => {
        if (!ms || ms < 1000) return toFancy('Recién conectado')
        let segundos = Math.floor(ms / 1000)
        let minutos = Math.floor(segundos / 60)
        let horas = Math.floor(minutos / 60)
        let días = Math.floor(horas / 24)
        segundos %= 60; minutos %= 60; horas %= 24
        const parts = []
        if (días > 0) parts.push(`${días}d`)
        if (horas > 0) parts.push(`${horas}h`)
        if (minutos > 0) parts.push(`${minutos}m`)
        if (segundos > 0) parts.push(`${segundos}s`)
        return parts.join(', ') || toFancy('Justo ahora')
    }
    
    if (isDeleteSession) {
        const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
        const uniqid = `${who.split('@')[0]}`
        const dirPath = `./${jadi}/${uniqid}`

        if (!existsSync(dirPath)) {
            return conn.sendMessage(m.chat, {
                text: `🚫 *${toFancy("Sesión no encontrada")}*\n\n✨ ${toFancy("No tienes una sesión activa.")}\n\n🔰 ${toFancy("Puedes crear una con:")}\n*${usedPrefix}qr*\n\n📦 ${toFancy("Obtener código:")}\n*${usedPrefix}code*`
            }, { quoted: m })
        }

        if (global.conn.user.jid !== conn.user.jid) {
            return conn.sendMessage(m.chat, {
                text: `💬 ${toFancy("Este comando solo puede usarse desde el Bot Principal.")}`,
            }, { quoted: m })
        }

        try {
            await m.react('🗑️')
            await fsPromises.rm(dirPath, { recursive: true, force: true })
            await conn.sendMessage(m.chat, {
                text: `🌈 ${toFancy("¡Todo limpio! Tu sesión ha sido eliminada con éxito.")}`
            }, { quoted: m })
        } catch (e) {
            reportError(e)
        }
    }
    else if (isPauseBot) {
        if (global.conn.user.jid == conn.user.jid) {
            return conn.reply(m.chat, `🚫 ${toFancy("No puedes pausar el bot principal.")}`, m)
        }
        await conn.reply(m.chat, `🔕 *${botname || 'Sub-Bot'} ${toFancy("ha sido pausado.")}*`, m)
        conn.ws.close()
    }

    else if (isShowBots) {
        const users = [...new Set([...global.conns.filter(c => c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED)])]
        
        let listaSubBots = users.map((v, i) => {
            const uptime = v.uptime ? convertirMsAFormato(Date.now() - v.uptime) : toFancy('Desconocido')
            const numero = v.user.jid.split('@')[0]
            const nombre = v.user.name || toFancy('Sin Nombre')
            return `╭━ • 🤖 *SUB-BOT ${i + 1}* • ━
│➤ *${toFancy("Usuario")}:* ${nombre}
│➤ *${toFancy("Número")}:* wa.me/${numero}
│➤ *${toFancy("Activo")}:* ${uptime}
╰━━━━━━━━━━━━━`
        }).join('\n\n')

        const finalMessage = users.length > 0 ? listaSubBots : `💤 ${toFancy("Actualmente no hay Sub-Bots conectados.")}`
        const headerText = `*${toFancy("SUB-BOTS CONECTADOS")}* ✨\n\n${toFancy("Total Activos:")} ${users.length}\n${users.length > 0 ? '───────────────\n' : ''}${finalMessage}`

        let mediaMessage = await prepareWAMessageMedia({ 
            image: { url: 'https://files.catbox.moe/65rdkc.jpg' } 
        }, { upload: conn.waUploadToServer })

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
                            buttons: [
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: toFancy("sᥱr sᥙᑲ-ᑲ᥆𝗍 (QR)"),
                                        id: `${usedPrefix}qr`
                                    })
                                },
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: toFancy("Oᑲ𝗍ᥱᥒᥱr Cóძіg᥆"),
                                        id: `${usedPrefix}code`
                                    })
                                }
                            ]
                        })
                    })
                }
            }
        }, { quoted: m })

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    }
}

handler.tags = ['serbot']
handler.help = ['sockets', 'deletesesion', 'pausarai']
handler.command = [
    'deletesesion', 'deletebot', 'deletesession', 'deletesesaion',
    'stop', 'pausarai', 'pausarbot',
    'bots', 'sockets', 'socket'
]

export default handler