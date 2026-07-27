import { loadVentas, saveVentas, getVentasInGroup, loadHarem, saveHarem, addOrUpdateClaim, isSameUserId } from '../../library/gacha-group.js'
import { loadCharacters, findCharacterById } from '../../library/gacha-characters.js'
import { resetProtectionOnTransfer } from '../../library/gacha-protection.js'

let handler = async (m, { conn, args }) => {
if (!args[0]) return m.reply('✿ Usa: *#comprarwaifu <número | nombre>*')

let ventas = await loadVentas()
let personajes = await loadCharacters()

const groupId = m.chat
const ventasGrupo = getVentasInGroup(ventas, groupId)

if (!ventasGrupo.length) return m.reply('✘ No hay waifus en venta en este grupo.')

let venta
let input = args.join(' ').trim()

if (/^\d+$/.test(input)) {
let index = Number.parseInt(input, 10) - 1
if (!ventasGrupo[index]) return m.reply('✘ Número inválido.')
venta = ventasGrupo[index]
} else {
venta = ventasGrupo.find(v => {
const personaje = findCharacterById(personajes, v.id)
return String(v.name || personaje?.name || '').toLowerCase() === input.toLowerCase() || String(v.id) === input
})
if (!venta) return m.reply('✘ No se encontró ese personaje en venta en este grupo.')
}

if (isSameUserId(venta.vendedor, m.sender)) return m.reply('✘ No puedes comprarte a ti mismo.')
let precio = Number.parseInt(venta.precio, 10)
if (!Number.isSafeInteger(precio) || precio < 1) return m.reply('✘ Esta venta tiene un precio inválido.')
let impuesto = Math.floor(precio * 0.10)
let total = precio + impuesto

if (typeof global.db.buyGachaMarketSale === 'function') {
const result = global.db.buyGachaMarketSale({ groupId, characterId: venta.id, buyerId: m.sender, sellerId: venta.vendedor, price: precio, tax: impuesto })
if (!result) return m.reply(`✘ Dinero insuficiente o la venta ya no está disponible.
Necesitas *¥${total.toLocaleString()} ${m.moneda}* (precio *¥${precio.toLocaleString()}* + IVA *¥${impuesto.toLocaleString()}*)`)
} else {
let comprador = global.db.getUser(m.sender)
if ((comprador.coin || 0) < total)
return m.reply(`✘ Dinero insuficiente.
Necesitas *¥${total.toLocaleString()} ${m.moneda}* (precio *¥${precio.toLocaleString()}* + IVA *¥${impuesto.toLocaleString()}*)`)
let vendedor = global.db.getUser(venta.vendedor)
if (!vendedor) vendedor = global.db.getUser(venta.vendedor)
comprador.coin = (comprador.coin || 0) - total
vendedor.coin = (vendedor.coin || 0) + precio
let harem = await loadHarem()
const existingClaim = harem.find(c => c.groupId === groupId && String(c.characterId) === String(venta.id))
if (existingClaim) {
existingClaim.userId = m.sender
resetProtectionOnTransfer(existingClaim, { now: Date.now(), reason: 'market' })
} else {
addOrUpdateClaim(harem, groupId, m.sender, venta.id)
}
await saveHarem(harem)
ventas = ventas.filter(v => !(v.groupId === groupId && v.id === venta.id))
await saveVentas(ventas)
global.db.updateUser(m.sender, { coin: comprador.coin })
global.db.updateUser(venta.vendedor, { coin: vendedor.coin })
await global.db.write()
}

let personaje = findCharacterById(personajes, venta.id)
let nombrePersonaje = personaje?.name || venta.name || venta.id
let valorOriginal = personaje?.value || 'Desconocido'

m.reply(
`◢✿ *COMPRA EXITOSA* ✿◤

✧ Personaje: *${nombrePersonaje}*
✧ Valor original: *${valorOriginal}*
✧ Precio: *¥${precio.toLocaleString()} ${m.moneda}*
✧ IVA 10%: *¥${impuesto.toLocaleString()} ${m.moneda}*
✧ Total pagado: *¥${total.toLocaleString()} ${m.moneda}*

✿ El personaje ahora forma parte de tu harem en este grupo.`
)
}

handler.help = ['comprarwaifu <número | nombre>']
handler.tags = ['waifus']
handler.command = ['comprarwaifu','buychar','buycharacter']
handler.group = true
handler.register = true

export default handler
