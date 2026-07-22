import test from 'node:test'
import assert from 'node:assert/strict'
import { getRemainingCooldownMs, millisecondsToSeconds, formatDurationHMS } from '../src/library/time-utils.js'
import { getCooldownSeconds } from '../src/library/redis.js'

test('economy cooldown math uses milliseconds consistently', () => {
  const now = 1_000_000
  assert.equal(getRemainingCooldownMs(now, 3_600_000, now + 1_800_000), 1_800_000)
  assert.equal(getRemainingCooldownMs(now, 3_600_000, now + 3_600_000), 0)
  assert.equal(millisecondsToSeconds(180_000), 180)
  assert.equal(formatDurationHMS(180), '3m 0s')
})

test('plugin cooldown values are converted from milliseconds to Redis TTL seconds', () => {
  assert.equal(getCooldownSeconds({ cooldown: 180_000 }), 180)
  assert.equal(getCooldownSeconds({ cooldown: 3_600_000 }), 3600)
})
