import createSQLiteStore from './sqlite-store.js'
let instance
function getStore() {
if (!instance) instance = createSQLiteStore(global.db?.sqlite)
return instance
}
function bind(conn) {
return getStore().bind(conn)
}
function loadMessage(jid, id = null) {
return getStore().loadMessage(jid, id)
}
function countChats() {
return getStore().countChats()
}
export default { bind, loadMessage, countChats, getStore }
