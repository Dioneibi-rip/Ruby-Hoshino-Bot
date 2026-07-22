export const stripTags = html => String(html || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
export const decodeHtml = text => String(text || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
export function matchAll(html, regex) { return [...String(html || '').matchAll(regex)] }
export function attr(tag, name) { return decodeHtml(String(tag || '').match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))?.[1] || '') }
export function load(html) {
  const source = String(html || '')
  const api = selector => {
    const nodes = selector === 'html' ? [source] : []
    return { length: nodes.length, text: () => stripTags(nodes.join(' ')), attr: () => undefined, map: () => ({ get: () => [] }), get: () => nodes }
  }
  api.html = () => source
  api.text = () => stripTags(source)
  return api
}
export default { load }
