function pad(n) { return String(n).padStart(2, '0') }
function parts(date, timeZone) {
  const map = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone, year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(date).map(p => [p.type, p.value]))
  return map
}
function formatDate(date, fmt, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const p = parts(date, timeZone)
  return fmt.replace('DD', p.day).replace('MM', p.month).replace('YY', p.year).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second)
}
export default function moment(value = Date.now()) {
  const date = value instanceof Date ? value : new Date(value)
  return {
    diff(other) { return date.getTime() - (other?.valueOf?.() ?? new Date(other).getTime()) },
    format(fmt) { return formatDate(date, fmt) },
    fromNow() {
      const ms = Date.now() - date.getTime(); const abs = Math.abs(ms)
      const units = [['año',31536000000],['mes',2592000000],['día',86400000],['hora',3600000],['minuto',60000],['segundo',1000]]
      const [name,size] = units.find(([,s]) => abs >= s) || units.at(-1)
      const n = Math.max(1, Math.floor(abs / size)); return ms >= 0 ? `hace ${n} ${name}${n>1?'s':''}` : `en ${n} ${name}${n>1?'s':''}`
    },
    tz(zone) { return { format: fmt => formatDate(date, fmt, zone) } },
    valueOf() { return date.getTime() }
  }
}
