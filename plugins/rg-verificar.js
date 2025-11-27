import { createHash } from 'crypto'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = (await import("@whiskeysockets/baileys")).default

let Reg = /\|?(.*)([.|] *?)([0-9]*)$/i

let handler = async function (m, { conn, text, usedPrefix, command }) {
    
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

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    let pp = await conn.profilePictureUrl(who, 'image').catch((_) => 'https://files.catbox.moe/xr2m6u.jpg')
    let user = global.db.data.users[m.sender]
    let name2 = conn.getName(m.sender)

    if (user.registered === true) 
        return m.reply(toFancy(`Ya estás registrado. Usa ${usedPrefix}unreg para eliminar tu registro.`))
    
    if (!Reg.test(text)) 
        return m.reply(toFancy(`Formato incorrecto.\nUso: ${usedPrefix + command} nombre.edad\nEjemplo: ${usedPrefix + command} ${name2}.18`))

    let [_, name, splitter, age] = text.match(Reg)
    
    if (!name) return m.reply(toFancy('El nombre no puede estar vacío.'))
    if (!age) return m.reply(toFancy('La edad no puede estar vacía.'))
    if (name.length >= 100) return m.reply(toFancy('El nombre es demasiado largo.'))
    
    age = parseInt(age)
    if (age > 1000) return m.reply(toFancy('Wow, el abuelo quiere jugar con el bot.'))
    if (age < 5) return m.reply(toFancy('Hay un bebé queriendo usar el bot jsjs.'))

    user.name = name.trim()
    user.age = age
    user.regTime = +new Date
    user.registered = true

    let recompensa = {
        money: 40,
        estrellas: 10,
        exp: 300,
        joincount: 20
    }
    
    user.coin += recompensa.money
    user.exp += recompensa.exp
    user.joincount += recompensa.joincount

    if (global.db && global.db.write) {
        await global.db.write()
    }

    let sn = createHash('md5').update(m.sender).digest('hex').slice(0, 20)

    await m.react('📩')

    let mediaMessage = await prepareWAMessageMedia({ 
        image: { url: pp } 
    }, { upload: conn.waUploadToServer })

    let txtReg = `
𖣁 ${toFancy("Rᥱgіstr᥆ Exіt᥆s᥆")} 𖣁

╭─┄ ${toFancy("Dᥲ𝗍᥆s")} ┄
│✐ ${toFancy("N᥆mᑲrᥱ")}: ${toFancy(name)}
│✐ ${toFancy("Eძᥲძ")}: ${age} ${toFancy("ᥲñ᥆s")}
╰─┄•·.·꒥꒷‧₊˚

🎁 ${toFancy("Rᥱᥴ᥆m⍴ᥱᥒsᥲs")}:
> 💵 ${toFancy("Dіᥒᥱr᥆")}: +${recompensa.money}
> 🌟 ${toFancy("Es𝗍rᥱᥣᥣᥲs")}: +${recompensa.estrellas}
> 📈 EXP: +${recompensa.exp}
> 🎟️ Tokens: +${recompensa.joincount}

${toFancy("Usa el botón abajo para copiar tu Serial (SN)")}`.trim()

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: txtReg
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                        text: toFancy('Sіs𝗍ᥱmᥲ ძᥱ Rᥱgіs𝗍r᥆')
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        hasMediaAttachment: true,
                        imageMessage: mediaMessage.imageMessage
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [
                            {
                                name: "cta_copy",
                                buttonParamsJson: JSON.stringify({
                                    display_text: toFancy("C᥆⍴іᥲr Sᥱrіᥲᥣ (SN)"),
                                    id: "123456789",
                                    copy_code: sn
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: toFancy("Ir ᥲᥣ Mᥱᥒᥙ"),
                                    id: `${usedPrefix}menu`
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

handler.help = ['reg']
handler.tags = ['rg']
handler.command = ['verify', 'verificar', 'reg', 'register', 'registrar']

export default handler