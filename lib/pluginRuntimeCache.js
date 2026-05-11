const REGEX_SPECIAL_CHARS = /[|\\{}()[\]^$+*?.]/g

let cachedPluginRefs = new Map()
let cachedPluginCount = -1
let cachedRuntime = null

const escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS, '\\$&')

function asArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function isCacheValid(entries) {
  if (!cachedRuntime || entries.length !== cachedPluginCount) return false
  for (const [name, plugin] of entries) {
    if (cachedPluginRefs.get(name) !== plugin) return false
  }
  return true
}

function hasNonStringCommand(plugin) {
  return asArray(plugin?.command).some((cmd) => typeof cmd !== 'string')
}

export function getPluginRuntimeCache(plugins = {}) {
  const entries = Object.entries(plugins)
  if (isCacheValid(entries)) return cachedRuntime

  const all = []
  const before = []
  const commandMap = new Map()
  const dynamicCommands = []
  const refs = new Map()

  entries.forEach(([name, plugin], order) => {
    refs.set(name, plugin)
    if (!plugin) return

    const entry = { name, plugin, order }
    if (typeof plugin.all === 'function') all.push(entry)
    if (typeof plugin.before === 'function') before.push(entry)

    if (typeof plugin === 'function' && plugin.command) {
      const commands = asArray(plugin.command)
      const usesDynamicPrefix = Boolean(plugin.customPrefix)
      let hasStringCommand = false

      for (const command of commands) {
        if (typeof command !== 'string') continue
        hasStringCommand = true
        const key = command.toLowerCase()
        const list = commandMap.get(key) || []
        list.push(entry)
        commandMap.set(key, list)
      }

      if (usesDynamicPrefix || hasNonStringCommand(plugin) || !hasStringCommand) {
        dynamicCommands.push(entry)
      }
    }
  })

  cachedPluginRefs = refs
  cachedPluginCount = entries.length
  cachedRuntime = { all, before, commandMap, dynamicCommands }
  return cachedRuntime
}

export function getPrefixMatches(prefix, text = '') {
  if (prefix instanceof RegExp) return [[prefix.exec(text), prefix]]
  if (Array.isArray(prefix)) {
    return prefix.map((item) => {
      const regex = item instanceof RegExp ? item : new RegExp(escapeRegex(String(item)))
      return [regex.exec(text), regex]
    })
  }
  if (typeof prefix === 'string') {
    const regex = new RegExp(escapeRegex(prefix))
    return [[regex.exec(text), regex]]
  }
  return [[[], new RegExp()]]
}

export function getPrefixMatch(prefix, text = '') {
  return getPrefixMatches(prefix, text).find((item) => item[1])
}

export function getCommandFromText(text = '', prefixMatch) {
  const usedPrefix = (prefixMatch?.[0] || '')[0]
  if (!usedPrefix || ['>', '=>', '$'].includes(usedPrefix)) return null
  const noPrefix = text.replace(usedPrefix, '')
  const [rawCommand, ...args] = noPrefix.trim().split` `.filter(Boolean)
  const command = (rawCommand || '').toLowerCase()
  if (!command || !/^[a-z0-9][\w-]*$/i.test(command)) return null
  return { usedPrefix, noPrefix, command, args, _args: noPrefix.trim().split` `.slice(1), text: args.join` ` }
}

export function commandMatches(commandConfig, command) {
  if (!command) return false
  if (commandConfig instanceof RegExp) return commandConfig.test(command)
  if (Array.isArray(commandConfig)) {
    return commandConfig.some((cmd) => cmd instanceof RegExp ? cmd.test(command) : cmd === command)
  }
  return typeof commandConfig === 'string' ? commandConfig === command : false
}
