process.env.GROQ_API_KEY ||= 'x'
const { buildTools } = await import('../src/commands/ai/ruby/tools.js')
const { convertToOpenAITool } = await import('@langchain/core/utils/function_calling')
const tools = buildTools({ chat: '1@g.us', sender: '2@s.whatsapp.net', __isDioneibi: true }, { queueBackgroundTask() {} })
const rows = tools.map(t => {
  const full = JSON.stringify(convertToOpenAITool(t)).length
  return { name: t.name, desc: (t.description || '').length, full }
}).sort((a, b) => b.full - a.full)
let d = 0, f = 0
for (const r of rows) { d += r.desc; f += r.full }
console.log('name'.padEnd(22), 'desc', 'total')
for (const r of rows) console.log(r.name.padEnd(22), String(r.desc).padStart(4), String(r.full).padStart(5))
console.log('\nSUM desc chars:', d, '~' + Math.round(d / 3.6) + ' tok')
console.log('SUM full chars:', f, '~' + Math.round(f / 3.6) + ' tok')
console.log('Schema boilerplate (full-desc):', f - d, '~' + Math.round((f - d) / 3.6) + ' tok')
