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
                        console.log(
                            chalk.bold.bgRgb(51, 204, 51)('INFO '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.cyan(format(...args))
                        )
                    },
                    error(...args) {
                        console.log(
                            chalk.bold.bgRgb(247, 38, 33)('ERROR '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.rgb(255, 38, 0)(format(...args))
                        )
                    },
                    warn(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 153, 0)('WARNING '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.redBright(format(...args))
                        )
                    },
                    trace(...args) {
                        console.log(
                            chalk.grey('TRACE '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.white(format(...args))
                        )
                    },
                    debug(...args) {
                        console.log(
                            chalk.bold.bgRgb(66, 167, 245)('DEBUG '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.white(format(...args))
                        )
                    }
                }
            },
            enumerable: true
        },
        sendListB: {
            async value(jid, title, text, buttonText, buffer, listSections, quoted, options = {}) {
                let img, video
                if (/^https?:\/\//i.test(buffer)) {
                    try {
                        const response = await fetch(buffer)
                        const contentType = response.headers.get('content-type')
                        if (/^image\//i.test(contentType)) {
                            img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer })
                        } else if (/^video\//i.test(contentType)) {
                            video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer })
                        }
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    try {
                        const type = await conn.getFile(buffer)
                        if (/^image\//i.test(type.mime)) {
                            img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer })
                        } else if (/^video\//i.test(type.mime)) {
                            video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer })
                        }
                    } catch (error) {
                        console.error(error)
                    }
                }
                const sections = [...listSections]
                const message = {
                    interactiveMessage: {
                        header: {
                            title: title,
                            hasMediaAttachment: !!(img || video),
                            imageMessage: img ? img.imageMessage : null,
                            videoMessage: video ? video.videoMessage : null
                        },
                        body: { text: text },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: buttonText,
                                        sections
                                    })
                                }
                            ],
                            messageParamsJson: ''
                        }
                    }
                }
                let msgL = generateWAMessageFromContent(jid, { viewOnceMessage: { message } }, { userJid: conn.user.jid, quoted })
                conn.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options })
            }
        },
        sendBot: {
            async value(jid, text = '', buffer, title, body, url, quoted, options) {
                let type
                if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = buffer }
                let prep = generateWAMessageFromContent(jid, { extendedTextMessage: { text: text, contextInfo: { externalAdReply: { title: title, body: body, thumbnail: buffer, sourceUrl: url }, mentionedJid: await conn.parseMention(text) } } }, { quoted: quoted })
                return conn.relayMessage(jid, prep.message, { messageId: prep.key.id })
            }
        },
        sendPayment: {
            async value(jid, amount, text, quoted, options) {
                conn.relayMessage(jid, {
                    requestPaymentMessage: {
                        currencyCodeIso4217: 'PEN',
                        amount1000: amount,
                        requestFrom: null,
                        noteMessage: {
                            extendedTextMessage: {
                                text: text,
                                contextInfo: {
                                    externalAdReply: {
                                        showAdAttribution: true
                                    }, mentionedJid: conn.parseMention(text)
                                }
                            }
                        }
                    }
                }, {})
            }
        },
        getFile: {
            async value(PATH, saveToFile = false) {
                let res, filename
                const data = Buffer.isBuffer(PATH) ? PATH : PATH instanceof ArrayBuffer ? PATH.toBuffer() : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
                if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
                const type = await fileTypeFromBuffer(data) || {
                    mime: 'application/octet-stream',
                    ext: '.bin'
                }
                if (data && saveToFile && !filename) (filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
                return {
                    res,
                    filename,
                    ...type,
                    data,
                    deleteFile() {
                        return filename && fs.promises.unlink(filename)
                    }
                }
            },
            enumerable: true
        },
        waitEvent: {
            value(eventName, is = () => true, maxTries = 25) {
                return new Promise((resolve, reject) => {
                    let tries = 0
                    let on = (...args) => {
                        if (++tries > maxTries) reject('Max tries reached')
                        else if (is()) {
                            conn.ev.off(eventName, on)
                            resolve(...args)
                        }
                    }
                    conn.ev.on(eventName, on)
                })
            }
        },
        sendContact: {
            async value(jid, data, quoted, options) {
                if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
                let contacts = []
                for (let [number, name] of data) {
                    number = number.replace(/[^0-9]/g, '')
                    let njid = number + '@s.whatsapp.net'
                    let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {}
                    let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${name.replace(/\n/g, '\\n')};;;\nFN:${name.replace(/\n/g, '\\n')}\nTEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${biz.description ? `\nX-WA-BIZ-NAME:${(conn.chats[njid]?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}\nX-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}` : ''}\nEND:VCARD`.trim()
                    contacts.push({ vcard, displayName: name })
                }
                return await conn.sendMessage(jid, {
                    ...options,
                    contacts: {
                        ...options,
                        displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
                        contacts,
                    }
                }, { quoted, ...options })
            },
            enumerable: true
        },
        resize: {
            value(buffer, ukur1, ukur2) {
                return new Promise(async (resolve, reject) => {
                    var baper = await Jimp.read(buffer)
                    var ab = await baper.resize(ukur1, ukur2).getBufferAsync(Jimp.MIME_JPEG)
                    resolve(ab)
                })
            }
        },
        relayWAMessage: {
            async value(pesanfull) {
                if (pesanfull.message.audioMessage) {
                    await conn.sendPresenceUpdate('recording', pesanfull.key.remoteJid)
                } else {
                    await conn.sendPresenceUpdate('composing', pesanfull.key.remoteJid)
                }
                var mekirim = await conn.relayMessage(pesanfull.key.remoteJid, pesanfull.message, { messageId: pesanfull.key.id })
                conn.ev.emit('messages.upsert', { messages: [pesanfull], type: 'append' });
                return mekirim
            }
        },
        sendListM: {
            async value(jid, button, rows, quoted, options = {}) {
                let fsizedoc = '1'.repeat(10)
                const sections = [{ title: button.title, rows: [...rows] }]
                const listMessage = {
                    text: button.description,
                    footer: button.footerText,
                    mentions: await conn.parseMention(button.description),
                    ephemeralExpiration: '86400',
                    title: '',
                    buttonText: button.buttonText,
                    sections
                }
                conn.sendMessage(jid, listMessage, {
                    quoted,
                    ephemeralExpiration: fsizedoc,
                    contextInfo: {
                        forwardingScore: fsizedoc,
                        isForwarded: true,
                        mentions: await conn.parseMention(button.description + button.footerText),
                        ...options
                    }
                })
            }
        },
        sendList: {
            async value(jid, title, text, footer, buttonText, buffer, listSections, quoted, options) {
                let type
                if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = buffer }
                if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === 'string' || Array.isArray(buffer))) (options = quoted, quoted = listSections, listSections = buffer, buffer = null)
                if (!options) options = {}
                const sections = listSections.map(([title, rows]) => ({
                    title: !nullish(title) && title || '',
                    rows: rows.map(([rowTitle, rowId, description]) => ({
                        title: !nullish(rowTitle) && rowTitle || '',
                        rowId: !nullish(rowId) && rowId || '',
                        description: !nullish(description) && description || ''
                    }))
                }))
                const listMessage = { text, footer, title, buttonText, sections }
                return await conn.sendMessage(jid, listMessage, {
                    quoted,
                    upload: conn.waUploadToServer,
                    contextInfo: {
                        mentionedJid: await conn.parseMention(text),
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363322713003916@newsletter',
                            newsletterName: 'Aika-Bot-MD ¡New Channe! 🍂',
                            serverMessageId: ''
                        },
                        ...options
                    }
                })
            }
        },
        sendContactArray: {
            async value(jid, data, quoted, options) {
                if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
                let contacts = []
                let buttons = []
                for (let [number, name, isi, isi1, isi2, isi3, isi4, isi5, ...extraLinks] of data) {
                    number = number.replace(/[^0-9]/g, '')
                    let njid = number + '@s.whatsapp.net'
                    let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {};
                    let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${name.replace(/\n/g, '\\n')}\nitem.ORG:${isi}\nitem1.TEL;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}\nitem1.X-ABLabel:${isi1}\n${isi2 ? `item2.EMAIL;type=INTERNET:${isi2}\nitem2.X-ABLabel:📧 Email` : ''}\n${isi3 ? `item3.ADR:;;${isi3};;;;\nitem3.X-ABADR:ac \nitem3.X-ABLabel:📍 Region` : ''}\n${isi4 ? `item4.URL;type=pref:${isi4}\nitem4.X-ABLabel:Website` : ''}\n${extraLinks.map((link, index) => link ? `item${index + 5}.URL;type=pref:${link}\nitem${index + 5}.X-ABLabel:Extra Link ${index + 1}` : '').join('\n')}\n${isi5 ? `${extraLinks.length > 0 ? `item${extraLinks.length + 5}` : 'item5'}.X-ABLabel:${isi5}` : ''}\nEND:VCARD`.trim()
                    let newButtons = extraLinks.map((link, index) => ({
                        buttonId: `extra-link-${index + 1}`,
                        buttonText: { displayText: `Extra Link ${index + 1}` },
                        type: 1,
                        url: `http://${link}`
                    }))
                    buttons.push(...newButtons)
                    contacts.push({ vcard, displayName: name })
                }
                let displayName = contacts.length === 1 ? contacts[0].displayName : `${contacts.length} kontak`
                let contactsWithButtons = contacts.map((contact, i) => ({
                    ...contact,
                    buttons: buttons.filter(btn => btn.buttonId.startsWith(`extra-link-${i + 1}`))
                }))
                return await conn.sendMessage(jid, { contacts: { displayName, contacts: contactsWithButtons } }, { quoted, ...options })
            }
        },
        sendFile: {
            async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
                let type = await conn.getFile(path, true)
                let { res, data: file, filename: pathFile } = type
                if (res && res.status !== 200 || file.length <= 65536) {
                    try { throw { json: JSON.parse(file.toString()) } }
                    catch (e) { if (e.json) throw e.json }
                }
                let opt = quoted ? { quoted } : {}
                if (!type) options.asDocument = true
                let mtype = '', mimetype = options.mimetype || type.mime, convert
                if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
                else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
                else if (/video/.test(type.mime)) mtype = 'video'
                else if (/audio/.test(type.mime)) {
                    convert = await toAudio(file, type.ext)
                    file = convert.data
                    pathFile = convert.filename
                    mtype = 'audio'
                    mimetype = options.mimetype || 'audio/ogg; codecs=opus'
                } else mtype = 'document'
                if (options.asDocument) mtype = 'document'
                delete options.asSticker
                delete options.asLocation
                delete options.asVideo
                delete options.asDocument
                delete options.asImage
                let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype, fileName: filename || pathFile.split('/').pop() }
                let m
                try {
                    m = await conn.sendMessage(jid, message, { ...opt, ...options })
                } catch (e) {
                    console.error(e)
                    m = null
                } finally {
                    if (!m) m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
                    file = null
                    return m
                }
            },
            enumerable: true
        },
        reply: {
            value(jid, text = '', quoted, options) {
                return Buffer.isBuffer(text) ? conn.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options, text }, { quoted, ...options })
            }
        },
        generateProfilePicture: {
            async value(buffer) {
                const jimp_1 = await Jimp.read(buffer);
                const resz = jimp_1.getWidth() > jimp_1.getHeight() ? jimp_1.resize(550, Jimp.AUTO) : jimp_1.resize(Jimp.AUTO, 650)
                return { img: await resz.getBufferAsync(Jimp.MIME_JPEG) }
            }
        },
        sendButtonImg: {
            async value(jid, buffer, contentText, footerText, button1, id1, quoted, options) {
                let type = await conn.getFile(buffer)
                let { res, data: file } = type
                if (res && res.status !== 200 || file.length <= 65536) {
                    try { throw { json: JSON.parse(file.toString()) } }
                    catch (e) { if (e.json) throw e.json }
                }
                const buttons = [{ buttonId: id1, buttonText: { displayText: button1 }, type: 1 }]
                const buttonMessage = {
                    image: file,
                    fileLength: 800000000000000,
                    caption: contentText,
                    footer: footerText,
                    mentions: await conn.parseMention(contentText + footerText),
                    ...options,
                    buttons: buttons,
                    headerType: 4
                }
                return conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(contentText + footerText) }, ...options })
            }
        },
        sendMini: {
            async value(jid, title, body, text = '', thumbnailUrl, thumbnail, sourceUrl, quoted, LargerThumbnail = true) {
                return conn.sendMessage(jid, {
                    contextInfo: {
                        mentionedJid: await conn.parseMention(text),
                        externalAdReply: {
                            title: title,
                            body: body,
                            mediaType: 1,
                            previewType: 0,
                            renderLargerThumbnail: LargerThumbnail,
                            thumbnailUrl: thumbnailUrl,
                            thumbnail: thumbnailUrl,
                            sourceUrl: sourceUrl
                        },
                    },
                    text
                }, { quoted })
            },
            enumerable: true,
            writable: true,
        },
        send1ButtonVid: {
            async value(jid, buffer, contentText, footerText, button1, id1, quoted, options) {
                let type = await conn.getFile(buffer)
                let { data: file } = type
                let buttons = [{ buttonId: id1, buttonText: { displayText: button1 }, type: 1 }]
                const buttonMessage = {
                    video: file,
                    fileLength: 800000000000000,
                    caption: contentText,
                    footer: footerText,
                    mentions: await conn.parseMention(contentText),
                    ...options,
                    buttons: buttons,
                    headerType: 4
                }
                return conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, ...options })
            }
        },
        send2ButtonVid: {
            async value(jid, buffer, contentText, footerText, button1, id1, button2, id2, quoted, options) {
                let type = await conn.getFile(buffer)
                let { data: file } = type
                let buttons = [
                    { buttonId: id1, buttonText: { displayText: button1 }, type: 1 },
                    { buttonId: id2, buttonText: { displayText: button2 }, type: 1 }
                ]
                const buttonMessage = {
                    video: file,
                    fileLength: 800000000000000,
                    caption: contentText,
                    footer: footerText,
                    mentions: await conn.parseMention(contentText + footerText),
                    ...options,
                    buttons: buttons,
                    headerType: 4
                }
                return conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, ...options })
            }
        },
        sendButtonLoc: {
            async value(jid, buffer, content, footer, button1, row1, quoted, options = {}) {
                let type = await conn.getFile(buffer)
                let { data: file } = type
                let buttons = [{ buttonId: row1, buttonText: { displayText: button1 }, type: 1 }]
                let buttonMessage = {
                    location: { jpegThumbnail: file },
                    caption: content,
                    footer: footer,
                    mentions: await conn.parseMention(content + footer),
                    ...options,
                    buttons: buttons,
                    headerType: 6
                }
                return await conn.sendMessage(jid, buttonMessage, {
                    quoted,
                    upload: conn.waUploadToServer,
                    ephemeralExpiration: global.ephemeral,
                    ...options
                })
            }
        },
        sendButtonVid: {
            async value(jid, buffer, contentText, footerText, button1, id1, button2, id2, button3, id3, quoted, options) {
                let type = await conn.getFile(buffer)
                let { data: file } = type
                let buttons = [
                    { buttonId: id1, buttonText: { displayText: button1 }, type: 1 },
                    { buttonId: id2, buttonText: { displayText: button2 }, type: 1 },
                    { buttonId: id3, buttonText: { displayText: button3 }, type: 1 },
                ]
                const buttonMessage = {
                    video: file,
                    fileLength: 800000000000000,
                    caption: contentText,
                    footer: footerText,
                    mentions: await conn.parseMention(contentText + footerText),
                    ...options,
                    buttons: buttons,
                    headerType: 4
                }
                return conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, ...options })
            }
        },
        sendTemplateButtonLoc: {
            async value(jid, buffer, contentText, footer, buttons1, row1, quoted, options) {
                let file = await conn.resize(buffer, 300, 150)
                const template = generateWAMessageFromContent(jid, proto.Message.fromObject({
                    templateMessage: {
                        hydratedTemplate: {
                            locationMessage: { jpegThumbnail: file },
                            hydratedContentText: contentText,
                            hydratedFooterText: footer,
                            ...options,
                            hydratedButtons: [
                                { urlButton: { displayText: global.author, url: global.md } },
                                { quickReplyButton: { displayText: buttons1, id: row1 } }
                            ]
                        }
                    }
                }), { userJid: conn.user.jid, quoted: quoted, contextInfo: { mentionedJid: conn.parseMention(contentText + footer) }, ephemeralExpiration: "86400", ...options });
                return conn.relayMessage(jid, template.message, { messageId: template.key.id })
            }
        },
        sendButtonMessages: {
            async value(jid, messages, quoted, options) {
                messages.length > 1 ? await conn.sendCarousel(jid, messages, quoted, options) : await conn.sendNCarousel(jid, ...messages[0], quoted, options);
            }
        },
        sendNCarousel: {
            async value(jid, text = '', footer = '', buffer, buttons, copy, urls, list, quoted, options) {
                let img, video;
                if (buffer) {
                    if (/^https?:\/\//i.test(buffer)) {
                        try {
                            const response = await fetch(buffer);
                            const contentType = response.headers.get('content-type');
                            if (/^image\//i.test(contentType)) {
                                img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer, ...options });
                            } else if (/^video\//i.test(contentType)) {
                                video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer, ...options });
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    } else {
                        try {
                            const type = await conn.getFile(buffer);
                            if (/^image\//i.test(type.mime)) {
                                img = await prepareWAMessageMedia({ image: type?.data }, { upload: conn.waUploadToServer, ...options });
                            } else if (/^video\//i.test(type.mime)) {
                                video = await prepareWAMessageMedia({ video: type?.data }, { upload: conn.waUploadToServer, ...options });
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
                const dynamicButtons = buttons.map(btn => ({
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: btn[0], id: btn[1] }),
                }));
                if (copy) dynamicButtons.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy', copy_code: copy }) });
                urls?.forEach(url => {
                    dynamicButtons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: url[0], url: url[1], merchant_url: url[1] }) });
                });
                list?.forEach(lister => {
                    dynamicButtons.push({ name: 'single_select', buttonParamsJson: JSON.stringify({ title: lister[0], sections: lister[1] }) });
                })
                const interactiveMessage = {
                    body: { text: text || '' },
                    footer: { text: footer || '' },
                    header: {
                        hasMediaAttachment: !!(img || video),
                        imageMessage: img?.imageMessage || null,
                        videoMessage: video?.videoMessage || null
                    },
                    nativeFlowMessage: { buttons: dynamicButtons.filter(Boolean), messageParamsJson: '' }
                };
                const messageContent = proto.Message.fromObject({
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                            interactiveMessage
                        }
                    }
                });
                const msgs = await generateWAMessageFromContent(jid, messageContent, { userJid: conn.user.jid, quoted, upload: conn.waUploadToServer, ephemeralExpiration: WA_DEFAULT_EPHEMERAL });
                await conn.relayMessage(jid, msgs.message, { messageId: msgs.key.id });
            }
        },
        sendCarousel: {
            async value(jid, text = '', footer = '', text2 = '', messages, quoted, options) {
                if (messages.length > 1) {
                    const cards = await Promise.all(messages.map(async ([text = '', footer = '', buffer, buttons, copy, urls, list]) => {
                        let img, video;
                        if (buffer) {
                            const type = await conn.getFile(buffer);
                            if (/^image\//i.test(type.mime)) {
                                img = await prepareWAMessageMedia({ image: type.data }, { upload: conn.waUploadToServer, ...options });
                            } else if (/^video\//i.test(type.mime)) {
                                video = await prepareWAMessageMedia({ video: type.data }, { upload: conn.waUploadToServer, ...options });
                            }
                        }
                        const dynamicButtons = buttons.map(btn => ({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: btn[0], id: btn[1] }) }));
                        if (copy) {
                            const copyArr = Array.isArray(copy) ? copy : [[copy]];
                            copyArr.forEach(c => dynamicButtons.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy', copy_code: c[0] }) }));
                        }
                        urls?.forEach(url => dynamicButtons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: url[0], url: url[1], merchant_url: url[1] }) }));
                        list?.forEach(lister => dynamicButtons.push({ name: 'single_select', buttonParamsJson: JSON.stringify({ title: lister[0], sections: lister[1] }) }));
                        return {
                            body: proto.Message.InteractiveMessage.Body.fromObject({ text: text || '' }),
                            footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: footer || '' }),
                            header: proto.Message.InteractiveMessage.Header.fromObject({ title: text2, subtitle: text || '', hasMediaAttachment: !!(img || video), imageMessage: img?.imageMessage || null, videoMessage: video?.videoMessage || null }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: dynamicButtons.filter(Boolean), messageParamsJson: '' })
                        };
                    }));
                    const interactiveMessage = proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.fromObject({ text: text || '' }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: footer || '' }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({ title: text || '', subtitle: text || '', hasMediaAttachment: false }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
                    });
                    const messageContent = proto.Message.fromObject({ viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage } } });
                    const msgs = await generateWAMessageFromContent(jid, messageContent, { userJid: conn.user.jid, quoted, upload: conn.waUploadToServer, ephemeralExpiration: WA_DEFAULT_EPHEMERAL });
                    await conn.relayMessage(jid, msgs.message, { messageId: msgs.key.id });
                } else {
                    await conn.sendNCarousel(jid, ...messages[0], quoted, options);
                }
            }
        },
        sendButton: {
            async value(jid, text = '', footer = '', buffer, buttons, copy, urls, quoted, options) {
                let img, video
                if (buffer) {
                    const type = await conn.getFile(buffer)
                    if (/^image\//i.test(type.mime)) {
                        img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer })
                    } else if (/^video\//i.test(type.mime)) {
                        video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer })
                    }
                }
                const dynamicButtons = buttons.map(btn => ({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: btn[0], id: btn[1] }) }));
                if (copy) dynamicButtons.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy', copy_code: copy }) });
                if (urls && Array.isArray(urls)) {
                    urls.forEach(url => dynamicButtons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: url[0], url: url[1], merchant_url: url[1] }) }))
                }
                const interactiveMessage = {
                    body: { text: text },
                    footer: { text: footer },
                    header: { hasMediaAttachment: !!(img || video), imageMessage: img ? img.imageMessage : null, videoMessage: video ? video.videoMessage : null },
                    nativeFlowMessage: { buttons: dynamicButtons, messageParamsJson: '' }
                }
                let msgL = generateWAMessageFromContent(jid, { viewOnceMessage: { message: { interactiveMessage } } }, { userJid: conn.user.jid, quoted })
                conn.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options })
            }
        },
        sendPoll: {
            async value(jid, name = '', values = [], selectableCount = 1) {
                return conn.sendMessage(jid, { poll: { name, values, selectableCount } })
            }
        },
        cMod: {
            value(jid, message, text = '', sender = conn.user.jid, options = {}) {
                if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
                let copy = message.toJSON()
                delete copy.message.messageContextInfo
                delete copy.message.senderKeyDistributionMessage
                let mtype = Object.keys(copy.message)[0]
                let msg = copy.message
                let content = msg[mtype]
                if (typeof content === 'string') msg[mtype] = text || content
                else if (content.caption) content.caption = text || content.caption
                else if (content.text) content.text = text || content.text
                if (typeof content !== 'string') {
                    msg[mtype] = { ...content, ...options }
                    msg[mtype].contextInfo = {
                        ...(content.contextInfo || {}),
                        mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
                    }
                }
                if (copy.participant) sender = copy.participant = sender || copy.participant
                else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
                copy.key.remoteJid = jid
                copy.key.fromMe = areJidsSameUser(sender, conn.user.id)
                return proto.WebMessageInfo.fromObject(copy)
            },
            enumerable: true
        },
        copyNForward: {
            async value(jid, message, forwardingScore = true, options = {}) {
                let mtype = Object.keys(message.message)[0]
                let m = generateForwardMessageContent(message, !!forwardingScore)
                let ctype = Object.keys(m)[0]
                if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) m[ctype].contextInfo.forwardingScore += forwardingScore
                m = generateWAMessageFromContent(jid, m, { ...options, userJid: conn.user.jid })
                await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
                return m
            },
            enumerable: true
        },
        downloadM: {
            async value(m, type, saveToFile) {
                if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
                const stream = await downloadContentFromMessage(m, type)
                let buffer = Buffer.from([])
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk])
                }
                let filename
                if (saveToFile) ({ filename } = await conn.getFile(buffer, true))
                return saveToFile && fs.existsSync(filename) ? filename : buffer
            },
            enumerable: true
        },
        parseMention: {
            value(text = '') {
                return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
            },
            enumerable: true
        },
        getName: {
            value(jid = '', withoutContact = false) {
                jid = conn.decodeJid(jid)
                let v
                if (jid.endsWith('@g.us')) return new Promise(async (resolve) => {
                    v = conn.chats[jid] || {}
                    if (!(v.name || v.subject)) v = await conn.groupMetadata(jid) || {}
                    resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'))
                })
                else v = jid === '0@s.whatsapp.net' ? { jid, vname: 'WhatsApp' } : areJidsSameUser(jid, conn.user.id) ? conn.user : (conn.chats[jid] || {})
                let userName = global.db.data.users[jid.replace('@s.whatsapp.net', '')]?.name
                if (!userName) userName = PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
                return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || userName
            },
            enumerable: true
        },
        loadMessage: {
            value(messageID) {
                return Object.entries(conn.chats).filter(([_, { messages }]) => typeof messages === 'object').find(([_, { messages }]) => Object.entries(messages).find(([k, v]) => (k === messageID || v.key?.id === messageID)))?.[1].messages?.[messageID]
            },
            enumerable: true
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
    let protocolMessageKey
    if (m.message) {
        if (m.mtype == 'protocolMessage' && m.msg.key) {
            protocolMessageKey = m.msg.key
            if (protocolMessageKey == 'status@broadcast') protocolMessageKey.remoteJid = m.chat
            if (!protocolMessageKey.participant || protocolMessageKey.participant == 'status_me') protocolMessageKey.participant = m.sender
            protocolMessageKey.fromMe = conn.decodeJid(protocolMessageKey.participant) === conn.decodeJid(conn.user.id)
        }
    }
    return m
}

export function serialize() {
    const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']
    return Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: { value: undefined, enumerable: false, writable: true },
        id: { get() { return this.key?.id } },
        isBaileys: { get() { return (this?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender)) && this.id.startsWith('3EB0') && (this.id.length === 20 || this.id.length === 22 || this.id.length === 12) || false } },
        chat: { get() { return (this.key?.remoteJid || this.message?.senderKeyDistributionMessage?.groupId || '').decodeJid() } },
        isGroup: { get() { return this.chat.endsWith('@g.us') }, enumerable: true },
        sender: { get() { return this.conn?.decodeJid(this.key?.fromMe && this.conn?.user.id || this.participant || this.key.participant || this.chat || '') }, enumerable: true },
        fromMe: { get() { return this.key?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender) || false } },
        mtype: {
            get() {
                if (!this.message) return ''
                const type = Object.keys(this.message)
                return (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) || (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) || type[type.length - 1]
            },
            enumerable: true
        },
        msg: { get() { return this.message ? this.message[this.mtype] : null } },
        mediaMessage: {
            get() {
                if (!this.message) return null
                const Message = extractMessageContent(this.message) || null
                if (!Message) return null
                const mtype = Object.keys(Message)[0]
                return MediaType.includes(mtype) ? Message : null
            },
            enumerable: true
        }
    })
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

function nullish(args) { return !(args !== null && args !== undefined) }