import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters.json'
const CACHE_TTL_MS = 30 * 1000

let cache = {
  data: null,
  loadedAt: 0
}

function normalizeCharacterId(id) {
  return String(id ?? '').trim()
}

function normalizeText(text = '') {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(text = '') {
  const normalized = normalizeText(text)
  return normalized ? normalized.split(' ') : []
}

function uniqueTokens(tokens = []) {
  return [...new Set((Array.isArray(tokens) ? tokens : []).filter(Boolean))]
}

function levenshtein(a = '', b = '') {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const prev = new Array(b.length + 1).fill(0)
  const curr = new Array(b.length + 1).fill(0)
  for (let j = 0; j <= b.length; j++) prev[j] = j

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      )
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }

  return prev[b.length]
}

function getCharacterSearchPhrases(character = {}) {
  const rawPhrases = [character.name]
  if (Array.isArray(character.aliases)) rawPhrases.push(...character.aliases)
  return rawPhrases
    .map(value => normalizeText(value))
    .filter(Boolean)
}

function calculatePhraseScore(query, phrase) {
  if (!query || !phrase) return 0
  if (query === phrase) return 1

  let score = 0
  if (phrase.includes(query)) score = Math.max(score, 0.96)
  if (query.includes(phrase) && phrase.length > 2) score = Math.max(score, 0.92)

  const qTokens = tokenize(query)
  const pTokens = tokenize(phrase)
  if (qTokens.length && pTokens.length) {
    const uniqueQ = uniqueTokens(qTokens)
    const uniqueP = uniqueTokens(pTokens)
    const common = uniqueQ.filter(t => uniqueP.includes(t)).length

    const recall = common / Math.max(uniqueQ.length, 1)
    const precision = common / Math.max(uniqueP.length, 1)
    const f1 = (recall + precision) ? (2 * recall * precision) / (recall + precision) : 0

    score = Math.max(score, f1)

    const allTokensMatch = uniqueQ.every(token => uniqueP.includes(token))
    if (allTokensMatch) {
      const extraTokens = Math.max(uniqueP.length - uniqueQ.length, 0)
      const coverageScore = Math.max(0.7, 0.97 - (extraTokens * 0.08))
      score = Math.max(score, coverageScore)
    }
  }

  const distance = levenshtein(query, phrase)
  const maxLen = Math.max(query.length, phrase.length, 1)
  const levScore = 1 - distance / maxLen
  score = Math.max(score, levScore)

  return score
}

function normalizeCharacter(character) {
  if (!character || typeof character !== 'object') return character
  return {
    ...character,
    id: normalizeCharacterId(character.id),
    img: Array.isArray(character.img) ? character.img.filter(Boolean) : []
  }
}

async function loadCharacters({ force = false } = {}) {
  const now = Date.now()
  if (!force && cache.data && (now - cache.loadedAt) < CACHE_TTL_MS) {
    return cache.data
  }

  const raw = await fs.readFile(charactersFilePath, 'utf-8')
  const parsed = JSON.parse(raw)
  const normalized = Array.isArray(parsed) ? parsed.map(normalizeCharacter) : []

  cache = {
    data: normalized,
    loadedAt: now
  }

  return normalized
}

async function saveCharacters(characters) {
  const normalized = (Array.isArray(characters) ? characters : []).map(normalizeCharacter)
  await fs.writeFile(charactersFilePath, JSON.stringify(normalized, null, 2), 'utf-8')
  cache = {
    data: normalized,
    loadedAt: Date.now()
  }
}

function findCharacterById(characters, id) {
  const key = normalizeCharacterId(id)
  return characters.find(c => normalizeCharacterId(c.id) === key) || null
}

function findCharacterByName(characters, name) {
  const query = normalizeText(name)
  if (!query) return null

  let best = null
  let bestScore = 0

  for (const character of (Array.isArray(characters) ? characters : [])) {
    const phrases = getCharacterSearchPhrases(character)
    let localBest = 0
    for (const phrase of phrases) {
      localBest = Math.max(localBest, calculatePhraseScore(query, phrase))
      if (localBest >= 0.999) break
    }

    if (localBest > bestScore) {
      best = character
      bestScore = localBest
    }
  }

  return bestScore >= 0.58 ? best : null
}

function extractCharacterIdFromText(text = '') {
  if (!text) return null

  const patterns = [
    /🅸🅳\s*[:：]\s*([0-9]+)/i,
    /\bID\s*[:：#-]?\s*([0-9]+)/i,
    /\*([0-9]{1,6})\*/
  ]

  for (const pattern of patterns) {
    const match = String(text).match(pattern)
    if (match?.[1]) return normalizeCharacterId(match[1])
  }

  return null
}

export {
  loadCharacters,
  saveCharacters,
  normalizeCharacterId,
  findCharacterById,
  findCharacterByName,
  extractCharacterIdFromText
}
