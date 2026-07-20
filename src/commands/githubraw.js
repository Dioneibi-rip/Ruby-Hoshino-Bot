function formatUrl(url) {
  if (!url) return url
  if (url.includes('github.com') && url.includes('/blob/')) {
    return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
  }
  return url.trim()
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const emoji = global.emoji || '✦'
  const emoji2 = global.emoji2 || '✘'
  const input = (text || '').trim()
  const example = `${usedPrefix || '.'}${command || 'githubraw'} https://github.com/usuario/repo/blob/main/imagen.png`

  if (!input || !input.includes('github.com') || !input.includes('/blob/')) {
    return conn.reply(m.chat, `${emoji2} *Enlace de GitHub inválido.*\n\n${emoji} Envíame una URL de archivo de GitHub que contenga */blob/* para convertirla a Raw.\n\n*Ejemplo:*\n${example}`, m)
  }

  const rawUrl = formatUrl(input)
  if (rawUrl === input || !rawUrl.includes('raw.githubusercontent.com')) {
    return conn.reply(m.chat, `${emoji2} No pude convertir ese enlace. Verifica que sea una URL válida de archivo en GitHub.`, m)
  }

  return conn.reply(m.chat, rawUrl, m)
}

handler.help = ['githubraw <url>', 'rawurl <url>', 'raw <url>']
handler.tags = ['tools', 'github']
handler.command = ['raw', 'rawurl', 'githubraw']
handler.register = true

export { formatUrl }
export default handler
