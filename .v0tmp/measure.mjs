process.env.GROQ_API_KEY ||= 'x'
const { buildTools, OWNER_ONLY } = await import('../src/commands/ai/ruby/tools.js')
const { convertToOpenAITool } = await import('@langchain/core/utils/function_calling')
const m = { chat: '1@g.us', sender: '2@s.whatsapp.net', key:{}, __conn: null }
const tools = buildTools(m, { queueBackgroundTask: () => {} })
let total = 0
const rows = []
for (const t of tools) {
  const json = JSON.stringify(convertToOpenAITool(t))
  total += json.length
  rows.push([t.name, json.length])
}
rows.sort((a,b)=>b[1]-a[1])
console.log('TOOL COUNT:', tools.length)
console.log('TOTAL schema chars:', total, '~tokens:', Math.round(total/3.6))
console.log('OWNER_ONLY count:', OWNER_ONLY.size)
console.log('\nTop 12 heaviest:')
for (const [n,c] of rows.slice(0,12)) console.log('  ', n.padEnd(24), c, '~'+Math.round(c/3.6)+'tok')
const ownerCost = rows.filter(r=>OWNER_ONLY.has(r[0])).reduce((a,r)=>a+r[1],0)
console.log('\nOwner-only schema chars:', ownerCost, '~tokens:', Math.round(ownerCost/3.6))
