import{parseAmount}from'../../lib/bank-loans.js'
const handler=async(m,{conn,args,usedPrefix})=>{
const user=global.db.getUser(m.sender)
const debt=Math.max(0,Math.floor(Number(user.debt)||0))
if(debt<=0)return conn.reply(m.chat,`🏦 No tienes deuda pendiente con el banco.`,m)
const balance=Math.max(0,Math.floor(Number(user.coin)||0))
if(balance<=0)return conn.reply(m.chat,`🏦 No tienes ${m.moneda} en cartera para pagar. Retira del banco con *${usedPrefix}retirar <cantidad>* si necesitas efectivo.`,m)
const amount=/^(all|todo)$/i.test(args[0]||'')?Math.min(balance,debt):parseAmount(args[0])
if(amount<=0)return conn.reply(m.chat,`🏦 Indica cuánto pagar.\n\n✦ Deuda actual: *${debt.toLocaleString()} ${m.moneda}*\n✦ Cartera: *${balance.toLocaleString()} ${m.moneda}*\n✦ Ejemplo: *${usedPrefix}pagar ${Math.min(balance,debt)}* o *${usedPrefix}pagar all*`,m)
if(amount>balance)return conn.reply(m.chat,`🏦 No tienes suficiente en cartera. Tienes *${balance.toLocaleString()} ${m.moneda}*.`,m)
const paid=Math.min(amount,debt)
user.coin=balance-paid
user.debt=debt-paid
global.db.updateUser(m.sender,{coin:user.coin,debt:user.debt})
return conn.reply(m.chat,`🏦 *Pago recibido*\n\n✦ Pagaste: *${paid.toLocaleString()} ${m.moneda}*\n✦ Deuda restante: *${user.debt.toLocaleString()} ${m.moneda}*\n✦ Cartera: *${user.coin.toLocaleString()} ${m.moneda}*`,m)
}
handler.help=['pagar <cantidad|all>']
handler.tags=['economy']
handler.command=['pagar','paydebt','pagardeuda','debtpay']
handler.group=true
handler.register=true
export default handler
