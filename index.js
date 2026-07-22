process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

try {
  if (process.env.RUBY_SMOKE_PAIRING_CODE && process.argv.includes('code')) await import('./scripts/pairing-smoke.js')
  else await import('./src/bootstrap/app.js')
} catch (error) {
  console.error(error)
  process.exit(1)
}
