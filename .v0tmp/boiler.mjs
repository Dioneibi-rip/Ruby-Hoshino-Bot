process.env.GROQ_API_KEY ||= 'x'
const { buildTools } = await import('../src/commands/ai/ruby/tools.js')
const { convertToOpenAITool } = await import('@langchain/core/utils/function_calling')
const tools = buildTools({ chat:'1@g.us', sender:'2@s.whatsapp.net', __isDioneibi:true }, { queueBackgroundTask(){} })
const specs = tools.map(t => convertToOpenAITool(t))
const raw = JSON.stringify(specs).length
const SCHEMA_URL = '"$schema":"https://json-schema.org/draft/2020-12/schema",'
console.log('$schema occurrences:', JSON.stringify(specs).split('https://json-schema.org').length - 1)
const stripped = specs.map(s => { const c = structuredClone(s); delete c.function.parameters.$schema; return c })
const after = JSON.stringify(stripped).length
console.log('raw chars', raw, '~'+Math.round(raw/3.6)+' tok')
console.log('sin $schema', after, '~'+Math.round(after/3.6)+' tok')
console.log('AHORRO:', raw-after, 'chars ~'+Math.round((raw-after)/3.6)+' tok')
