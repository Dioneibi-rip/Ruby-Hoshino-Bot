import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

const newsletterJid = '120363335626706839@newsletter'
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥'

// Iconos aleatorios
const iconos = ['https://qu.ax/wwbar.jpg','https://qu.ax/iFzQw.jpeg','https://qu.ax/dsZyo.jpeg','https://qu.ax/eNdBB.jpeg','https://qu.ax/MSzGw.jpeg','https://qu.ax/JqMBW.jpeg','https://qu.ax/HKcSr.jpeg','https://qu.ax/HOuUU.jpeg','https://qu.ax/ojUNn.jpeg','https://qu.ax/HtqBi.jpeg','https://qu.ax/bmQOA.jpeg','https://qu.ax/nTFtU.jpeg','https://qu.ax/PYKgC.jpeg','https://qu.ax/exeBy.jpeg','https://qu.ax/SCxhf.jpeg','https://qu.ax/sqxSO.jpeg','https://qu.ax/cdSYJ.jpeg','https://qu.ax/dRmZY.jpeg','https://qu.ax/ubwLP.jpg','https://qu.ax/JSgSc.jpg','https://qu.ax/FUXJo.jpg','https://qu.ax/qhKUf.jpg','https://qu.ax/mZKgt.jpg']

const getRandomIcono = () => iconos[Math.floor(Math.random() * iconos.length)]

const toFancy = (str) => {
    const map = {'a':'ᥲ','b':'ᑲ','c':'ᥴ','d':'ᑯ','e':'ᥱ','f':'𝖿','g':'g','h':'һ','i':'і','j':'j','k':'k','l':'ᥣ','m':'m','n':'ᥒ','o':'᥆','p':'⍴','q':'q','r':'r','s':'s','t':'𝗍','u':'ᥙ','v':'᥎','w':'ɯ','x':'x','y':'ᥡ','z':'z','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','G':'G','H':'H','I':'I','J':'J','K':'K','L':'L','M':'M','N':'N','O':'O','P':'P','Q':'Q','R':'R','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'}
    return str.split('').map(c => map[c] || c).join('')
}

export async function before(m, { conn, participants, groupMetadata }) {
    // Validaciones básicas de seguridad y tipo de chat
    if (!m.messageStubType || !m.isGroup) return true
    
    const chat = global.db.data.chats[m.chat]
    if (!chat || !chat.welcome) return true

    // Validación robusta del bot principal (evita errores de formato JID)
    const botJid = conn.user.jid.split('@')[0]
    const primaryBot = chat.botPrimario ? chat.botPrimario.split('@')[0] : null
    if (primaryBot && botJid !== primaryBot) return true

    // Identificar si es Bienvenida o Despedida
    let isWelcome = m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD
    let isBye = m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE || m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE

    if (!isWelcome && !isBye) return true

    // === AQUÍ ESTÁ EL ARREGLO IMPORTANTE ===
    // Obtenemos la lista de usuarios afectados (puede ser 1 o varios)
    const usuariosAfectados = m.messageStubParameters || []

    // Recorremos CADA usuario para asegurarnos de que todos reciban su mensaje
    for (let userId of usuariosAfectados) {
        
        // Datos comunes
        const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg')
        const username = `@${userId.split('@')[0]}`
        const groupName = groupMetadata.subject
        const desc = groupMetadata.desc?.toString() || 'Sin descripción'
        const groupSize = groupMetadata.participants.length
        const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' })

        // --- LÓGICA DE BIENVENIDA ---
        if (isWelcome) {
            let text
            if (chat.welcomeText) {
                text = chat.welcomeText.replace(/@user/g, username).replace(/@subject/g, groupName).replace(/@desc/g, desc)
            } else {
                text = `
︶᮫໋۪۪᷼͡⏝᜔໋〫᷑ׄ♡᜔ׅ𝆬۟┅᮫໋ׅׄ᪲︶᮫᜔ׅᷭ͡⏝᮫᜔〪ׅ〫𝆬⢥ֶ𝆬✿۪۪𝆬֟🍒̷̸᩠〪۪۪〫〫〫ᷭ✿ֶ〫𝆬⡬᮫〪ׅׄ⏝᮫໋〪ׅ〫𝆬ׄ͡︶᜔ׄ┅᮫۪۪᪲

✿ ㅤ ׄㅤ 🪷̸ㅤ ˒˓ㅤ 𓏸̶ ㅤ ׄ   ✿
         \`\`\`B I E N V E N I D O\`\`\`

  *${toFancy("_͜𐨎݃🌹 ᩬᩬ̷̸໋  𐇽֟፝͝▱ֺּUsuario ̷̸̸̷ׁ່֢݁ᮢ▭ᮬ─")}* ${username}
  *${toFancy("_͜𐨎݃🌹 ᩬᩬ̷̸໋  𐇽֟፝͝▱ֺּGrupo ̷̸̸̷ׁ່֢݁ᮢ▭ᮬ─")}* ${groupName}

 ֺ    ﾺ  ۪  ﹙🌹 ֺ    𔓗
      _*/𝐓𝐞𝐧𝐞𝐦𝐨𝐬 𝐦𝐮𝐜𝐡𝐨 𝐩𝐨𝐫 𝐥𝐨 𝐜𝐮𝐚𝐥 𝐜𝐫𝐞𝐜𝐞𝐫 𝐲 𝐝𝐞𝐬𝐚𝐫𝐫𝐨𝐥𝐥𝐚𝐫𝐧𝐨𝐬 𝐦𝐮𝐜𝐡𝐨 𝐦𝐚́𝐬 𝐞𝐧 𝐞𝐥 𝐠𝐫𝐮𝐩𝐨 𝐞𝐫𝐞𝐬 𝐁𝐢𝐞𝐧𝐯𝐞𝐧𝐢𝐝𝐨 𝐬𝐢𝐧 𝐢𝐦𝐩𝐨𝐫𝐭𝐚𝐫 𝐪𝐮𝐞.../*_   

┌͡╼᮫͜  ⟆ ✿̼⃜  ${toFancy("Estadísticas")} ㅤ 
┆᮫⌣⃕╼̟ᜒ 👥 : ${groupSize}
┆⌣⃕╼̟ᜒ 📅 : ${fecha}
└͡╼᮫͜ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘ ܁ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘܁⌢̼ׄ

︶᮫໋۪۪᷼͡⏝᜔໋〫᷑ׄ♡᜔ׅ𝆬۟┅᮫໋ׅׄ᪲︶᮫᜔ׅᷭ͡⏝᮫᜔〪ׅ〫𝆬⢥ֶ𝆬✿۪۪𝆬֟🍒̷̸᩠〪۪۪〫〫〫ᷭ✿ֶ〫𝆬

> establece un mensaje de bienvenida con #setwelcome`.trim()
            }

            await conn.sendMessage(m.chat, {
                image: { url: pp },
                caption: text,
                contextInfo: {
                    mentionedJid: [userId],
                    isForwarded: true,
                    forwardingScore: 9999999,
                    forwardedNewsletterMessageInfo: { newsletterJid: newsletterJid, newsletterName: newsletterName, serverMessageId: -1 }}
            }, { quoted: null })
        }

        // --- LÓGICA DE DESPEDIDA ---
        if (isBye) {
            let text
            if (chat.byeText) {
                text = chat.byeText.replace(/@user/g, username).replace(/@subject/g, groupName)
            } else {
                text = `
︶᮫໋۪۪᷼͡⏝᜔໋〫᷑ׄ♡᜔ׅ𝆬۟┅᮫໋ׅׄ᪲︶᮫᜔ׅᷭ͡⏝᮫᜔〪ׅ〫𝆬⢥ֶ𝆬✿۪۪𝆬֟🍒̷̸᩠〪۪۪〫〫〫ᷭ✿ֶ〫𝆬⡬᮫〪ׅׄ⏝᮫໋〪ׅ〫𝆬ׄ͡︶᜔ׄ┅᮫۪۪᪲

✿ ㅤ ׄㅤ 🪷̸ㅤ ˒˓ㅤ 𓏸̶ ㅤ ׄ   ✿
         \`\`\`S A Y O N A R A\`\`\`

ㅤ    *${toFancy("Se ha ido un usuario...")}*

┌͡╼᮫͜  ⟆ ✿̼⃜  ${toFancy("Datos")} ㅤ 
┆᮫⌣⃕╼̟ᜒ 👤 ${username}
┆⌣⃕╼̟ᜒ 🍂 ${toFancy("Ha dejado:")}
┆⌣⃕╼̟ᜒ ${groupName}
└͡╼᮫͜ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘ ܁ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘܁⌢̼ׄ

 𖥻    ·  ˖ ࣪  𓈃    ${toFancy("Estado Actual")}    ‧₊˚ ㅤ ☆
꒰꒰ ࣪  ㅤ 𓂃࣪  ✦ ᜔ ໋ㅤㅤ ⏝︶     ֺ  ⪨  𝄖  ֹ
                 ⋮ ꯭͡𖹭꯭͡ ⋮     🥥     ⋮ ꯭͡𖹭꯭͡ ⋮          
-        ${groupSize}     —     ${fecha}

︶᮫໋۪۪᷼͡⏝᜔໋〫᷑ׄ♡᜔ׅ𝆬۟┅᮫໋ׅׄ᪲︶᮫᜔ׅᷭ͡⏝᮫᜔〪ׅ〫𝆬⢥ֶ𝆬✿۪۪𝆬֟🍒̷̸᩠〪۪۪〫〫〫ᷭ✿ֶ〫𝆬

> establece un mensaje de despedida con #setbye`.trim()
            }

            await conn.sendMessage(m.chat, {
                image: { url: pp },
                caption: text,
                contextInfo: {
                    mentionedJid: [userId],
                    isForwarded: true,
                    forwardingScore: 9999999,
                    forwardedNewsletterMessageInfo: { newsletterJid: newsletterJid, newsletterName: newsletterName, serverMessageId: -1 }}
            }, { quoted: null })
        }
    }
}
export default { before }
