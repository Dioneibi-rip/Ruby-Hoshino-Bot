let handler = async (m, { args }) => {
const emoji = '🏦', emoji2 = '❌'
const input = String(args?.[0] || '').trim().toLowerCase()
if (!input) return m.reply(`${emoji} Ingresa la cantidad de *${m.moneda}* que deseas retirar.`)

const user = typeof global.db.getUserAsync === 'function'
? await global.db.getUserAsync(m.sender, { bypassCache: true })
: global.db.getUser(m.sender)
const bank = Math.max(0, Math.trunc(Number(user.bank) || 0))
const amount = input === 'all' ? bank : (/^\d+$/.test(input) ? Number.parseInt(input, 10) : NaN)

if (input === 'all' && amount === 0) return m.reply(`${emoji2} No tienes suficientes *${m.moneda}* en el banco.`)
if (!Number.isSafeInteger(amount) || amount <= 0) return m.reply(`${emoji2} Debes retirar una cantidad válida.
 > Ejemplo 1 » *#retirar 25000*
> Ejemplo 2 » *#retirar all*`)
if (!bank) return m.reply(`${emoji2} No tienes suficientes *${m.moneda}* en el Banco.`)
if (bank < amount) return m.reply(`${emoji2} Solo tienes *${bank.toLocaleString()} ${m.moneda}* en el Banco.`)

if (typeof global.db.transferUserEconomy === 'function') {
const updated = await global.db.transferUserEconomy(m.sender, { from: 'bank', to: 'coin', amount })
if (!updated) return m.reply(`${emoji2} Tu saldo cambió antes de completar el retiro. Vuelve a intentarlo.`)
} else {
await (typeof global.db.updateUserAsync === 'function' ? global.db.updateUserAsync : global.db.updateUser).call(global.db, m.sender, { bank: bank - amount, coin: (Number(user.coin) || 0) + amount })
}

return m.reply(`${emoji} Retiraste *${amount.toLocaleString()} ${m.moneda}* del banco, ahora podrás usarlo pero también podrán robártelo.`)
}

handler.help = ['retirar']
handler.tags = ['rpg']
handler.command = ['withdraw', 'retirar', 'with', 'ret']
handler.group = true
handler.register = true

export default handler
