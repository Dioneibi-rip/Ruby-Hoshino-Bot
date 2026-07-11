process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

try {
  await import('./src/bootstrap/app.js')
} catch (error) {
  console.error(error)
  process.exit(1)
}
