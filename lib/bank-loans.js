export function applyDebtWithholding(user,gross){
const amount=Math.max(0,Math.floor(Number(gross)||0))
const debt=Math.max(0,Math.floor(Number(user?.debt)||0))
if(!user||amount<=0||debt<=0)return{net:gross,withheld:0,debt}
const withheld=Math.min(debt,Math.floor(amount*0.5))
user.debt=Math.max(0,debt-withheld)
return{net:amount-withheld,withheld,debt:user.debt}
}
export function debtNotice(result,moneda){
if(!result?.withheld)return''
return`\n\n🏦 El banco retuvo ${result.withheld.toLocaleString()} ${moneda} para pagar tu deuda.`
}
export function loanLimit(user){
return Math.max(1000,(Math.max(1,Math.floor(Number(user?.level)||0))*1000))
}
export function parseAmount(value){
const amount=Math.floor(Number(String(value||'').replace(/[,._]/g,'')))
return Number.isFinite(amount)?amount:0
}
