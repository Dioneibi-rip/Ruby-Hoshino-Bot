import { parseArgs } from 'util'

export function parseArgv(args = process.argv.slice(2)) {
  const normalized = args.map(arg => String(arg).startsWith('--') ? arg : arg)
  const { values, positionals } = parseArgs({ args: normalized, strict: false, allowPositionals: true })
  return { ...values, _: positionals }
}
