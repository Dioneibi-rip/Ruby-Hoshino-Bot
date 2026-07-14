let handler = async (m, { args }) => {
let user = global.db.getUser(m.sender)
let emoji = '🏦', emoji2 = '❌'

if (!args[0]) return m.reply(`${emoji} Ingresa la cantidad de *${m.moneda}* que deseas depositar.`)

if (args[0] === 'all') {
let total = user.coin || 0
if (total === 0) return m.reply(`${emoji2} No tienes nada en tu cartera para depositar.`)
await global.db.updateUser(m.sender, { coin: 0, bank: (user.bank || 0) + total })
await global.db.write?.()
return m.reply(`✿ Depositaste *¥${total.toLocaleString()} ${m.moneda}* en el banco, ya no podrán robártelo.`)
}

if (isNaN(args[0]) || parseInt(args[0]) <= 0)
return m.reply(`${emoji2} Debes ingresar una cantidad válida para depositar.\n\n> Ejemplo 1: *#d 25000*\n> Ejemplo 2: *#d all*`)

let cantidad = parseInt(args[0])
if ((user.coin || 0) < cantidad)
return m.reply(`${emoji2} Solo tienes *¥${(user.coin || 0).toLocaleString()} ${m.moneda}* en tu cartera.`)

await global.db.updateUser(m.sender, { coin: (user.coin || 0) - cantidad, bank: (user.bank || 0) + cantidad })
await global.db.write?.()

return m.reply(`✿ Depositaste *¥${cantidad.toLocaleString()} ${m.moneda}* en el banco, ya no podrán robártelo.`)
}

handler.help = ['depositar']
handler.tags = ['rpg']
handler.command = ['deposit', 'depositar', 'd', 'aguardar']
handler.group = true
handler.register = true

export default handler
