export async function before(m) {
  if (m.isBaileys && m.fromMe) return true
  if (m.isGroup || !m.message) return false
  return false
}
