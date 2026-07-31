export function getBaileysExport(baileys, name) {
return baileys?.[name] || baileys?.default?.[name] || baileys?.['module.exports']?.[name]
}

export function getSignalKeyStore(baileys, keys, logger) {
const makeCacheableSignalKeyStore = getBaileysExport(baileys, 'makeCacheableSignalKeyStore')
return typeof makeCacheableSignalKeyStore === 'function' ? makeCacheableSignalKeyStore(keys, logger) : keys
}

export function getBaileysProto(baileys) {
return getBaileysExport(baileys, 'proto')
}
