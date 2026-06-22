import{loanLimit,parseAmount}from'../../lib/bank-loans.js'
const handler=async(m,{conn,args,usedPrefix,command})=>{
const user=global.db.getUser(m.sender)
const currentDebt=Math.max(0,Math.floor(Number(user.debt)||0))
if(currentDebt>0)return conn.reply(m.chat,`🏦 El banco rechazó tu solicitud porque ya debes *${currentDebt.toLocaleString()} ${m.moneda}*.\nPaga primero con *${usedPrefix}pagar <cantidad>* o *${usedPrefix}pagar all*.`,m)
const limit=loanLimit(user)
const amount=parseAmount(args[0])
if(amount<=0)return conn.reply(m.chat,`🏦 Indica cuánto quieres pedir prestado.\n\n✦ Límite actual: *${limit.toLocaleString()} ${m.moneda}*\n✦ Interés fijo: *20%*\n✦ Ejemplo: *${usedPrefix}${command} ${Math.min(1000,limit)}*`,m)
if(amount>limit)return conn.reply(m.chat,`🏦 El banco no presta tanto a tu nivel.\n\n✦ Tu nivel: *${user.level||0}*\n✦ Máximo permitido: *${limit.toLocaleString()} ${m.moneda}*`,m)
const debt=Math.ceil(amount*1.2)
user.bank=(Number(user.bank)||0)+amount
user.debt=debt
global.db.updateUser(m.sender,{bank:user.bank,debt:user.debt})
return conn.reply(m.chat,`🏦 *Préstamo aprobado*\n\n✦ Depositado en banco: *${amount.toLocaleString()} ${m.moneda}*\n✦ Interés aplicado: *20%*\n✦ Deuda total: *${debt.toLocaleString()} ${m.moneda}*\n\nSi ganas monedas con work, mine o crime, el banco retendrá automáticamente el 50% hasta saldar la deuda.`,m)
}
handler.help=['prestamo <cantidad>']
handler.tags=['economy']
handler.command=['prestamo','loan','credito','credit']
handler.group=true
handler.register=true
export default handler
