export default class Redis {
  constructor() { this.store = new Map() }
  async get(k) { return this.store.get(k) ?? null }
  async set(k, v) { this.store.set(k, String(v)); return 'OK' }
  async del(k) { return this.store.delete(k) ? 1 : 0 }
  on() { return this }
  quit() { return Promise.resolve('OK') }
}
