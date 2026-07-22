import test from 'node:test'
import assert from 'node:assert/strict'
import { fbdl, igdl } from '../src/library/scrapers.js'

const originalFetch = globalThis.fetch

test.afterEach(() => { globalThis.fetch = originalFetch })

test('Instagram scraper returns valid media URLs from provider JSON', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ status: 'stream', url: 'https://cdn.example.com/ig-video.mp4' }), { status: 200, headers: { 'content-type': 'application/json' } })
  const result = await igdl('https://www.instagram.com/reel/test/')
  assert.equal(result.status, true)
  assert.match(result.data[0].url, /^https:\/\//)
})

test('Facebook scraper returns valid media URLs from provider JSON', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ status: 'stream', url: 'https://cdn.example.com/fb-video.mp4' }), { status: 200, headers: { 'content-type': 'application/json' } })
  const result = await fbdl('https://www.facebook.com/watch/?v=123')
  assert.equal(result.status, true)
  assert.match(result.data[0].url, /^https:\/\//)
})
