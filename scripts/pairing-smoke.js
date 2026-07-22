import readline from 'readline'
import chalk from '../src/library/ansi.js'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise(resolve => rl.question(text, answer => resolve(answer.trim())))
const isValidPhoneNumber = (number) => /^\+?\d{8,15}$/.test(number)

let phoneNumber = process.env.RUBY_SMOKE_PHONE || ''
if (!phoneNumber) {
  do {
    phoneNumber = await question(chalk.bold.hex('#A020F0')(`\n📞 INGRESE SU NÚMERO DE WHATSAPP\n${chalk.white('Ejemplo: 5219999999999')}\n${chalk.yellow('➜ ')}`))
    phoneNumber = phoneNumber.replace(/\D/g, '')
    if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber}`
  } while (!isValidPhoneNumber(phoneNumber))
}
rl.close()

const addNumber = phoneNumber.replace(/\D/g, '')
const conn = {
  requestPairingCode: async (number) => {
    if (!/^\d{8,15}$/.test(number)) throw new TypeError('Número de pairing inválido')
    return process.env.RUBY_SMOKE_PAIRING_CODE || '12345678'
  }
}

let codeBot = await conn.requestPairingCode(addNumber)
codeBot = codeBot?.match(/.{1,4}/g)?.join('-') || codeBot
console.log(chalk.bold.white(' Codigo : ') + chalk.bold.bgMagenta(` ${codeBot} `))
