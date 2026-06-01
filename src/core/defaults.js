export const userDefault = Object.freeze({
  exp: 0,
  coin: 10,
  joincount: 1,
  diamond: 3,
  lastadventure: 0,
  health: 100,
  lastclaim: 0,
  lastcofre: 0,
  lastdiamantes: 0,
  lastcode: 0,
  lastduel: 0,
  lastpago: 0,
  lastmining: 0,
  lastcodereg: 0,
  muto: false,
  premium: false,
  premiumTime: 0,
  registered: false,
  genre: '',
  birth: '',
  marry: '',
  description: '',
  packstickers: null,
  name: '',
  age: -1,
  regTime: -1,
  afk: -1,
  afkReason: '',
  role: 'Nuv',
  banned: false,
  useDocument: false,
  level: 0,
  bank: 0,
  warn: 0,
  crime: 0,
  Subs: 0,
})

export const chatDefault = Object.freeze({
  sAutoresponder: '',
  welcome: true,
  isBanned: false,
  autolevelup: false,
  autoresponder: false,
  delete: false,
  autoAceptar: false,
  autoRechazar: false,
  detect: true,
  antiBot: false,
  antiBot2: false,
  modoadmin: false,
  antiLink: true,
  antifake: false,
  antiArabe: false,
  reaction: false,
  nsw: false,
  expired: 0,
  welcomeText: null,
  byeText: null,
  audios: false,
  botPrimario: null,
  primaryBot: null,
  bannedBots: [],
  antiImg: false,
  nsfw: false,
})

export const settingsDefault = Object.freeze({
  self: false,
  restrict: true,
  jadibotmd: true,
  antiPrivate: false,
  moneda: 'Coins',
  autoread: false,
  status: 0,
})

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

export function ensureRecord(container, key, defaults, patches = {}) {
  if (!container || !key) return {}
  if (!container[key] || typeof container[key] !== 'object') container[key] = {}
  const record = container[key]
  for (const [field, defaultValue] of Object.entries(defaults)) {
    const value = field in patches ? patches[field] : defaultValue
    if (value === null) continue
    if (typeof record[field] === 'undefined') {
      record[field] = value
    } else if (typeof value === 'number' && !isNumber(record[field])) {
      record[field] = value
    } else if (Array.isArray(value) && !Array.isArray(record[field])) {
      record[field] = [...value]
    }
  }
  return record
}

export function ensureDatabaseShape(db = global.db) {
  if (!db.data || typeof db.data !== 'object') db.data = {}
  db.data.users ||= {}
  db.data.chats ||= {}
  db.data.stats ||= {}
  db.data.msgs ||= {}
  db.data.sticker ||= {}
  db.data.settings ||= {}
  db.data.sessions ||= {}
  return db.data
}
