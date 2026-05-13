import { search, download } from 'aptoide-scraper'

let handler = async (m, { conn, usedPrefix, command, text }) => {
  const toFancy = (str) => {
    const map = {
      'a':'ᥲ','b':'ᑲ','c':'ᥴ','d':'ᑯ','e':'ᥱ','f':'𝖿','g':'g','h':'һ','i':'і','j':'j','k':'k','l':'ᥣ','m':'m','n':'ᥒ','o':'᥆','p':'⍴','q':'q','r':'r','s':'s','t':'𝗍','u':'ᥙ','v':'᥎','w':'ɯ','x':'x','y':'ᥡ','z':'z',
      'A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','G':'G','H':'H','I':'I','J':'J','K':'K','L':'L','M':'M','N':'N','O':'O','P':'P','Q':'Q','R':'R','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'
    }
    return str.split('').map(c => map[c] || c).join('')
  }

  if (!text) return conn.reply(m.chat, `🚩 *${toFancy("Ingrese el nombre de la apk")}*`, m, rcanal)

  try {
    await m.react(rwait)

    let searchA = await search(text)
    if (!searchA.length) throw false

    let data5 = await download(searchA[0].id)

    let txt = `
✿ ㅤ ׄㅤ 🪷̸ㅤ ˒˓ㅤ 𓏸̶ ㅤ ׄ   ✿
\`\`\`A P T O I D E   D L\`\`\`

┌͡╼᮫͜  ⟆ 🍟  ${toFancy("Resultados")}
┆᮫⌣⃕╼̟ᜒ 📱 ${toFancy("Nombre")}: ${data5.name}
┆⌣⃕╼̟ᜒ 📦 ${toFancy("Package")}: ${data5.package}
┆⌣⃕╼̟ᜒ 🪴 ${toFancy("Update")}: ${data5.lastup}
┆⌣⃕╼̟ᜒ ⚖ ${toFancy("Peso")}: ${data5.size}
└͡╼᮫͜ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘ ܁

𖥻 · ˖ ࣪ ${toFancy("Descargando Archivo")}... ☆`.trim()

    await conn.sendMessage(m.chat, {
      image: { url: data5.icon },
      caption: txt,
      contextInfo: {
        
      }
    }, { quoted: m })

    if (data5.size.includes('GB') || parseFloat(data5.size.replace(' MB', '')) > 999) {
      return conn.reply(m.chat, `🛑 *${toFancy("El archivo es demasiado pesado")}*`, m, rcanal)
    }

    let fkontak = {
      key: { fromMe: false, participant: '0@s.whatsapp.net' },
      message: { contactMessage: { displayName: 'Aptoide', vcard: '' }}
    }

    await conn.sendMessage(m.chat, {
      document: { url: data5.dllink },
      mimetype: 'application/vnd.android.package-archive',
      fileName: data5.name + '.apk'
    }, { quoted: fkontak })

    await m.react(done)

  } catch (e) {
    console.log(e)
    await m.react(error)
    return conn.reply(m.chat, `🛑 *${toFancy("Ocurrió un fallo al buscar")}*`, m, rcanal)
  }
}

handler.tags = ['descargas']
handler.help = ['apkmod']
handler.command = ['apk', 'modapk', 'aptoide']
handler.register = true

export default handler
