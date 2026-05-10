import { Sticker } from 'wa-sticker-formatter'
import fetch from 'node-fetch'

async function sticker(img, url, packname = '', author = '', categories = ['']) {
try {

let input

if (url && !img) {
let r = await fetch(url)
if (!r.ok) throw 'No se pudo descargar la imagen'
input = await r.buffer()
} else {
input = img
}

if (!input) throw 'Imagen inválida'

const st = new Sticker(input, {
pack: packname,
author: author,
type: 'full',
categories,
quality: 80
})

return await st.toBuffer()

} catch (e) {
console.error(e)
throw e
}
}

export { sticker }
