import { searchManhwa, getManhwaChapters, buildManhwaPdf } from '../../lib/hentai.js'
import sharp from 'sharp'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    
    // OPCIONAL: Si quieres que siga siendo NSFW, descomenta esto:
    /*
    if (!global.db.getChat(m.chat).nsfw && m.isGroup) {
        return m.reply(`⸺      \`ㅤ  A V I S Oㅤ\`\n\`ㅤ ݰ   \`\n          𝗁 𝗲𝘆 ㅤܐㅤׄㅤ𝗬 𝗈𝗎!      *;* ⎖  𓌛ㅤㅤㅤ\n⎯⎯̸⎯⎯꯭⎯꯭⎯꯭⎯꯭⎯꯭⎯⎯̸⎯⎯\n\n> ㅤㅤㅤ𝖤𝗅 𝖼𝗈𝗇𝗍𝖾𝗇𝗂𝖽𝗈 𝖭𝖲𝖥𝖶 𝖾𝗌𝗍𝖺 𝖽𝖾𝗌𝖺𝖼𝗍𝗂𝗏𝖺𝖽𝗈  .\n\n\`ㅤㅤㅤܐ⸺𝘗𝘪𝘥𝘦 𝘢 𝘶𝘯 𝘢𝘥𝘮𝘪𝘯 𝘲𝘶𝘦 𝘭𝘰 𝘢𝘤𝘵𝘪𝘷𝘦\` ㅤׅ     ㅤׄ`)
    }
    */

    if (!text) {
        return conn.reply(m.chat, `          ꒰͡ ͜⠸͜͡ ⠸͜͡꒱ㅤֺ  𓉣˒ㅤ꒰͡ ͜⠸͜͡ ⠸͜͡꒱\n\n⏜❜   🌸⃞ 𝗢𝗙𝗥𝗘𝗖𝗘𝗠𝗢𝗦 \n\n> ︵❜    ⩅🍡⩅   𝖡𝗎𝗌𝖼𝖺𝗋 𝗆𝖺𝗇𝗁𝗐𝖺:\n> ︵❜    ⩅🍥⩅   ${usedPrefix + command} 𝖻𝗎𝗌𝖼𝖺𝗋 𝖲𝗈𝗅𝗈 𝖫𝖾𝗏𝖾𝗅𝗂𝗇𝗀\n> ︵❜    ⩅🌸⩅   𝖵𝖾𝗋 𝖢𝖺𝗉𝗂𝗍𝗎𝗅𝗈𝗌:\n> ︵❜    ⩅🍡⩅   ${usedPrefix + command} 𝖼𝖺𝗉𝗌 <𝖨𝖣_𝖬𝖺𝗇𝗁𝗐𝖺>\n> ︵❜    ⩅🌸⩅   𝖣𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝗋 𝖢𝖺𝗉𝗂𝗍𝗎𝗅𝗈:\n> ︵❜    ⩅🍥⩅   ${usedPrefix + command} 𝖽𝗅 <𝖨𝖣_𝖢𝖺𝗉𝗂𝗍𝗎𝗅𝗈>\n\n          ꒰͡ ͜⠸͜͡ ⠸͜͡꒱ㅤֺ  𓉣˒ㅤ꒰͡ ͜⠸͜͡ ⠸͜͡꒱`, m)
    }

    try {
        // 1. COMANDO: BUSCAR
        if (/^buscar\s+/i.test(text)) {
            const query = text.replace(/^buscar\s+/i, '').trim()
            if (!query) return conn.reply(m.chat, '`ㅤܐ⸺𝘌𝘴𝘤𝘳𝘪𝘣𝘦 𝘢𝘭𝘨𝘰 𝘱𝘢𝘳𝘢 𝘣𝘶𝘴𝘤𝘢𝘳` ㅤׅ  ㅤׄ', m)
            
            const results = await searchManhwa(query)
            if (!results.length) return conn.reply(m.chat, '`ㅤܐ⸺𝘕𝘰 𝘴𝘦 𝘦𝘯𝘤𝘰𝘯𝘵𝘳𝘢𝘳𝘰𝘯 𝘳𝘦𝘴𝘶𝘭𝘵𝘢𝘥𝘰𝘴` ㅤׅ  ㅤׄ', m)
            
            let cap = '𞋪 ׅ ꩌ ۪  📚 𝗦𝗲𝗮𝗿𝗰𝗵 𝗠𝗮𝗻𝗵𝘄𝗮  ᜔ ݁ 🍣ᩧ〪࣪𝆬  ֔  ࣭  \n\n─  𝕰𝗇𝖼𝗈𝗇𝗍𝗋𝖺𝗆𝗈𝗌 𝗅𝗈𝗌 𝗌𝗂𝗀𝗎𝗂𝖾𝗇𝗍𝖾𝗌 𝗋𝖾𝗌𝗎𝗅𝗍𝖺𝖽𝗈𝗌:\n\n'
            results.forEach((item, idx) => {
                cap += `─『🍡』 *${idx + 1}.* ${item.title}\n`
                cap += `─『🆔』 *ID:* ${item.id}\n\n`
            })
            cap += '╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼\n\n'
            cap += `> 𝖴𝗌𝖺: ${usedPrefix + command} 𝖼𝖺𝗉𝗌 <ID> 𝗉𝖺𝗋𝖺 𝗏𝖾𝗋 𝗅𝗈𝗌 𝖼𝖺𝗉𝗂𝗍𝗎𝗅𝗈𝗌.`
            
            return await conn.reply(m.chat, cap, m)
        }

        // 2. COMANDO: VER CAPÍTULOS
        if (/^caps\s+/i.test(text)) {
            const mangaId = text.replace(/^caps\s+/i, '').trim()
            if (!mangaId) return conn.reply(m.chat, '`ㅤܐ⸺𝘗𝘳𝘰𝘱𝘰𝘳𝘤𝘪𝘰𝘯𝘢 𝘦𝘭 𝘐𝘋 𝘥𝘦𝘭 𝘔𝘢𝘯𝘩𝘸𝘢` ㅤׅ  ㅤׄ', m)
            
            await m.react('⏳')
            const data = await getManhwaChapters(mangaId)
            
            if (!data.chapters.length) return conn.reply(m.chat, '`ㅤܐ⸺𝘌𝘴𝘵𝘦 𝘔𝘢𝘯𝘩𝘸𝘢 𝘯𝘰 𝘵𝘪𝘦𝘯𝘦 𝘤𝘢𝘱𝘪𝘵𝘶𝘭𝘰𝘴` ㅤׅ  ㅤׄ', m)

            let cap = `𞋪 ׅ ꩌ ۪  📖 𝗖𝗮𝗽𝗶𝘁𝘂𝗹𝗼𝘀: ${data.title}  ᜔ ݁ 🍥ᩧ〪࣪𝆬  ֔  ࣭  \n\n`
            
            // Limitamos a mostrar los últimos 30 para no saturar el chat
            const listToShow = data.chapters.slice(-30) 
            listToShow.forEach(ch => {
                cap += `─『🌸』 *Cap. ${ch.chapter}* ➾ ID: ${ch.id}\n`
            })
            
            if (data.chapters.length > 30) cap += `\n*(Se ocultan capítulos antiguos)*\n`
            
            cap += '\n╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼\n\n'
            cap += `> 𝖴𝗌𝖺: ${usedPrefix + command} 𝖽𝗅 <ID_Capitulo> 𝗉𝖺𝗋𝖺 𝖽𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝗋𝗅𝗈.`
            
            await m.react('✅')
            return await conn.reply(m.chat, cap, m)
        }

        // 3. COMANDO: DESCARGAR CAPÍTULO
        if (/^dl\s+/i.test(text)) {
            const chapterId = text.replace(/^dl\s+/i, '').trim()
            if (!chapterId) return conn.reply(m.chat, '`ㅤܐ⸺𝘗𝘳𝘰𝘱𝘰𝘳𝘤𝘪𝘰𝘯𝘢 𝘦𝘭 𝘐𝘋 𝘥𝘦𝘭 𝘊𝘢𝘱𝘪𝘵𝘶𝘭𝘰` ㅤׅ  ㅤׄ', m)

            await m.react('⏳')
            
            // Construimos el PDF
            const { pdfBuffer, fileName, pageCount, coverBuffer } = await buildManhwaPdf(chapterId, "Manhwa")

            // Generamos la miniatura para el documento
            let jpegThumbnail
            try {
                jpegThumbnail = await sharp(coverBuffer)
                    .resize(250, 250, { fit: 'cover', position: 'center' })
                    .jpeg({ quality: 80 })
                    .toBuffer()
            } catch (thumbError) {
                jpegThumbnail = coverBuffer
            }

            // Enviamos el PDF
            await conn.sendMessage(m.chat, { 
                document: pdfBuffer, 
                mimetype: 'application/pdf', 
                fileName: fileName, 
                pageCount: pageCount, 
                jpegThumbnail: jpegThumbnail 
            }, { quoted: m })
            
            return await m.react('✅')
        }

        // Si el usuario escribe algo que no es buscar, caps o dl
        return conn.reply(m.chat, `\`ㅤܐ⸺𝘊𝘰𝘮𝘢𝘯𝘥𝘰 𝘪𝘯𝘷𝘢𝘭𝘪𝘥𝘰. 𝘜𝘴𝘢 ${usedPrefix + command} 𝘱𝘢𝘳𝘢 𝘷𝘦𝘳 𝘦𝘭 𝘮𝘦𝘯𝘶.\` ㅤׅ  ㅤׄ`, m)

    } catch (e) {
        await m.react('❌')
        await conn.reply(m.chat, `⸺      \`ㅤ  E R R O Rㅤ\`\n\`ㅤ ݰ   \`\n          𝗁 𝗲𝘆 ㅤܐㅤׄㅤ𝗬 𝗈𝗎!      *;* ⎖  𓌛ㅤㅤㅤ\n⎯⎯̸⎯⎯꯭⎯꯭⎯꯭⎯꯭⎯꯭⎯⎯̸⎯⎯\n\n> ㅤㅤㅤ𝖮𝖼𝗎𝗋𝗋𝗂𝗈 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝗂𝗇𝖾𝗌𝗉𝖾𝗋𝖺𝖽𝗈  .\n\n\`ㅤㅤㅤܐ⸺${e.message}\` ㅤׅ     ㅤׄ`, m)
    }
}

handler.help = ['manhwa buscar <texto>', 'manhwa caps <id>', 'manhwa dl <id>']
handler.tags = ['download']
handler.command = ['manhwa', 'mhdl', 'webtoon']
handler.premium = false

export default handler
