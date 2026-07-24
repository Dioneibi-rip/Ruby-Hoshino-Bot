import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

let buatall = 1

let handler = async (m, { conn, args, usedPrefix, command, DevMode }) => {
const user = global.db.getUser(m.sender)
let win = Math.random() < 0.48
let Aku = win ? 48 : 52
let Kamu = win ? 96 : 13
let count = args[0]
let who = await resolveInteractionTarget(m, conn)
let username = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` })
count = count ? /all/i.test(count) ? Math.max(1, Math.abs(Number(user.coin) || 1)) : parseInt(count) : args[0] ? parseInt(args[0]) : 1
count = Math.max(1, count)
if (args.length < 1) {
await conn.reply(m.chat, `${emoji} Ingresa la cantidad de ` + `💸 *${m.moneda}*` + ' que deseas aportar contra' + ` *${botname}*` + `\n\n` + '`Ejemplo:`\n' + `> *${usedPrefix + command}* 100`, m);
return false;
}
if ((Number(user.coin) || 0) < count) return m.reply(`${emoji2} No tienes suficientes ${m.moneda} para apostar.`)
const updated = await global.db.settleUserBet(m.sender, { field: 'coin', bet: count, payout: win ? count * 2 : 0 })
if (!updated) return m.reply(`${emoji2} Tu saldo cambió antes de completar la apuesta. Vuelve a intentarlo.`)
if (!win) {
conn.reply(m.chat, `${emoji2} \`Veamos que numeros tienen!\`\n\n`+ `➠ *${botname}* : ${Aku}\n➠ *${username}* : ${Kamu}\n\n> ${username}, *PERDISTE* ${formatNumber(count)} 💸 ${m.moneda}.`.trim(), m)
} else if (win) {
conn.reply(m.chat, `${emoji2} \`Veamos que numeros tienen!\`\n\n`+ `➠ *${botname}* : ${Aku}\n➠ *${username}* : ${Kamu}\n\n> ${username}, *GANASTE* ${formatNumber(count * 2)} 💸 ${m.moneda}.`.trim(), m)
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
