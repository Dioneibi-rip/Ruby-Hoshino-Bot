const codes = {
  reset: '\x1b[0m', bold: '\x1b[1m', italic: '\x1b[3m', underline: '\x1b[4m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', gray: '\x1b[90m', grey: '\x1b[90m',
  redBright: '\x1b[91m', greenBright: '\x1b[92m', yellowBright: '\x1b[93m', blueBright: '\x1b[94m', magentaBright: '\x1b[95m', cyanBright: '\x1b[96m', whiteBright: '\x1b[97m',
  bgMagenta: '\x1b[45m'
}
const rgb = (r, g, b, bg = false) => `\x1b[${bg ? 48 : 38};2;${r};${g};${b}m`
const hexToRgb = hex => {
  const clean = String(hex).replace('#', '')
  const value = Number.parseInt(clean.length === 3 ? clean.split('').map(x => x + x).join('') : clean, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}
function styler(stack = []) {
  const apply = text => `${stack.join('')}${text}${codes.reset}`
  return new Proxy(apply, { get(target, prop) {
    if (prop === 'rgb') return (r, g, b) => styler([...stack, rgb(r, g, b)])
    if (prop === 'bgRgb') return (r, g, b) => styler([...stack, rgb(r, g, b, true)])
    if (prop === 'hex') return hex => styler([...stack, rgb(...hexToRgb(hex))])
    if (codes[prop]) return styler([...stack, codes[prop]])
    return target[prop]
  } })
}
const chalk = styler()
export default chalk
