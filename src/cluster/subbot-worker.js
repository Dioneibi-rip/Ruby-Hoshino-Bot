process.env.RUBY_CLUSTER_WORKER = process.env.RUBY_CLUSTER_WORKER || 'true'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0'

try {
await import('../../settings.js')
await import('../bootstrap/app.js')
process.send?.({ type: 'ready', id: process.env.RUBY_WORKER_ID || '0' })
} catch (error) {
console.error(error)
process.exit(1)
}

process.on('message', message => {
if (message?.type === 'shutdown') process.exit(0)
})
