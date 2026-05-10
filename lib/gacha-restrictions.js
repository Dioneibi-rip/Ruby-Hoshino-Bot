const EXCLUSIVE_CHARACTER_OWNERS = {
  '35': '18294868853@s.whatsapp.net',
  '770': '525552183656@s.whatsapp.net'
}

function normalizeUserJid(userId = '') {
  return String(userId || '').trim().toLowerCase()
}

export function getExclusiveOwner(characterId) {
  const key = String(characterId || '').trim()
  return EXCLUSIVE_CHARACTER_OWNERS[key] || null
}

export function canUserClaimCharacter(characterId, userId) {
  const ownerJid = getExclusiveOwner(characterId)
  if (!ownerJid) {
    return { allowed: true, ownerJid: null }
  }

  const allowed = normalizeUserJid(ownerJid) === normalizeUserJid(userId)
  return {
    allowed,
    ownerJid,
    reason: allowed ? '' : 'exclusive-owner'
  }
}
