import assert from 'node:assert/strict'
import { GACHA_COOLDOWN_COMMANDS, formatRemainingTimeSpanish, getGachaCooldownStatus } from '../src/helpers/gacha-cooldowns.js'
import { getCooldownKey, redis, setRedisWithTTL } from '../src/library/redis.js'

const userId = '5215551234567@s.whatsapp.net'

assert.equal(formatRemainingTimeSpanish(0), 'Ahora.')
assert.equal(formatRemainingTimeSpanish(-1), 'Ahora.')
assert.equal(formatRemainingTimeSpanish(14 * 60 * 1000 + 48 * 1000), '14 minutos 48 segundos')
assert.equal(formatRemainingTimeSpanish(60 * 1000), '1 minuto')
assert.equal(formatRemainingTimeSpanish(1000), '1 segundo')

await setRedisWithTTL(getCooldownKey('rw', userId), '1', 15 * 60, 'NX')
const rollStatus = await getGachaCooldownStatus(GACHA_COOLDOWN_COMMANDS.rollwaifu, userId)
assert.notEqual(rollStatus, 'Ahora.')
assert.match(rollStatus, /14 minutos|15 minutos|\d+ segundos/)
assert.equal(await getGachaCooldownStatus(GACHA_COOLDOWN_COMMANDS.claim, userId), 'Ahora.')

await redis.del(getCooldownKey('rw', userId))
console.log('gacha cooldown helper ok')
