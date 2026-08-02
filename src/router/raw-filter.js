import { commandsMap, getPrefixMatch } from './handler-utils.js'
import { messageHasModeratedLink } from '../core/moderation-utils.js'

export const COMMAND_PREFIX_FALLBACK = /^[#!./\\@]/

export function unwrapMessageContent(content = {}) {
return content?.ephemeralMessage?.message
|| content?.viewOnceMessage?.message
|| content?.viewOnceMessageV2?.message
|| content?.documentWithCaptionMessage?.message
|| content
}

export function getRawMessageChat(message = {}) {
return message?.key?.remoteJid || message?.chat || message?.remoteJid || ''
}

export function getRawMessageSender(message = {}) {
return message?.key?.participant || message?.participant || message?.key?.remoteJid || message?.sender || ''
}

export function getInteractiveResponseText(content = {}) {
const nativeFlow = content?.interactiveResponseMessage?.nativeFlowResponseMessage
const paramsJson = nativeFlow?.paramsJson
if (paramsJson) {
try {
const params = JSON.parse(paramsJson)
return params?.id
|| params?.selectedId
|| params?.rowId
|| params?.button_id
|| params?.buttonId
|| params?.command
|| params?.payload
|| params?.display_text
|| params?.title
|| ''
} catch {}
}
return nativeFlow?.name || content?.interactiveResponseMessage?.body?.text || ''
}

export function getRawMessageText(message = {}) {
const content = unwrapMessageContent(message?.message || message)
return content?.conversation
|| content?.extendedTextMessage?.text
|| content?.imageMessage?.caption
|| content?.videoMessage?.caption
|| content?.documentMessage?.caption
|| content?.buttonsResponseMessage?.selectedButtonId
|| content?.listResponseMessage?.singleSelectReply?.selectedRowId
|| content?.templateButtonReplyMessage?.selectedId
|| getInteractiveResponseText(content)
|| ''
}

export function getRawStickerHash(message = {}) {
const content = unwrapMessageContent(message?.message || message)
const sha = content?.stickerMessage?.fileSha256 || content?.imageMessage?.fileSha256
if (!sha) return ''
try {
return Buffer.from(sha).toString('base64')
} catch {
return ''
}
}

export function getRawCommandName(text = '') {
const trimmed = String(text || '').trim()
const match = trimmed.match(/^[#!./\\@](\S+)/)
return match?.[1]?.toLowerCase() || ''
}

export function isFreshRawMessage(message, maxAgeMs) {
const rawTimestamp = Number(message?.messageTimestamp || 0)
const messageTime = rawTimestamp > 0 ? rawTimestamp * 1000 : Date.now()
return Date.now() - messageTime <= maxAgeMs
}

export function getRawFastPath(conn, message = {}, { maxAgeMs = 60_000, getStickerCommandText = () => '' } = {}) {
const chat = conn?.decodeJid?.(getRawMessageChat(message)) || getRawMessageChat(message)
if (!chat || chat === 'status@broadcast') return null
if (!isFreshRawMessage(message, maxAgeMs)) return null
const rawText = getRawMessageText(message)
const stickerText = rawText ? '' : getStickerCommandText(getRawStickerHash(message), getRawMessageSender(message))
const text = rawText || stickerText || ''
const trimmed = String(text || '').trim()
const prefixMatch = trimmed ? getPrefixMatch(conn, {}, trimmed) : null
const usedPrefix = prefixMatch?.[0]?.[0] || ''
const parsed = usedPrefix ? parseRawCommand(trimmed, usedPrefix) : null
const rawCommand = (parsed?.command || getRawCommandName(trimmed)).toLowerCase()
const commandEntry = rawCommand ? commandsMap.get(rawCommand) : null
const hasPrefix = Boolean(usedPrefix || COMMAND_PREFIX_FALLBACK.test(trimmed))
const isCommandLike = Boolean(commandEntry || hasPrefix)
const needsModeration = chat.endsWith('@g.us') && messageHasModeratedLink(message)
const isInteractive = Boolean(getInteractiveResponseText(unwrapMessageContent(message?.message || message)))
const isPassive = !isCommandLike && !needsModeration && !isInteractive
return { chat, text: trimmed, usedPrefix, parsed, rawCommand, commandEntry, isCommandLike, needsModeration, isInteractive, isPassive }
}

export function parseRawCommand(text, usedPrefix) {
const noPrefix = text.replace(usedPrefix, '')
const parts = noPrefix.trim().split` `.filter(Boolean)
const [rawCommand, ...args] = parts
const _args = noPrefix.trim().split` `.slice(1)
return {
noPrefix,
args,
_args,
text: _args.join` `,
command: (rawCommand || '').toLowerCase(),
}
}
