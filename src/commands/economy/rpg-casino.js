import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

const MAX_BET = 75000
const CASINO_TAX_RATE = 0.08
const WIN_RATE = 0.47
const WIN_MULTIPLIER = 2

let handler = async (m, { conn, args, usedPrefix, command, DevMode }) => {
const user = global.db.getUser(m.sender)
if ((Number(user?.coin) || 0) <= 0) return m.reply(`${emoji2} ︵‿୨♡୧‿︵ No tienes fondos suficientes para apostar. Debes saldar tu deuda o conseguir ${m.moneda} primero.`)
let win = Math.random() < WIN_RATE
let Aku = win ? 48 : 52
let Kamu = win ? 96 : 13
let count = args[0]
let who = await resolveInteractionTarget(m, conn)
let username = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` })
const countText = count
count = count ? (/all/i.test(count) ? Math.min(MAX_BET, Math.max(1, Math.trunc(Number(user.coin) || 0))) : Number.parseInt(count, 10)) : 1
if ((countText && !/all/i.test(countText) && !/^\d+$/.test(String(countText))) || !Number.isSafeInteger(count) || count <= 0) return m.reply(`${emoji2} Ingresa una apuesta válida mayor que cero.`)
if (count > MAX_BET) return m.reply(`${emoji2} La apuesta máxima es ${formatNumber(MAX_BET)} ${m.moneda}.`)
if (args.length < 1) {
await conn.reply(m.chat, `${emoji} Ingresa la cantidad de ` + `💸 *${m.moneda}*` + ' que deseas aportar contra' + ` *${botname}*` + `\n\n` + '`Ejemplo:`\n' + `> *${usedPrefix + command}* 100`, m);
return false;
}
const casinoTax = win ? Math.floor(count * CASINO_TAX_RATE) : 0
const loss = count
const payout = win ? Math.max(0, Math.floor(count * WIN_MULTIPLIER) - casinoTax) : 0
const settledBet = count
const updated = await global.db.settleUserBet(m.sender, { field: 'coin', bet: settledBet, payout })
if (!updated) return m.reply(`${emoji2} Tu saldo cambió antes de completar la apuesta. Vuelve a intentarlo.`)
if (!win) {
conn.reply(m.chat, `${emoji2} \`Veamos que numeros tienen!\`\n\n`+ `➠ *${botname}* : ${Aku}\n➠ *${username}* : ${Kamu}\n\n> ${username}, *PERDISTE* ${formatNumber(loss)} 💸 ${m.moneda}.`.trim(), m)
} else if (win) {
conn.reply(m.chat, `${emoji2} \`Veamos que numeros tienen!\`\n\n`+ `➠ *${botname}* : ${Aku}\n➠ *${username}* : ${Kamu}\n\n> ${username}, *GANASTE* ${formatNumber(payout)} 💸 ${m.moneda}. Impuesto casino destruido: ${formatNumber(casinoTax)}.`.trim(), m)
} else {
conn.reply(m.chat, `${emoji2} \`Veamos que numeros tienen!\`\n\n`+ `➠ *${botname}* : ${Aku}\n➠ *${username}* : ${Kamu}\n\n> ${username} obtienes ${formatNumber(count * 1)} 💸 ${m.moneda}.`.trim(), m)}
}

handler.help = ['apostar *<cantidad>*']
handler.tags = ['economy']
handler.command = ['apostar','casino']
handler.group = true
handler.cooldown = 15000;
handler.register = true
handler.fail = null
handler.cooldownMessage = (seconds, time, hms) => `${emoji3} Ya has iniciado una apuesta recientemente, espera *⏱️ ${hms}* para apostar nuevamente`;

export default handler

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]
}

function formatNumber(number) {
return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
