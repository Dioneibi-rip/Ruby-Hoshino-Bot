import { readdirSync, existsSync, readFileSync, watch } from 'fs'
import { join, resolve } from 'path'
import { format } from 'util'
import syntaxerror from 'syntax-error'
import importFile from './import.js'
import Helper from './helper.js'
import { rebuildCommandsMap, rebuildPluginHooks, registerPluginCommands, registerPluginHooks, unregisterPluginCommands, unregisterPluginHooks } from '../src/core/handler-utils.js'

const __dirname = Helper.__dirname(import.meta)
const pluginFolder = Helper.__dirname(join(__dirname, '../plugins/index'))
const pluginFilter = filename => /\.(mc)?js$/.test(filename)

function getPluginFiles(folder, base = folder) {
return readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => (b.name === 'enable') - (a.name === 'enable')).flatMap((entry) => {
const fullPath = join(folder, entry.name)
const relativePath = fullPath.slice(base.length + 1).replace(/\\/g, '/')
if (entry.isDirectory()) return getPluginFiles(fullPath, base)
return pluginFilter(entry.name) ? [relativePath] : []
})
}


let watcher, plugins, pluginFolders = []
watcher = plugins = {}

async function filesInit(pluginFolder = pluginFolder, pluginFilter = pluginFilter, conn) {
    const folder = resolve(pluginFolder)
    if (folder in watcher) return
    pluginFolders.push(folder)

    await Promise.all(getPluginFiles(folder).filter(pluginFilter).map(async filename => {
        try {
            let file = global.__filename(join(folder, filename))
            const module = await import(file)
            if (module) {
plugins[filename] = 'default' in module ? module.default : module
registerPluginCommands(filename, plugins[filename])
registerPluginHooks(filename, plugins[filename])
}
        } catch (e) {
            conn?.logger.error(e)
            delete plugins[filename]
unregisterPluginCommands(filename)
unregisterPluginHooks(filename)
        }
    }))

    const watching = watch(folder, reload.bind(null, conn, folder, pluginFilter))
    watching.on('close', () => deletePluginFolder(folder, true))
    watcher[folder] = watching

    rebuildCommandsMap(plugins)
rebuildPluginHooks(plugins)
return plugins
}

function deletePluginFolder(folder, isAlreadyClosed = false) {
    const resolved = resolve(folder)
    if (!(resolved in watcher)) return
    if (!isAlreadyClosed) watcher[resolved].close()
    delete watcher[resolved]
    pluginFolders.splice(pluginFolders.indexOf(resolved), 1)
}

async function reload(conn, pluginFolder = pluginFolder, pluginFilter = pluginFilter, _ev, filename) {
    if (pluginFilter(filename)) {
        let dir = global.__filename(join(pluginFolder, filename), true)
        if (filename in plugins) {
            if (existsSync(dir)) conn.logger.info(` updated plugin - '${filename}'`)
            else {
                conn?.logger.warn(`deleted plugin - '${filename}'`)
                delete plugins[filename]
unregisterPluginCommands(filename)
unregisterPluginHooks(filename)
return
            }
        } else conn?.logger.info(`new plugin - '${filename}'`)
let err = syntaxerror(readFileSync(dir), filename, {
sourceType: 'module',
allowAwaitOutsideFunction: true
})
if (err) {
conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`)
delete plugins[filename]
unregisterPluginCommands(filename)
unregisterPluginHooks(filename)
} else try {
const module = await importFile(global.__filename(dir))
if (module) {
plugins[filename] = module
registerPluginCommands(filename, plugins[filename])
registerPluginHooks(filename, plugins[filename])
}
} catch (e) {
conn?.logger.error(`error require plugin '${filename}\n${format(e)}'`)
delete plugins[filename]
unregisterPluginCommands(filename)
unregisterPluginHooks(filename)
} finally {
plugins = Object.fromEntries(Object.entries(plugins).sort(([a], [b]) => (b.startsWith('enable/') - a.startsWith('enable/')) || a.localeCompare(b)))
rebuildCommandsMap(plugins)
rebuildPluginHooks(plugins)
}
    }
}

export { pluginFolder, pluginFilter, plugins, watcher, pluginFolders, filesInit, deletePluginFolder, reload }