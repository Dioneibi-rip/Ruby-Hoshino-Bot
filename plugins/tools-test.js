const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = (await import("@whiskeysockets/baileys"))
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from "chalk"
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rubyJBOptions = {}

// Función para generar códigos personalizados que funcionen
function generarCodigoPersonalizado() {
    const formatos = [
        () => `SPEE-${Math.floor(100 + Math.random() * 900)}`, // SPEE-123
        () => `3XYZ-${Math.floor(100 + Math.random() * 900)}`, // 2025-456
        () => `ARLE-${Math.floor(1000 + Math.random() * 9000)}`, // ARLE-7890
        () => `RUBY-${Math.floor(100 + Math.random() * 900)}` // RUBY-321
    ]
    return formatos[Math.floor(Math.random() * formatos.length)]()
}

if (global.conns instanceof Array) console.log()
else global.conns = []

function isSubBotConnected(jid) { 
    return global.conns.some(sock => sock?.user?.jid && sock.user.jid.split("@")[0] === jid.split("@")[0]) 
}

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    if (!global.db.data.settings[conn.user.jid].jadibotmd) return m.reply(`ꕥ El Comando *${command}* está desactivado temporalmente.`)
    
    let time = global.db.data.users[m.sender].Subs + 120000
    if (new Date - global.db.data.users[m.sender].Subs < 120000) return conn.reply(m.chat, `ꕥ Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)
    
    let socklimit = global.conns.filter(sock => sock?.user).length
    if (socklimit >= 50) {
        return m.reply(`ꕥ No se han encontrado espacios para *Sub-Bots* disponibles.`)
    }
    
    let mentionedJid = await m.mentionedJid
    let who = mentionedJid && mentionedJid[0] ? mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    let id = `${who.split`@`[0]}`
    let pathRubyJadiBot = path.join('./sessions/', id)
    
    if (!fs.existsSync(pathRubyJadiBot)){
        fs.mkdirSync(pathRubyJadiBot, { recursive: true })
    }
    
    rubyJBOptions.pathRubyJadiBot = pathRubyJadiBot
    rubyJBOptions.m = m
    rubyJBOptions.conn = conn
    rubyJBOptions.args = args
    rubyJBOptions.usedPrefix = usedPrefix
    rubyJBOptions.command = command
    rubyJBOptions.fromCommand = true
    
    rubyJadiBot(rubyJBOptions)
    global.db.data.users[m.sender].Subs = new Date * 1
}

handler.help = ['code3xz']
handler.tags = ['serbot']
handler.command = ['code3xz']
export default handler 

export async function rubyJadiBot(options) {
    let { pathRubyJadiBot, m, conn, args, usedPrefix, command } = options
    
    let txtCode, codeBot
    
    const pathCreds = path.join(pathRubyJadiBot, "creds.json")
    if (!fs.existsSync(pathRubyJadiBot)){
        fs.mkdirSync(pathRubyJadiBot, { recursive: true })
    }
    
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        
        const msgRetry = (MessageRetryMap) => { }
        const msgRetryCache = new NodeCache()
        const { state, saveState, saveCreds } = await useMultiFileAuthState(pathRubyJadiBot)
        
        const connectionOptions = {
            logger: pino({ level: "fatal" }),
            printQRInTerminal: false,
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) 
            },
            msgRetry,
            msgRetryCache, 
            browser: ['Windows', 'Firefox'],
            version: version,
            generateHighQualityLinkPreview: true
        }
        
        let sock = makeWASocket(connectionOptions)
        sock.isInit = false
        let isInit = true
        
        setTimeout(async () => {
            if (!sock.user) {
                try { fs.rmSync(pathRubyJadiBot, { recursive: true, force: true }) } catch {}
                try { sock.ws?.close() } catch {}
                sock.ev.removeAllListeners()
                let i = global.conns.indexOf(sock)
                if (i >= 0) global.conns.splice(i, 1)
                console.log(`[AUTO-LIMPIEZA] Sesión ${path.basename(pathRubyJadiBot)} eliminada.`)
            }
        }, 60000)
        
        async function connectionUpdate(update) {
            const { connection, lastDisconnect, isNewLogin, qr } = update
            
            if (isNewLogin) sock.isInit = false
            
            if (qr) {
                try {
                    // Generar código de pairing REAL
                    let phoneNumber = m.sender.split('@')[0]
                    let realCode = await sock.requestPairingCode(phoneNumber)
                    
                    // Formatear código real para mostrar
                    let codigoMostrar = realCode.match(/.{1,4}/g)?.join('-') || realCode
                    
                    // También generar código personalizado para referencia
                    let codigoPersonalizado = generarCodigoPersonalizado()
                    
                    // Enviar instrucciones con código REAL
                    txtCode = await conn.sendMessage(m.chat, {
                        text: `✿ *Vincula tu cuenta usando el código.*\n\n[ ✰ ] Sigue las instrucciones:\n*1 » Mas opciones*\n*2 » Dispositivos vinculados*\n*3 » Vincular nuevo dispositivo*\n*4 » Vincular usando numero*\n\n🔐 *Código:* ${codigoMostrar}\n\n💎 *Tu código personalizado:* ${codigoPersonalizado}\n\n> *Nota:* Usa el código de arriba para vincular`
                    }, { quoted: m })
                    
                    console.log(`Código REAL: ${codigoMostrar} | Personalizado: ${codigoPersonalizado} | Para: ${phoneNumber}`)
                    
                } catch (error) {
                    console.error("Error generando código:", error)
                    await conn.sendMessage(m.chat, { 
                        text: '❌ Error al generar el código. Intenta nuevamente.' 
                    }, { quoted: m })
                }
            }
            
            if (txtCode && txtCode.key) {
                setTimeout(() => { conn.sendMessage(m.sender, { delete: txtCode.key })}, 30000)
            }
            
            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
            
            if (connection === 'close') {
                if (reason === DisconnectReason.connectionClosed) {
                    console.log(chalk.bold.magentaBright(`Conexión cerrada: +${path.basename(pathRubyJadiBot)}`))
                }
                if (reason === DisconnectReason.connectionLost) {
                    console.log(chalk.bold.magentaBright(`Conexión perdida: +${path.basename(pathRubyJadiBot)}`))
                }
                if (reason === DisconnectReason.connectionReplaced) {
                    console.log(chalk.bold.magentaBright(`Conexión reemplazada: +${path.basename(pathRubyJadiBot)}`))
                    try {
                        if (options.fromCommand && m?.chat) {
                            await conn.sendMessage(m.chat, { 
                                text: '⚠️ Se detectó una nueva sesión. Si necesitas conectar de nuevo, usa el comando otra vez.' 
                            }, { quoted: m })
                        }
                    } catch {}
                }
                if (reason === DisconnectReason.restartRequired) {
                    console.log(chalk.bold.magentaBright(`Reinicio requerido: +${path.basename(pathRubyJadiBot)}`))
                }
                if (reason === DisconnectReason.timedOut) {
                    console.log(chalk.bold.magentaBright(`Timeout: +${path.basename(pathRubyJadiBot)}`))
                }
            }
            
            if (connection === 'open') {
                let userName = sock.authState.creds.me?.name || 'Usuario'
                let userJid = sock.authState.creds.me?.jid || `${path.basename(pathRubyJadiBot)}@s.whatsapp.net`
                
                console.log(chalk.bold.cyanBright(`✅ Sub-Bot conectado: ${userName} (+${path.basename(pathRubyJadiBot)})`))
                
                sock.isInit = true
                global.conns.push(sock)
                
                if (m?.chat) {
                    await conn.sendMessage(m.chat, { 
                        text: `🎉 *Sub-Bot conectado exitosamente!* [@${m.sender.split('@')[0]}]\n\n📱 *Usuario:* ${userName}\n🔗 *Estado:* ✅ Conectado\n\n¡Ahora puedes usar los comandos del bot!`, 
                        mentions: [m.sender] 
                    }, { quoted: m })
                }
            }
        }
        
        let handler = await import('../handler.js')
        let creloadHandler = async function (restatConn) {
            try {
                const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
                if (Object.keys(Handler || {}).length) handler = Handler
            } catch (e) {
                console.error('Error cargando handler:', e)
            }
            
            if (restatConn) {
                const oldChats = sock.chats
                try { sock.ws.close() } catch { }
                sock.ev.removeAllListeners()
                sock = makeWASocket(connectionOptions, { chats: oldChats })
                isInit = true
            }
            
            sock.handler = handler.handler.bind(sock)
            sock.connectionUpdate = connectionUpdate.bind(sock)
            sock.credsUpdate = saveCreds.bind(sock, true)
            
            sock.ev.on("messages.upsert", sock.handler)
            sock.ev.on("connection.update", sock.connectionUpdate)
            sock.ev.on("creds.update", sock.credsUpdate)
            
            isInit = false
            return true
        }
        
        creloadHandler(false)
        
    } catch (error) {
        console.error('Error en rubyJadiBot:', error)
        if (m?.chat) {
            await conn.sendMessage(m.chat, { 
                text: '❌ Error al procesar la solicitud. Intenta nuevamente.' 
            }, { quoted: m })
        }
    }
}

function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60)
    
    minutes = (minutes < 10) ? '0' + minutes : minutes
    seconds = (seconds < 10) ? '0' + seconds : seconds
    
    return minutes + ' m y ' + seconds + ' s '
}     }
