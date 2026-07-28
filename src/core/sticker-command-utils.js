export function getPersonalStickerCommand(record, sender = '') {
if (!record || typeof record !== 'object' || !sender) return null
const personal = record.users?.[sender]
if (personal && typeof personal === 'object' && personal.creator === sender && typeof personal.text === 'string') return personal
return null
}

export function setPersonalStickerCommand(stickers = {}, hash = '', sender = '', value = {}) {
if (!hash || !sender) return stickers
const current = stickers[hash]
const users = current?.users && typeof current.users === 'object' ? { ...current.users } : {}
users[sender] = { ...value, creator: sender }
stickers[hash] = { users }
return stickers
}

export function deletePersonalStickerCommand(stickers = {}, hash = '', sender = '') {
const current = stickers[hash]
if (!current || !sender) return false
if (current.users && typeof current.users === 'object') {
if (!current.users[sender]) return false
delete current.users[sender]
if (!Object.keys(current.users).length) delete stickers[hash]
return true
}
return false
}
