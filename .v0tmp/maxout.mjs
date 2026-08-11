const OWNER_FLOOR = 2003 + 700 + 200   // tools sin $schema + system + contexto vivo
const HIST = 700
const TPM = 6000
console.log('Suelo fijo Owner (tools+system+ctx):', OWNER_FLOOR, 'tok')
console.log('+ historial:', OWNER_FLOOR + HIST, 'tok')
console.log('Presupuesto restante para resultados de tools:', TPM - OWNER_FLOOR - HIST, 'tok\n')
for (const chars of [6000, 4000, 2000, 1500]) {
  const tok = Math.round(chars / 3.6)
  const room = TPM - OWNER_FLOOR - HIST
  const fits = Math.floor(room / tok)
  console.log(`MAX_OUT=${String(chars).padStart(4)} → ${String(tok).padStart(4)} tok/resultado | caben ${fits} resultados antes del 413 ${fits < 1 ? '❌ UN SOLO read_file YA REVIENTA' : fits < 2 ? '⚠️ apenas uno' : '✅'}`)
}
