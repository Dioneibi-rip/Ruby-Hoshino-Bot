process.env.GROQ_API_KEY = 'gsk_test'
const agentSrc = await import('../src/commands/ai/ruby/agent.js')
const { buildTools } = await import('../src/commands/ai/ruby/tools.js')
const { ChatGroq } = await import('@langchain/groq')

// Reconstruimos la subclase igual que en agent.js para probar el efecto real.
class LeanChatGroq extends ChatGroq {
  invocationParams(options, ...rest) {
    const params = super.invocationParams(options, ...rest)
    for (const tool of params?.tools || []) {
      if (tool?.function?.parameters) delete tool.function.parameters.$schema
    }
    return params
  }
}
const tools = buildTools({ chat:'1@g.us', sender:'2@s.whatsapp.net', __isDioneibi:true }, { queueBackgroundTask(){} })
for (const [label, Klass] of [['ChatGroq normal', ChatGroq], ['LeanChatGroq', LeanChatGroq]]) {
  const llm = new Klass({ model:'llama-3.1-8b-instant', apiKey:'gsk_test' })
  const p = llm.invocationParams({ tools })
  const chars = JSON.stringify(p.tools).length
  const hits = JSON.stringify(p.tools).split('json-schema.org').length - 1
  console.log(label.padEnd(16), chars, 'chars ~'+Math.round(chars/3.6)+' tok | $schema x'+hits)
}
