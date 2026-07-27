let handler = async (m, { args }) => {
const emoji = '🏦', emoji2 = '❌'
const input = String(args?.[0] || '').trim().toLowerCase()

if (!input) return m.reply(`${emoji} Ingresa la cantidad de *${m.moneda}* que deseas depositar.`)

const user = typeof global.db.getUserAsync === 'function'
? await global.db.getUserAsync(m.sender, { bypassCache: true })
: global.db.getUser(m.sender)
const wallet = Math.max(0, Math.trunc(Number(user.coin) || 0))

const amount = input === 'all' ? wallet : (/^\d+$/.test(input) ? Number.parseInt(input, 10) : NaN)
if (input === 'all' && amount === 0) return m.reply(`${emoji2} No tienes nada en tu cartera para depositar.`)
if (!Number.isSafeInteger(amount) || amount <= 0) {
return m.reply(`${emoji2} Debes ingresar una cantidad válida para depositar.

> Ejemplo 1: *#d 25000*
> Ejemplo 2: *#d all*`)
}
if (wallet < amount) return m.reply(`${emoji2} Solo tienes *¥${wallet.toLocaleString()} ${m.moneda}* en tu cartera.`)

if (typeof global.db.transferUserEconomy === 'function') {
const updated = await global.db.transferUserEconomy(m.sender, { from: 'coin', to: 'bank', amount })
if (!updated) return m.reply(`${emoji2} Tu saldo cambió antes de completar el depósito. Vuelve a intentarlo.`)
} else {
await (typeof global.db.updateUserAsync === 'function' ? global.db.updateUserAsync : global.db.updateUser).call(global.db, m.sender, { coin: wallet - amount, bank: (Number(user.bank) || 0) + amount })
}

return m.reply(`✿ Depositaste *¥${amount.toLocaleString()} ${m.moneda}* en el banco, ya no podrán robártelo.`)
}

handler.help = ['depositar']
handler.tags = ['rpg']
handler.command = ['deposit', 'depositar', 'd', 'aguardar']
handler.group = true
handler.register = true

export default handler
