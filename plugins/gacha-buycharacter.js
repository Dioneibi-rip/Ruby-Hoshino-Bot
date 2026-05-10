import { loadVentas, saveVentas, getVentasInGroup, loadHarem, saveHarem, addOrUpdateClaim, isSameUserId } from '../lib/gacha-group.js'
import { loadCharacters, findCharacterById } from '../lib/gacha-characters.js'
import { resetProtectionOnTransfer } from '../lib/gacha-protection.js'

let handler = async (m, { conn, args }) => {
if (!args[0]) return m.reply('✿ Usa: *#comprarwaifu <número | nombre>*')

let ventas = await loadVentas()
let personajes = await loadCharacters()

const groupId = m.chat
const ventasGrupo = getVentasInGroup(ventas, groupId)

if (!ventasGrupo.length) return m.reply('✘ No hay waifus en venta en este grupo.')

let venta
let input = args.join(' ').trim()

if (!isNaN(input)) {
let index = Number(input) - 1
if (!ventasGrupo[index]) return m.reply('✘ Número inválido.')
venta = ventasGrupo[index]
} else {
venta = ventasGrupo.find(v => v.name.toLowerCase() === input.toLowerCase())
if (!venta) return m.reply('✘ No se encontró ese personaje en venta en este grupo.')
}

if (isSameUserId(venta.vendedor, m.sender)) return m.reply('✘ No puedes comprarte a ti mismo.')

let comprador = global.db.data.users[m.sender]
if (!comprador) return m.reply('✘ No estás registrado.')

let precio = Number(venta.precio) || 0
if ((comprador.coin || 0) < precio)
return m.reply(`✘ Dinero insuficiente.\nNecesitas *¥${precio.toLocaleString()} ${m.moneda}*`)

let vendedor = global.db.data.users[venta.vendedor]
if (!vendedor) vendedor = global.db.data.users[venta.vendedor] = { coin: 0 }

comprador.coin = (comprador.coin || 0) - precio
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

await global.db.write()

let personaje = findCharacterById(personajes, venta.id)
let valorOriginal = personaje?.value || 'Desconocido'

m.reply(
`◢✿ *COMPRA EXITOSA* ✿◤

✧ Personaje: *${venta.name}*
✧ Valor original: *${valorOriginal}*
✧ Precio: *¥${precio.toLocaleString()} ${m.moneda}*

✿ El personaje ahora forma parte de tu harem en este grupo.`
)
}

handler.help = ['comprarwaifu <número | nombre>']
handler.tags = ['waifus']
handler.command = ['comprarwaifu','buychar','buycharacter']
handler.group = true
handler.register = true

export default handler
