import { canManageBotSecurity, isChatBannedForBot, normalizeSessionJid } from '../core/session-utils.js'

export function normalizeConnectionJid(conn) {
return normalizeSessionJid(conn?.user?.jid || conn?.user?.id || conn)
}

export function isSameJid(a, b) {
const left = String(a || '').split('@')[0]
const right = String(b || '').split('@')[0]
return Boolean(left && right && left === right)
}

export function isBotSender(conn, m, sender) {
const botJid = conn?.decodeJid?.(conn?.user?.jid) || conn?.user?.jid
return Boolean(m?.fromMe || isSameJid(sender, botJid))
}


export function canManageBotProfile(sender, conn, permissionContext = {}) {
const clean = value => String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '')
const from = clean(sender)
const owner = clean(conn?.session?.ownerJid)
const bot = clean(conn?.user?.jid || conn?.user?.id)
return Boolean(permissionContext.isROwner || permissionContext.isOwner || from && (from === owner || from === bot))
}

export const JAIL_COMMAND_WHITELIST = ['fianza', 'depositar', 'retirar', 'dep', 'with', 'bal', 'inventario', 'perfil', 'menu']

export function isJailWhitelistedCommand(command) {
return JAIL_COMMAND_WHITELIST.includes(String(command || '').trim().toLowerCase())
}

export function pluginNeedsJob(plugin, name, command) {
const tags = Array.isArray(plugin?.tags) ? plugin.tags.map((tag) => String(tag).toLowerCase()) : []
const economyTagged = tags.some((tag) => ['economy', 'economia', 'rpg'].includes(tag)) || String(name || '').startsWith('rpg-')
if (!economyTagged) return false
return !['trabajo', 'job', 'empleo', 'fianza', 'bail'].includes(String(command || '').toLowerCase())
}

export function userHasJob(user) {
const job = String(user?.job || '').trim().toLowerCase()
return Boolean(job && !['ninguno', 'none', 'null', 'undefined', 'sin trabajo'].includes(job))
}

export function pluginRequiresGroupParticipants(plugin = {}) {
return Boolean(plugin.admin || plugin.botAdmin || plugin.needsParticipants)
}

export function buildGuardContext({ conn, plugin, name, m, extra, sender, permissionContext, chat, user, isEconomyPremium, fail, isCelestialCommand }) {
const isBotSelf = isBotSender(conn, m, sender)
const canBypassGroupRestrictions = isBotSelf || permissionContext.isOwner || permissionContext.isROwner
return {
conn,
plugin,
name,
m,
extra,
sender,
permissionContext,
chat,
user,
isEconomyPremium,
fail,
isCelestialCommand,
isBotSelf,
canBypassGroupRestrictions,
isBotSecurityManager: canManageBotSecurity(sender, conn),
adminMode: chat?.modoadmin,
}
}

export const PLUGIN_GUARDS = [
{
check: ({ m, chat, isBotSelf, isBotSecurityManager, isCelestialCommand, conn }) => m.isGroup && !isCelestialCommand && !isBotSelf && !isBotSecurityManager && isChatBannedForBot(chat, normalizeConnectionJid(conn)),
fail: async () => true,
},
{
check: ({ m, user, isBotSelf }) => Boolean(m.text && user?.banned && !isBotSelf),
fail: async ({ m, sender, user }) => {
if (!user.lastBanMsg || Date.now() - user.lastBanMsg > 30_000) {
m.reply(`《✦》Estas baneado/a, no puedes usar comandos en este bot!\n\n${user.bannedReason ? `✰ *Motivo:* ${user.bannedReason}` : '✰ *Motivo:* Sin Especificar'}\n\n> ✧ Si este Bot es cuenta ...`)
global.db?.updateUser?.(sender, { lastBanMsg: Date.now() })
}
return true
},
},
{
check: ({ adminMode, m, permissionContext, canBypassGroupRestrictions }) => Boolean(adminMode && m.isGroup && !permissionContext.isAdmin && !canBypassGroupRestrictions),
fail: async () => true,
},

{
condition: ({ plugin }) => plugin.botProfileOwner,
check: ({ sender, conn, permissionContext, isBotSelf }) => !isBotSelf && !canManageBotProfile(sender, conn, permissionContext),
fail: async ({ conn, m }) => { conn.reply(m.chat, '🥀 Solo el creador del Sub-Bot, el número del Sub-Bot o el Owner Global puede editar este perfil.', m); return false },
},
{
condition: ({ plugin, canBypassGroupRestrictions }) => !canBypassGroupRestrictions && plugin.botAdmin,
check: ({ permissionContext }) => !permissionContext.isBotAdmin,
fail: async ({ fail, m, conn }) => { fail('botAdmin', m, conn); return false },
},
{
condition: ({ plugin }) => plugin.rowner,
check: ({ permissionContext, isBotSelf }) => !permissionContext.isROwner && !isBotSelf,
fail: async ({ fail, m, conn }) => { fail('rowner', m, conn); return false },
},
{
condition: ({ plugin }) => plugin.owner,
check: ({ permissionContext, isBotSelf }) => !permissionContext.isOwner && !isBotSelf,
fail: async ({ fail, m, conn }) => { fail('owner', m, conn); return false },
},
{
condition: ({ plugin }) => plugin.mods,
check: ({ permissionContext, isBotSelf }) => !permissionContext.isMods && !isBotSelf,
fail: async ({ fail, m, conn }) => { fail('mods', m, conn); return false },
},
{
condition: ({ plugin, canBypassGroupRestrictions }) => !canBypassGroupRestrictions && plugin.premium,
check: ({ permissionContext }) => !permissionContext.isPrems,
fail: async ({ fail, m, conn }) => { fail('premium', m, conn); return false },
},
{
condition: ({ plugin, canBypassGroupRestrictions }) => !canBypassGroupRestrictions && plugin.admin,
check: ({ permissionContext }) => !permissionContext.isAdmin,
fail: async ({ fail, m, conn }) => { fail('admin', m, conn); return false },
},
{
condition: ({ plugin, isBotSelf }) => !isBotSelf && plugin.private,
check: ({ m }) => m.isGroup,
fail: async ({ fail, m, conn }) => { fail('private', m, conn); return false },
},
{
condition: ({ plugin, isBotSelf }) => !isBotSelf && plugin.group,
check: ({ m }) => !m.isGroup,
fail: async ({ fail, m, conn }) => { fail('group', m, conn); return false },
},

{
condition: ({ plugin, name, extra }) => pluginNeedsJob(plugin, name, extra.command) && !isJailWhitelistedCommand(extra.command),
check: ({ user }) => Number(user?.extras?.jailUntil || 0) > Date.now(),
fail: async ({ conn, m, user }) => {
const remainingMs = Math.max(0, Number(user?.extras?.jailUntil || 0) - Date.now())
const minutes = Math.floor(remainingMs / 60000)
const seconds = Math.ceil((remainingMs % 60000) / 1000)
conn.reply(m.chat, `🚔 Estás en la cárcel. Te faltan *${minutes}m ${seconds}s* para usar comandos de economía.
💰 Puedes pagar tu salida con *#fianza*.`, m)
return false
},
},
{
condition: ({ plugin, name, extra }) => pluginNeedsJob(plugin, name, extra.command),
check: ({ user }) => !userHasJob(user),
fail: async ({ conn, m, extra }) => { conn.reply(m.chat, `💼 Primero debes elegir una chamba. Usa *${extra.usedPrefix}trabajo lista* y luego *${extra.usedPrefix}trabajo elegir <trabajo>* para desbloquear la economía RPG.`, m); return false },
},
{
condition: ({ plugin, isBotSelf }) => !isBotSelf && plugin.level,
check: ({ plugin, user }) => plugin.level > (user?.level || 0),
fail: async ({ conn, m, plugin, user, extra }) => { conn.reply(m.chat, `❮✦❯ Se requiere el nivel: *${plugin.level}*\n\n• Tu nivel actual es: *${user?.level || 0}*\n\n• Usa este comando para subir de nivel:\n*${extra.usedPrefix}levelup*`, m); return false },
},
]

export async function runPluginGuards(context) {
for (const guard of PLUGIN_GUARDS) {
if (guard.condition && !guard.condition(context)) continue
if (!guard.check(context)) continue
return { blocked: true, result: await guard.fail(context) }
}
return { blocked: false, result: null }
}
