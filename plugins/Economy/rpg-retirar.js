import db from '../../lib/database.js'

let handler = async (m, { args }) => {
let user = global.db.data.users[m.sender]
let emoji = '🏦', emoji2 = '❌'
if (!args[0]) return m.reply(`${emoji} Ingresa la cantidad de *${m.moneda}* que deseas retirar.`)
if (args[0] === 'all') {
let count = parseInt(user.bank || 0)
if (!count) return m.reply(`${emoji2} No tienes suficientes *${m.moneda}* en el banco.`)
user.bank -= count
user.coin += count
await m.reply(`${emoji} Retiraste *${count.toLocaleString()} ${m.moneda}* del banco, ahora podrás usarlo pero también podrán robártelo.`)
return !0
}
if (!Number(args[0]) || parseInt(args[0]) <= 0) return m.reply(`${emoji2} Debes retirar una cantidad válida.\n > Ejemplo 1 » *#retirar 25000*\n> Ejemplo 2 » *#retirar all*`)
let count = parseInt(args[0])
if (!user.bank) return m.reply(`${emoji2} No tienes suficientes *${m.moneda}* en el Banco.`)
if (user.bank < count) return m.reply(`${emoji2} Solo tienes *${user.bank.toLocaleString()} ${m.moneda}* en el Banco.`)
user.bank -= count
user.coin += count
await m.reply(`${emoji} Retiraste *${count.toLocaleString()} ${m.moneda}* del banco, ahora podrás usarlo pero también podrán robártelo.`)}

handler.help = ['retirar']
handler.tags = ['rpg']
handler.command = ['withdraw', 'retirar', 'with']
handler.group = true
handler.register = true

export default handler
