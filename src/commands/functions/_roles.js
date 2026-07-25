export const roles = {
'🌱 Viajero Novato': 0,
'⚔️ Aventurero': 10,
'🛡️ Guerrero Élite': 30,
'👑 Héroe Legendario': 50
}

export const DEFAULT_ROLE = Object.entries(roles)[0][0]

export function getRoleByLevel(level = 0) {
const safeLevel = Math.max(0, Number(level) || 0)
return (Object.entries(roles).sort((a, b) => b[1] - a[1]).find(([, minLevel]) => safeLevel >= minLevel) || [DEFAULT_ROLE])[0]
}

export function ensureUserRole(user = {}) {
if (!user || typeof user !== 'object') return DEFAULT_ROLE
const role = getRoleByLevel(user.level)
if (user.role !== role) user.role = role
return role
}

let handler = m => m
handler.before = async function (m) {
let user = global.db.getUser(m.sender)
let role = ensureUserRole(user)
global.db.updateUser(m.sender, { role })
return !0
}
export default handler
