import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const QRTerminal = require('@whiskeysockets/baileys/lib/Utils/qr-terminal.js')
let lastLines = 0

export async function renderNativeQr(text = '') {
return new Promise(resolve => QRTerminal.generate(String(text), { small: true }, resolve))
}

export async function printNativeQr(text = '') {
clearNativeQr()
const output = await renderNativeQr(text)
process.stdout.write(`${output}\n`)
lastLines = output.split('\n').length
return output
}

export function clearNativeQr() {
if (!lastLines) return
process.stdout.write(`\x1b[${lastLines}A`)
for (let i = 0; i < lastLines; i++) process.stdout.write('\x1b[2K\x1b[1B')
process.stdout.write(`\x1b[${lastLines}A`)
lastLines = 0
}
