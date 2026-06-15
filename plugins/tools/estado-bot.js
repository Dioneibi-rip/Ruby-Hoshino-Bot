import { generateReport } from '../../src/core/stability-monitor.js'

const handler = async (m) => {
const report = generateReport()
const queue = report.queue || {}
const text = `╭─────「 🤖 Estado del Bot 」─────
│ ⏱️ Uptime: ${report.uptime}
│ 🔌 Plugins: ${report.plugins}
│ 💾 RSS: ${report.memory.rss}
│ 📊 Heap: ${report.memory.heap} / ${report.memory.heapTotal}
│ 📬 En cola: ${queue.totalQueued || 0}
│ ⚡ Procesando: ${queue.activeCount || 0}
│ 👥 Usuarios en cola: ${queue.usersWithQueue || 0}
│ 📈 CPU 1m: ${report.cpu.load1}
│ 📉 CPU 5m: ${report.cpu.load5}
│ 💽 Errores DB: ${report.dbErrors}
╰──────────────────────────────`
await m.reply(text)
}
handler.command = /^(estadobot|botstat|queuestat|botstatus)$/i
export default handler
