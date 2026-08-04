import fs from 'fs'
import path from 'path'
import { prepareWAMessageMedia } from '@whiskeysockets/baileys'
import { getActiveBotProfile, getMenuBanner, normalizeMenuCategory } from './menu-banner.js'

export const defaultMenuImagePath = path.join(process.cwd(), 'src', 'catalogo.jpg')

export function resolveMenuMediaSource(profile = {}, category = '') {
const key = normalizeMenuCategory(category)
const categoryBanner = getMenuBanner(profile, key, '')
if (categoryBanner) return categoryBanner
if (!key || key === 'global' || key === 'menu') return profile?.menuImageUrl || profile?.meta?.category_banners?.global || defaultMenuImagePath
return profile?.meta?.category_banners?.global || profile?.individualMenuImageUrl || profile?.menuImageUrl || defaultMenuImagePath
}

function isVideoSource(source = '') {
return /\.(mp4|mov|m4v|webm)(?:[?#].*)?$/i.test(String(source || ''))
}

function toMediaValue(source) {
if (Buffer.isBuffer(source)) return source
const value = String(source || defaultMenuImagePath)
if (/^https?:\/\//i.test(value)) return { url: value }
return fs.existsSync(value) ? fs.readFileSync(value) : fs.readFileSync(defaultMenuImagePath)
}

export async function getMenuMedia(conn, category = 'global', explicitSource = '') {
const profile = await getActiveBotProfile(conn)
const fallbackSource = resolveMenuMediaSource(profile, category) || defaultMenuImagePath
const source = explicitSource || fallbackSource
try {
const mediaValue = toMediaValue(source)
const message = isVideoSource(source) ? { video: mediaValue } : { image: mediaValue }
return prepareWAMessageMedia(message, { upload: conn.waUploadToServer })
} catch (error) {
const fallbackValue = toMediaValue(fallbackSource || defaultMenuImagePath)
const fallbackMessage = isVideoSource(fallbackSource) ? { video: fallbackValue } : { image: fallbackValue }
return prepareWAMessageMedia(fallbackMessage, { upload: conn.waUploadToServer })
}
}
