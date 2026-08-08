import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'
import { createSubbotSocket, destroySubbotSession, getPairingErrorMessage, requestPairingCodeWithTimeout } from '../../core/subbot-engine.js'
import { sanitizePairingPrefix } from '../../core/botProfileStore.js'
import { sanitizePairingNumber } from '../../core/identity-utils.js'

const requestCooldown = new Map()
const COOLDOWN_MS = 120000
const PAIRING_EXPIRATION_MS = 45000
const PAIRING_EXPIRATION_SECONDS = Math.floor(PAIRING_EXPIRATION_MS / 1000)

function isCoolingDown(jid) {
const until = requestCooldown.get(jid) || 0
if (until > Date.now()) return true
requestCooldown.delete(jid)
return false
}

function setCooldown(jid) {
requestCooldown.set(jid, Date.now() + COOLDOWN_MS)
setTimeout(() => requestCooldown.delete(jid), COOLDOWN_MS).unref?.()
}

let handler = async (m, { conn }) => {
// `m.sender` ya llega canonicalizado por la etapa de identidad del pipeline. Si aun
// asi es un `@lid` sin mapeo, sus digitos NO son un telefono: abortamos en vez de
// pedirle a Baileys un codigo para un numero inventado.
const senderJid = String(conn.decodeJid?.(m.sender) || m.sender || '')
if (/@(?:hosted\.)?lid$/i.test(senderJid)) return conn.reply(m.chat, '🥀 WhatsApp está ocultando tu número en este chat. Escríbeme por privado y vuelve a enviar *#code*.', m)
const pairingPhone = sanitizePairingNumber(senderJid)
if (!pairingPhone) return conn.reply(m.chat, '🥀 No pude detectar tu número automáticamente. Intenta enviar #code desde tu chat de WhatsApp.', m)
if (isCoolingDown(m.sender)) return conn.reply(m.chat, '⏳ Tu solicitud sigue activa. Espera 2 minutos antes de pedir otra vinculación.', m)
setCooldown(m.sender)
try {
await destroySubbotSession(m.sender).catch(() => false)
await createSubbotSocket({
ownerJid: m.sender,
sessionId: m.sender,
pairingPhone,
mode: 'code',
parentConn: conn,
// El engine pasa `(sock, numeroSaneado, parentConn)`. Se usan los parametros recibidos
// en vez del closure para que el numero sea siempre el que el engine valido.
onPairingCode: async (sock, phone = pairingPhone) => {
let rawCode
try {
rawCode = await requestPairingCodeWithTimeout(sock, phone, sanitizePairingPrefix(conn.botProfile?.pairingPrefix), PAIRING_EXPIRATION_MS)
} catch (error) {
requestCooldown.delete(m.sender)
await destroySubbotSession(m.sender).catch(() => false)
return conn.reply(m.chat, `🥀 Baileys rechazó la solicitud del código para +${phone}. Detalle: ${getPairingErrorMessage(error)}`, m)
}
const formattedCode = rawCode.match(/.{1,4}/g)?.join('-') || rawCode
let mediaMessage
for (const image of [conn.botProfile?.pairingImageUrl, 'https://files.catbox.moe/rt1yfo.jpeg']) {
try {
if (!image) continue
mediaMessage = await prepareWAMessageMedia({ image: { url: image } }, { upload: conn.waUploadToServer })
break
} catch {}
}
if (!mediaMessage) mediaMessage = await prepareWAMessageMedia({ image: { url: 'https://files.catbox.moe/rt1yfo.jpeg' } }, { upload: conn.waUploadToServer })
const interactivePayload = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({
text: [
'    𝖲𝗎𝖻-𝖡𝗈𝗍 ー(德) 𝖢𝗈𝖽𝖾.',
'',
'> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖨𝗇𝗌𝗍𝗋𝗎𝖼𝖼𝗂𝗈𝗇𝖾𝗌 𝗉⍺𝗋⍺ 𝗏𝗂𝗇𝖼𝗎𝗅⍺𝗋:',
'',
'𖹭 `𝟢.` 𝖲𝗂 𝗍𝖾 𝗅𝗅𝖾𝗀⍺ 𝗅⍺ 𝗇𝗈𝗍𝗂𝖿𝗂𝖼⍺𝖼𝗂𝗈́𝗇, 𝗍𝗈́𝖼⍺𝗅⍺ 𝗒 𝗌⍺𝗅𝗍⍺ ⍺𝗅 𝗉⍺𝗌𝗈 `𝟧`.',
'𖹭 `𝟣.` 𝖵𝖾 ⍺ 𝗅𝗈𝗌 𝟥 𝗉𝗎𝗇𝗍𝗂𝗍𝗈𝗌 `⋮` 𝗈 `𝖢𝗈𝗇𝖿𝗂𝗀𝗎𝗋⍺𝖼𝗂𝗈́𝗇`.',
'𖹭 `𝟤.` 𝖲𝖾𝗅𝖾𝖼𝖼𝗂𝗈𝗇⍺ `𝖣𝗂𝗌𝗉𝗈𝗌𝗂𝗍𝗂𝗏𝗈𝗌 𝗏𝗂𝗇𝖼𝗎𝗅⍺𝖽𝗈𝗌`.',
'𖹭 `𝟥.` 𝖳𝗈𝖼⍺ 𝖾𝗇 `𝖵𝗂𝗇𝖼𝗎𝗅⍺𝗋 𝗎𝗇 𝖽𝗂𝗌𝗉𝗈𝗌𝗂𝗍𝗂𝗏𝗈`.',
'𖹭 `𝟦.` 𝖤𝗅𝗂𝗀𝖾 `𝖵𝗂𝗇𝖼𝗎𝗅⍺𝗋 𝖼𝗈𝗇 𝖾𝗅 𝗇𝗎́𝗆𝖾𝗋𝗈 𝖽𝖾 𝗍𝖾𝗅𝖾́𝖿𝗈𝗇𝗈`.',
'𖹭 `𝟧.` 𝖯𝖾𝗀⍺ 𝖾𝗅 𝖼𝗈́𝖽𝗂𝗀𝗈 𝗊𝗎𝖾 𝖾𝗌𝗍⍺́ ⍺𝖻⍺𝗃𝗈.',
'',
'⎯⎯⵿⎯̸⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯̸⵿⎯⎯',
`> (っ- ‸ - ς) 𝖢𝗈́𝖽𝗂𝗀𝗈: *${formattedCode}*`
].join('\n')
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: `🌸 Tienes *${PAIRING_EXPIRATION_SECONDS} segundos*.`
}),
header: proto.Message.InteractiveMessage.Header.create({
hasMediaAttachment: true,
imageMessage: mediaMessage.imageMessage
}),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: [{
name: 'cta_copy',
buttonParamsJson: JSON.stringify({
display_text: '🌸 𝖢𝗈𝗉𝗂⍺𝗋 𝖢𝗈́𝖽𝗂𝗀𝗈',
copy_code: rawCode
})
}]
})
})
}
}
}, { quoted: m })
await conn.relayMessage(m.chat, interactivePayload.message, { messageId: interactivePayload.key.id })
setTimeout(() => conn.sendMessage(m.chat, { delete: interactivePayload.key }).catch(() => {}), PAIRING_EXPIRATION_MS).unref?.()
}
})
} catch (error) {
requestCooldown.delete(m.sender)
return conn.reply(m.chat, `🥀 No se pudo iniciar el código: ${error.message}`, m)
}
}
handler.help = ['code']
handler.tags = ['jadibot']
handler.command = ['code']
export default handler
