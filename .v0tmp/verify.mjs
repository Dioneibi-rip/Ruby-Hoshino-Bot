process.env.GROQ_API_KEY ||= 'x'
import fs from 'fs/promises'
const { buildTools, TOOL_NAMES } = await import('../src/commands/ai/ruby/tools.js')
const { convertToOpenAITool } = await import('@langchain/core/utils/function_calling')
const { MAX_OUT } = await import('../src/commands/ai/ruby/runtime.js')

console.log('TOOL_NAMES total (forceAll):', TOOL_NAMES.length)

const cost = (m) => buildTools(m, { queueBackgroundTask() {} })
  .reduce((a, t) => a + JSON.stringify(convertToOpenAITool(t)).length, 0)

const base = { chat: '1@g.us', sender: '2@s.whatsapp.net' }
const ownerChars = cost({ ...base, __isDioneibi: true })
const userChars = cost({ ...base, __isDioneibi: false })
const ownerTools = buildTools({ ...base, __isDioneibi: true }, { queueBackgroundTask() {} }).length
const userTools = buildTools({ ...base, __isDioneibi: false }, { queueBackgroundTask() {} }).length

const agentSrc = await fs.readFile('src/commands/ai/ruby/agent.js', 'utf8')
const sys = agentSrc.split('const SYSTEM_INSTRUCTION = `')[1].split('`\n')[0]
const sysTok = Math.round(sys.length / 3.6)

console.log('\n--- TOOLS EN EL PAYLOAD ---')
console.log('Owner  :', ownerTools, 'tools ~' + Math.round(ownerChars / 3.6) + ' tok')
console.log('Usuario:', userTools, 'tools ~' + Math.round(userChars / 3.6) + ' tok   (antes: 27 / ~3638 tok)')
console.log('\nSystem prompt ~' + sysTok + ' tok (antes ~1221)')
console.log('MAX_OUT:', MAX_OUT, 'chars ~' + Math.round(MAX_OUT / 3.6) + ' tok (antes 6000 / ~1667)')

const HIST = 700
const CTX = 200
for (const [who, chars] of [['Owner', ownerChars], ['Usuario', userChars]]) {
  const floor = Math.round(chars / 3.6) + sysTok + CTX
  console.log(`\n${who}: suelo fijo=${floor} tok | +historial(${HIST})=${floor + HIST} | margen tools=${6000 - floor - HIST} tok`)
  console.log('  veredicto:', floor + HIST < 6000 ? 'OK bajo 6000 TPM' : 'EXCEDE')
}
