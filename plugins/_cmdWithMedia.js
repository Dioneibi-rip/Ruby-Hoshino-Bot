const {
    proto,
    generateWAMessage,
    areJidsSameUser
} = (await import('@whiskeysockets/baileys')).default

export async function all(m, chatUpdate) {
    if (m.isBaileys || !m.message || !m.msg.fileSha256) return

    const sha = Buffer.from(m.msg.fileSha256).toString('base64')
    const hash = global.db.data.sticker[sha]
    if (!hash) return

    const { text, mentionedJid } = hash
    const messages = await generateWAMessage(m.chat, { text, mentions: mentionedJid }, {
        userJid: this.user.id,
        quoted: m.quoted && m.quoted.fakeObj
    })

    messages.key.fromMe = areJidsSameUser(m.sender, this.user.id)
    messages.key.id = m.key.id
    messages.pushName = m.pushName
    if (m.isGroup) messages.participant = m.sender

    const msg = {
        ...chatUpdate,
        messages: [proto.WebMessageInfo.fromObject(messages)],
        type: 'append'
    }
    this.ev.emit('messages.upsert', msg)
}
