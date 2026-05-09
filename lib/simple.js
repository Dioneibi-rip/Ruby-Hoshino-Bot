import path from 'path'  
import { toAudio } from './converter.js'
import chalk from 'chalk'
import fetch from 'node-fetch'
import PhoneNumber from 'awesome-phonenumber'
import fs from 'fs'
import util from 'util'
import { fileTypeFromBuffer } from 'file-type' 
import { format } from 'util'
import { fileURLToPath } from 'url'
import store from './store.js'
import Jimp from 'jimp'  
import pino from 'pino'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const {
    default: _makeWaSocket,
    makeWALegacySocket,
    proto,
    downloadContentFromMessage,
    jidDecode,
    areJidsSameUser,
    generateWAMessage,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    WAMessageStubType,
    extractMessageContent,
    makeInMemoryStore,
    getAggregateVotesInPollMessage, 
    prepareWAMessageMedia,
    WA_DEFAULT_EPHEMERAL
} = (await import('@whiskeysockets/baileys')).default

export function makeWASocket(connectionOptions, options = {}) {
    let conn = (global.opts['legacy'] ? makeWALegacySocket : _makeWaSocket)(connectionOptions)

    let sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true
        },
        decodeJid: {
            value(jid) {
                if (!jid || typeof jid !== 'string') return (!nullish(jid) && jid) || null
                return jid.decodeJid()
            }
        },
        logger: {
            get() {
                return {
                    info(...args) {
                        console.log(chalk.bold.bgRgb(51, 204, 51)('INFO '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.cyan(format(...args)))
                    },
                    error(...args) {
                        console.log(chalk.bold.bgRgb(247, 38, 33)('ERROR '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.rgb(255, 38, 0)(format(...args)))
                    },
                    warn(...args) {
                        console.log(chalk.bold.bgRgb(255, 153, 0)('WARNING '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.redBright(format(...args)))
                    },
                    trace(...args) {
                        console.log(chalk.grey('TRACE '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.white(format(...args)))
                    },
                    debug(...args) {
                        console.log(chalk.bold.bgRgb(66, 167, 245)('DEBUG '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.white(format(...args)))
                    }
                }
            },
            enumerable: true
        },
        getFile: {
            async value(PATH, saveToFile = false) {
                let res, filename
                const data = Buffer.isBuffer(PATH) ? PATH : PATH instanceof ArrayBuffer ? PATH.toBuffer() : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
                if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
                const type = await fileTypeFromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
                if (data && saveToFile && !filename) (filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
                return { res, filename, ...type, data, deleteFile() { return filename && fs.promises.unlink(filename) } }
            },
            enumerable: true
        },
        sendButton: {
            async value(jid, text = '', footer = '', buffer, buttons, copy, urls, quoted, options = {}) {
                let img, video
                if (buffer) {
                    try {
                        const type = await conn.getFile(buffer)
                        if (/image/i.test(type.mime)) img = await prepareWAMessageMedia({ image: type.data }, { upload: conn.waUploadToServer })
                        else if (/video/i.test(type.mime)) video = await prepareWAMessageMedia({ video: type.data }, { upload: conn.waUploadToServer })
                    } catch (e) { console.error(e) }
                }
                const dynamicButtons = buttons.map(btn => ({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: btn[0], id: btn[1] }) }))
                if (copy) dynamicButtons.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy', copy_code: copy }) })
                if (urls) urls.forEach(url => dynamicButtons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: url[0], url: url[1], merchant_url: url[1] }) }))
                const interactiveMessage = {
                    body: { text },
                    footer: { text: footer },
                    header: { hasMediaAttachment: !!(img || video), imageMessage: img?.imageMessage || null, videoMessage: video?.videoMessage || null },
                    nativeFlowMessage: { buttons: dynamicButtons, messageParamsJson: '' }
                }
                let msg = generateWAMessageFromContent(jid, { viewOnceMessage: { message: { interactiveMessage } } }, { userJid: conn.user.jid, quoted })
                return conn.relayMessage(jid, msg.message, { messageId: msg.key.id, ...options })
            }
        },
        sendPoll: {
            async value(jid, name = '', values = [], selectableCount = 1) {
                return conn.sendMessage(jid, { poll: { name, values, selectableCount }})
            }
        }
    })

    if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id)
    store.bind(sock)
    return sock
}

export function smsg(conn, m, hasParent) {
    if (!m) return m
    let M = proto.WebMessageInfo
    m = M.fromObject(m)
    m.conn = conn
    return m
}

export function protoType() {
    Buffer.prototype.toArrayBuffer = function () {
        const ab = new ArrayBuffer(this.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < this.length; ++i) view[i] = this[i];
        return ab;
    }
    ArrayBuffer.prototype.toBuffer = function () { return Buffer.from(new Uint8Array(this)) }
    String.prototype.decodeJid = function () {
        if (/:\d+@/gi.test(this)) {
            const decode = jidDecode(this) || {}
            return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim()
        } else return this.trim()
    }
}

function nullish(args) {
    return !(args !== null && args !== undefined)
}

protoType()