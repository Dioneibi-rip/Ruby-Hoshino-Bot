import { getSubbotLimit, getSubbotLimitBounds, setSubbotLimit } from '../core/subbot-store.js'

export function readSubbotLimit() {
return getSubbotLimit()
}

export function updateSubbotLimit(value) {
const limit = Number(value)
if (!Number.isInteger(limit)) throw new Error('El límite debe ser un número entero positivo')
return setSubbotLimit(limit)
}

export function subbotLimitInfo() {
return { current: getSubbotLimit(), ...getSubbotLimitBounds() }
}
