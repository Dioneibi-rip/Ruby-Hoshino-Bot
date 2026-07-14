import axios from '../../infra/http.js'
import crypto from 'crypto'

const sessions = {}

// Generador de UUID compatible
const generateUUID = () => {
  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function decorateAiReply(title, text) {
  const body = String(text || 'Sin respuesta.').trim()
  return `╭─❖ 𓆩 ${title} 𓆪 ❖─╮
│ 🧠 𝚁𝚞𝚋𝚢 𝙰𝙸 𝚕𝚘 𝚑𝚊 𝚜𝚞𝚜𝚞𝚛𝚛𝚊𝚍𝚘:
├─────────────────────
${body.split('\n').map(line => `│ ${line}`.trimEnd()).join('\n')}
├─────────────────────
│ ✦ 𝙿𝚎𝚐𝚊𝚍𝚘 𝚊 𝚕𝚊 𝚙𝚊𝚛𝚎𝚍 • 𝚁𝚞𝚋𝚢 𝙷𝚘𝚜𝚑𝚒𝚗𝚘
╰─❖ 𖹭 ─────────────╯`.trim()
}

const parseCookies = (arr) => Object.fromEntries((arr || []).map(c => c.split(';')[0].split('=').map(s => s.trim())))

function cleanSpecialTags(text) {
  if (!text) return ''
  text = text.replace(/\ue200entity\ue202([^\ue201]+)\ue201/g, (match, p1) => {
    try {
      const arr = JSON.parse(p1)
      return arr[1] || arr[0] || ''
    } catch {
      return ''
    }
  })
  text = text.replace(/\ue200[^\ue201]*\ue201/g, '')
  return text.trim()
}

async function getSession() {
  const deviceId = generateUUID()
  try {
    const res = await axios.post('https://android.chat.openai.com/backend-anon/sentinel/chat-requirements', {}, {
      headers: {
        'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
        'OAI-Package-Name': 'com.openai.chatgpt',
        'OAI-Client-Type': 'android',
        'OAI-Device-Id': deviceId,
        'Accept-Language': 'id-ID,in;q=0.9',
        'X-Device-Tier': 'upper_mid',
        'X-OpenAI-Target-Path': '/backend-anon/sentinel/chat-requirements',
        'ChatGPT-Account-Id': 'default',
        'ChatGPT-Residency-Region': 'no_constraint',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    })

    const cookies = parseCookies(res.headers['set-cookie'])
    const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
    
    let oaiSc = cookies['oai-sc']
    if (!oaiSc && res.data?.token) {
      oaiSc = `0${res.data.token}`
    }

    const cookie = oaiSc && !cookieStr.includes('oai-sc') ? `oai-sc=${oaiSc}; ${cookieStr}` : cookieStr
    return { cookie, deviceId, parentMessageId: generateUUID() }
  } catch (error) {
    const status = error.response?.status || 'Desconocido'
    const statusText = error.response?.statusText || ''
    const msg = error.message || ''
    throw new Error(`[Fallo en getSession] Código: ${status} (${statusText}) | Info: ${msg}`)
  }
}

async function chatgpt(prompt, auth = null, chatId = null) {
  auth = auth || await getSession()
  if (!auth.deviceId) auth.deviceId = generateUUID()
  if (!auth.parentMessageId) auth.parentMessageId = generateUUID()

  const isAuthorized = !!(auth.authorization || auth.token)
  const baseUrl = isAuthorized ? 'https://android.chat.openai.com/backend-api' : 'https://android.chat.openai.com/backend-anon'
  
  const currentMessageId = generateUUID()
  const parentMessageId = auth.parentMessageId

  const headers = {
    'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
    'OAI-Package-Name': 'com.openai.chatgpt',
    'OAI-Client-Type': 'android',
    'OAI-Device-Id': auth.deviceId,
    'Accept-Language': 'id-ID,in;q=0.9',
    'X-Device-Tier': 'upper_mid',
    'X-OpenAI-Target-Path': isAuthorized ? '/backend-api/f/conversation' : '/backend-anon/f/conversation',
    'ChatGPT-Account-Id': isAuthorized ? (auth.accountId || 'default') : 'default',
    'ChatGPT-Residency-Region': 'no_constraint',
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Cookie': auth.cookie,
    'X-Sentinel-Payload': JSON.stringify({
      bot_token: {
        failure_reason: "-2: Standard Integrity API error (-2): The Play Store app is either not installed or not the official version.\nAsk the user to install an official and recent version of Play Store.\n (https://developer.android.com/google/play/integrity/reference/com/google/android/play/core/integrity/model/StandardIntegrityErrorCode.html#PLAY_STORE_NOT_FOUND).",
        failure_detail: "[qdb0.j(SourceFile:9), g4n.a(SourceFile:85), f4n.invokeSuspend(SourceFile:14), kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(SourceFile:5), qni.run(SourceFile:104), fnf.run(SourceFile:112)]"
      }
    })
  }

  if (isAuthorized) headers['Authorization'] = auth.authorization || `Bearer ${auth.token}`

  const body = {
    action: "next",
    messages: [{
      id: currentMessageId,
      author: { role: "user" },
      content: { content_type: "text", parts: [prompt] },
      status: "finished_successfully",
      recipient: "all"
    }],
    model: "auto",
    history_and_training_disabled: false,
    fork_from_shared_post: false,
    enable_message_followups: true,
    force_use_sse: true,
    force_use_search: null,
    force_paragen: false,
    supported_encodings: ["v1"],
    supports_buffering: true,
    timezone: "America/Santo_Domingo",
    timezone_offset_min: 240,
    system_hints: [],
    is_onboarding_conversation: false,
    no_auth_ad_preferences: { personalization_enabled: true, history_enabled: true },
    client_prepare_state: "none",
    stream: true
  }

  if (chatId) {
    body.conversation_id = chatId
    body.parent_message_id = parentMessageId
  }

  try {
    const stream = await axios.post(`${baseUrl}/f/conversation`, body, {
      headers,
      responseType: 'stream',
      timeout: 30000
    })

    return new Promise((resolve, reject) => {
      let text = '', buf = ''
      let lastPath = null
      let lastOp = null
      let finalChatId = chatId
      let currentAssistantMsgId = null

      stream.data.on('data', chunk => {
        buf += chunk.toString()
        const lines = buf.split('\n')
        buf = lines.pop()

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.substring(6))
              if (data.conversation_id) finalChatId = data.conversation_id
              
              const p = data.p !== undefined ? data.p : lastPath
              const o = data.o !== undefined ? data.o : lastOp

              if (data.p !== undefined) lastPath = data.p
              if (data.o !== undefined) lastOp = data.o

              if (o === 'add' && data.v && data.v.message) {
                if (data.v.message.author && data.v.message.author.role === 'assistant') {
                  currentAssistantMsgId = data.v.message.id
                  const parts = data.v.message.content?.parts
                  if (parts && parts[0]) text = parts[0]
                }
              } else if (o === 'patch' && Array.isArray(data.v)) {
                for (const op of data.v) {
                  if (op.o === 'append' && op.p && op.p.startsWith('/message/content/parts/')) text += op.v
                }
              } else if (o === 'append' && p && p.startsWith('/message/content/parts/') && typeof data.v === 'string') {
                text += data.v
              }
            } catch (e) {}
          }
        }
      })

      stream.data.on('end', () => {
        if (!text) return reject(new Error('El stream cerró pero ChatGPT no devolvió ningún texto.'))
        if (currentAssistantMsgId) auth.parentMessageId = currentAssistantMsgId
        resolve({ response: cleanSpecialTags(text), chatId: finalChatId, auth })
      })

      stream.data.on('error', (err) => {
        reject(new Error(`[Error en flujo Stream] Info: ${err.message}`))
      })
    })

  } catch (error) {
    const status = error.response?.status || 'Desconocido'
    const statusText = error.response?.statusText || ''
    const msg = error.message || ''
    throw new Error(`[Fallo en f/conversation] Código: ${status} (${statusText}) | Info: ${msg}`)
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text?.trim()) return m.reply(decorateAiReply('ChatGPT', `Uso: *${usedPrefix}${command} <pregunta>*`))
  await m.react?.('⏳')
  
  try {
    const userId = m.sender || m.chat
    sessions[userId] = sessions[userId] || {}

    const result = await chatgpt(text.trim(), sessions[userId].auth, sessions[userId].chatId)

    sessions[userId].auth = result.auth
    sessions[userId].chatId = result.chatId

    await conn.sendMessage(m.chat, { text: decorateAiReply('ChatGPT', result.response) }, { quoted: m })
    await m.react?.('✅')
  } catch (error) {
    console.error('[chatgpt handler error]:', error.message)
    await m.react?.('💔')

    // Formateamos el reporte detallado para enviarlo al chat directamente
    const errorReport = `⚠️ *SISTEMA DE LOGS INTERNOS* ⚠️\n\n` +
                        `*Mensaje del Error:* \n\`\`\`${error.message}\`\`\`\n\n` +
                        `💡 *Guía rápida de diagnóstico:* \n` +
                        `• *Código 403 (Forbidden):* La IP de tu hosting fue bloqueada por Cloudflare/OpenAI.\n` +
                        `• *Código 429 (Too Many Requests):* Tu IP alcanzó el límite de peticiones anónimas permitidas por minuto.\n` +
                        `• *Info: timeout...:* Tu servidor tardó demasiado en conectar con OpenAI (mala señal de red).`

    await m.reply(decorateAiReply('Error de Conexión', errorReport))
  }
}

handler.command = ['chatgpt', 'gpt', 'ia']
handler.help = ['chatgpt <pregunta>']
handler.tags = ['ai']
handler.limit = true
handler.register = true

export default handler