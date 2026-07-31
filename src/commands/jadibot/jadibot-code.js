import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'
import { createSubbotSocket, getPairingErrorMessage, requestPairingCodeWithTimeout } from '../../core/subbot-engine.js'

let pairingCodeSent = false
function clearPairingCodeLock() {
pairingCodeSent = false
}

let handler = async (m, { conn }) => {
const pairingPhone = String(conn.decodeJid?.(m.sender) || m.sender || '').split('@')[0].replace(/\D/g, '')
if (!pairingPhone) return conn.reply(m.chat, '🥀 No pude detectar tu número automáticamente. Intenta enviar #code desde tu chat de WhatsApp.', m)
if (pairingCodeSent) return conn.reply(m.chat, '⏳ Ya hay una solicitud de vinculación en proceso.', m)
pairingCodeSent = true
let destroySock = async () => {}
try {
await createSubbotSocket({
ownerJid: m.sender,
sessionId: m.sender,
pairingPhone,
mode: 'code',
parentConn: conn,
onPairingCode: async sock => {
destroySock = async ({ removeSession } = {}) => {
try { sock.ws?.close?.() } catch {}
if (removeSession) await import('../../core/subbot-engine.js').then(mod => mod.destroySubbotByOwner(m.sender))
}
let rawCode
try {
rawCode = await requestPairingCodeWithTimeout(sock, pairingPhone, "RUBYCHAN")
} catch (error) {
pairingCodeSent = false
clearPairingCodeLock()
await destroySock({ removeSession: true })
return conn.reply(m.chat, `🥀 Baileys rechazó la solicitud del código para +${pairingPhone}. Detalle: ${getPairingErrorMessage(error)}`, m)
}

const formattedCode = rawCode.match(/.{1,4}/g)?.join("-") || rawCode
const mediaMessage = await prepareWAMessageMedia({
image: { url: "https://files.catbox.moe/rt1yfo.jpeg" }
}, { upload: conn.waUploadToServer })

const interactivePayload = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({
text: [
"ㅤㅤㅤ",
"     𝖲𝗎𝖻-𝖡𝗈𝗍 ー(德) 𝖢𝗈𝖽𝖾.",
"",
"> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖨𝗇𝗌𝗍𝗋𝗎𝖼𝖼𝗂𝗈𝗇𝖾𝗌 𝗉⍺𝗋⍺ 𝗏𝗂𝗇𝖼𝗎𝗅⍺𝗋:",
"",
"𖹭 `𝟣.` 𝖵𝖾 ⍺ 𝗅𝗈𝗌 𝟥 𝗉𝗎𝗇𝗍𝗂𝗍𝗈𝗌 `⋮` 𝗈 `𝖢𝗈𝗇𝖿𝗂𝗀𝗎𝗋⍺𝖼𝗂𝗈́𝗇`.",
"𖹭 `𝟤.` 𝖲𝖾𝗅𝖾𝖼𝖼𝗂𝗈𝗇⍺ `𝖣𝗂𝗌𝗉𝗈𝗌𝗂𝗍𝗂𝗏𝗈𝗌 𝗏𝗂𝗇𝖼𝗎𝗅⍺𝖽𝗈𝗌`.",
"𖹭 `𝟥.` 𝖳𝗈𝖼⍺ 𝖾𝗇 `𝖵𝗂𝗇𝖼𝗎𝗅⍺𝗋 𝗎𝗇 𝖽𝗂𝗌𝗉𝗈𝗌𝗂𝗍𝗂𝗏𝗈`.",
"𖹭 `𝟦.` 𝖤𝗅𝗂𝗀𝖾 `𝖵𝗂𝗇𝖼𝗎𝗅⍺𝗋 𝖼𝗈𝗇 𝖾𝗅 𝗇𝗎́𝗆𝖾𝗋𝗈 𝖽𝖾 𝗍𝖾𝗅𝖾́𝖿𝗈𝗇𝗈`.",
"𖹭 `𝟧.` 𝖯𝖾𝗀⍺ 𝖾𝗅 𝖼𝗈́𝖽𝗂𝗀𝗈 𝗊𝗎𝖾 𝖾𝗌𝗍⍺́ ⍺𝖻⍺𝗃𝗈.",
"",
"⎯⎯⵿⎯̸⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯̸⵿⎯⎯",
`> (っ- ‸ - ς) 𝖢𝗈́𝖽𝗂𝗀𝗈: *${formattedCode}*`
].join('\n')
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: "🌸 𝖤𝗌𝗍𝖾 𝖼𝗈́𝖽𝗂𝗀𝗈 𝖾𝗑𝗉𝗂𝗋⍺𝗋⍺́ 𝖾𝗇 𝟦𝟧 𝗌𝖾𝗀𝗎𝗇𝖽𝗈𝗌... ✨"
}),
header: proto.Message.InteractiveMessage.Header.create({
hasMediaAttachment: true,
imageMessage: mediaMessage.imageMessage
}),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: [{
name: "cta_copy",
buttonParamsJson: JSON.stringify({
display_text: "🌸 𝖢𝗈𝗉𝗂⍺𝗋 𝖢𝗈́𝖽𝗂𝗀𝗈",
copy_code: rawCode
})
}]
})
})
}
}
}, { quoted: m })

await conn.relayMessage(m.chat, interactivePayload.message, { messageId: interactivePayload.key.id })
setTimeout(clearPairingCodeLock, 45000).unref?.()
}
})
} catch (error) {
clearPairingCodeLock()
return conn.reply(m.chat, `🥀 No se pudo iniciar el código: ${error.message}`, m)
}
}
handler.help = ['code']
handler.tags = ['jadibot']
handler.command = ['code']
export default handler
