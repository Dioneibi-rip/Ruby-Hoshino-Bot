import { z } from 'zod'
const s = z.object({ a: z.string(), b: z.string().optional() })
console.log('--- has $schema in toJSONSchema? ---')
console.log(JSON.stringify(z.toJSONSchema(s)))
// intento de override del schema del tool via jsonSchema
const { tool } = await import('@langchain/core/tools')
const { convertToOpenAITool } = await import('@langchain/core/utils/function_calling')
const plain = z.toJSONSchema(s)
delete plain.$schema
const t = tool(async () => 'ok', { name: 'probe', description: 'd', schema: plain })
console.log('--- tool con JSON Schema plano ---')
console.log(JSON.stringify(convertToOpenAITool(t)))
