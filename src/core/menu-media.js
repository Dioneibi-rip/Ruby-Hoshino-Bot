import fs from 'fs'
import path from 'path'
import { prepareWAMessageMedia } from '@whiskeysockets/baileys'
import { getActiveBotProfile, getMenuBanner, normalizeMenuCategory } from './menu-banner.js'

export const defaultMenuImagePath = path.join(process.cwd(), 'src', 'catalogo.jpg')

export function resolveMenuMediaSource(profile = {}, category = '') {
const key = normalizeMenuCategory(category)
const categoryBanner = getMenuBanner(profile, key, '')
return categoryBanner || profile?.meta?.category_banners?.global || profile?.menuImageUrl || defaultMenuImagePath
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

export async function getMenuMedia(conn, category = 'global') {
const profile = await getActiveBotProfile(conn)
const source = resolveMenuMediaSource(profile, category)
const mediaValue = toMediaValue(source)
const message = isVideoSource(source) ? { video: mediaValue } : { image: mediaValue }
return prepareWAMessageMedia(message, { upload: conn.waUploadToServer })
}
