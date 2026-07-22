export const lodash = { pick: (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]])), random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min }
export function yargs() { return { exitProcess(){ return this }, parse(){ return { _: process.argv.slice(2) } }, argv: { _: process.argv.slice(2) } } }
yargs.argv = { _: process.argv.slice(2) }
export const syntaxerror = () => null
export default { lodash, yargs, syntaxerror }
