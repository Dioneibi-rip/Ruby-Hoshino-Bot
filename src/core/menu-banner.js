import { getBotProfile } from './botProfileStore.js'

const aliases = new Map([
['menuanime', 'anime'],
['menubusquedas', 'busquedas'],
['menudescargas', 'descargas'],
['menueconomia', 'economia'],
['menueconomia+rpg', 'economia'],
['menugacha', 'gacha'],
['menugrupo', 'grupos'],
['menugrupos', 'grupos'],
['menuherramientas', 'herramientas'],
['menuia', 'ia'],
['menujadibot', 'jadibot'],
['menujuegos', 'juegos'],
['menunsfw', 'nsfw'],
['menuowner', 'admin'],
['menuperfil', 'perfil'],
['menusticker', 'stickers'],
['menustickers', 'stickers']
])

export function normalizeMenuCategory(value = '') {
const key = String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9+_-]/g, '')
return aliases.get(key) || key
}

export function getMenuBanner(profile = {}, category = '', nativeBanner = '') {
let banners = {}
try {
const meta = profile?.meta && typeof profile.meta === 'object' ? profile.meta : {}
banners = meta.category_banners && typeof meta.category_banners === 'object' ? meta.category_banners : {}
} catch {
banners = {}
}
const key = normalizeMenuCategory(category)
return banners[key] || banners.global || profile?.individualMenuImageUrl || profile?.menuImageUrl || nativeBanner
}

export async function getActiveBotProfile(conn) {
try {
return conn?.botProfile || await getBotProfile(conn?.session?.id || conn?.user?.jid || 'primary')
} catch {
return conn?.botProfile || getBotProfile('primary')
}
}
