import { Sticker } from 'wa-sticker-formatter'
import fetch from 'node-fetch'

async function sticker(img, url, packname = '', author = '', categories = ['']) {
try {
let input = img
if (url && !img) {
let r = await fetch(url)
if (!r.ok) throw 'No se pudo descargar la imagen'
input = await r.buffer()
}
if (!input) throw 'Imagen inválida'
const st = new Sticker(input, {
pack: packname,
author: author,
type: 'full',
categories,
quality: 70
})
return await st.toBuffer()
} catch (e) {
throw e
}
}

async function addExif(buffer, packname = '', author = '') {
return sticker(buffer, null, packname, author)
}

export { sticker, addExif }