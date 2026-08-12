/**
 * Ruby Hoshino — Comando autónomo (.ruby)
 *
 * Este archivo es solo la superficie: el cerebro está en ./ruby/agent.js
 * (LangChain + OpenRouter), las capacidades en ./ruby/tools.js y la infraestructura
 * (Baileys, shell, memoria, cron, self-heal) en ./ruby/runtime.js.
 *
 * Se mantienen los exports que consume src/bootstrap/app.js:
 * attachRubyConn, selfHeal, reportErrorToOwner, actionJidOf, matchParticipant.
 */

import { runAgent, resetMemory, MODEL, TOOL_NAMES } from './ruby/agent.js'
import {
    clip, dmOwner, identifyDioneibi, initListeners, reportErrorToOwner,
    restoreCrons, selfHeal, setLiveConn, trackUsage, shouldAlert, ABUSE_WINDOW
} from './ruby/runtime.js'

export { reportErrorToOwner, selfHeal } from './ruby/runtime.js'
export { actionJidOf, matchParticipant } from './ruby/runtime.js'

/** Llamado por el bootstrap en cuanto el socket de WhatsApp queda listo. */
export function attachRubyConn(conn) {
    const live = setLiveConn(conn)
    initListeners(TOOL_NAMES.length)
    restoreCrons().catch(() => {})
    return !!live
}

initListeners(TOOL_NAMES.length)

const handler = async (m, { conn, text, usedPrefix, command }) => {
    setLiveConn(conn)
    m.__conn = conn
    const isOwner = await identifyDioneibi(conn, m)
    m.__isDioneibi = isOwner

    if (!text?.trim()) {
        return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖣𝗂𝗆𝖾 𝖺𝗅𝗀𝗈, 𝗒𝗈 𝗆𝖾 𝖾𝗇𝖼𝖺𝗋𝗀𝗈 𝖽𝖾𝗅 𝗋𝖾𝗌𝗍𝗈... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} Hola Ruby, ¿cómo uso el comando play?*${isOwner ? `\n> 𝖠𝗆𝗈: *${usedPrefix}${command} analiza el comando play, testea su api y súbelo a github*` : ''}`)
    }

    if (/^(reset|reiniciar|clear)$/i.test(text.trim())) {
        resetMemory(m)
        return m.reply('> 🧹 𝖬𝖾𝗆𝗈𝗋𝗂𝖺 𝖽𝖾 𝖾𝗌𝗍𝖾 𝖼𝗁𝖺𝗍 𝗅𝗂𝗆𝗉𝗂𝖺. ¡Empecemos de nuevo! ✨')
    }

    // Vigilancia de abuso: ráfagas sospechosas se reportan al privado del Owner.
    if (!isOwner) {
        const { abusive, hits } = trackUsage(m.sender)
        if (abusive && shouldAlert(`abuso:${m.sender}`, 600000)) {
            dmOwner(conn, `⚠️ *Posible abuso detectado*\n> Usuario: ${m.pushName || 'desconocido'} (${m.sender})\n> Chat: ${m.chat}\n> ${hits} invocaciones en menos de ${ABUSE_WINDOW / 1000}s\n> Último mensaje: ${clip(text.trim(), 300)}\n\n> Lo tengo vigilado, amo. 🌸`).catch(() => {})
        }
    }

    await m.react?.('⏳')
    try {
        const res = await runAgent({ m, text: text.trim(), isOwner, pushName: m.pushName })
        if (res.handedOff && !res.text) {
            // Ya avisó al chat y sigue trabajando en la continuación asíncrona.
            await m.react?.('🌸')
            return
        }
        const footer = isOwner && res.executed.length ? `\n\n> 🛠️ _Herramientas usadas: ${res.executed.join(', ')}_` : ''
        const body = (res.text || '> (っ- ‸ - ς) 𝖬𝖾 𝗊𝗎𝖾𝖽𝖾́ 𝗌𝗂𝗇 𝗉𝖺𝗅𝖺𝖻𝗋𝖺𝗌...') + footer
        await conn.sendMessage(m.chat, { text: clip(body, 8000) }, { quoted: m })
        await m.react?.('✅')
    } catch (error) {
        // Nada crashea el bot: Ruby explica el fallo en su voz y avisa al Owner.
        console.error('[Ruby Hoshino][agent]', error)
        resetMemory(m)
        await m.react?.('💔')
        const missingKey = /OPENROUTER_API_KEY/i.test(error?.message || '')
        await m.reply(missingKey
            ? `> (っ- ‸ - ς) 𝖠𝗆𝗈, 𝗆𝖾 𝖿𝖺𝗅𝗍𝖺 𝗆𝗂 𝗏𝗈𝗓... ✨\n\n> 💡 Necesito la variable *OPENROUTER_API_KEY* en el \`.env\` o en las variables del panel. Consíguela gratis en openrouter.ai/keys y reiníciame. 🌸`
            : `> (っ- ‸ - ς) 𝖠𝗅𝗀𝗈 𝗌𝖾 𝗋𝗈𝗆𝗉𝗂𝗈́ 𝖽𝖾𝗇𝗍𝗋𝗈 𝖽𝖾 𝗆𝗂́... ✨\n\n> 💡 *𝖣𝖾𝗍𝖺𝗅𝗅𝖾:* \`${error?.message || error}\``)
        // Siempre al privado: si el fallo ocurrió en un grupo, el Owner se entera igual.
        await reportErrorToOwner(conn, error, {
            comando: command,
            modelo: MODEL,
            chat: m.chat,
            usuario: m.sender,
            texto: clip(text.trim(), 200)
        })
    }
}

handler.command = ['ruby', 'Ruby', 'bot', 'ia']
handler.help = ['ruby <mensaje>']
handler.tags = ['ai']
handler.limit = true
handler.register = true

export default handler
