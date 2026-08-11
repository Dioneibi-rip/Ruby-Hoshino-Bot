process.env.GROQ_API_KEY ||= 'x'
const { buildTools } = await import('../src/commands/ai/ruby/tools.js')
const { convertToOpenAITool } = await import('@langchain/core/utils/function_calling')
const tools = buildTools({ chat: '1@g.us', sender: '2@s.whatsapp.net', __isDioneibi: true }, { queueBackgroundTask() {} })
for (const n of ['schedule_message', 'dm_owner', 'wa_react', 'recall_memory']) {
  const t = tools.find(x => x.name === n)
  console.log('=====', n)
  console.log(JSON.stringify(convertToOpenAITool(t), null, 1))
}
