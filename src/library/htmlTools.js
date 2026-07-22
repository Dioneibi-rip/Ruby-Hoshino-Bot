export const stripTags = html => String(html || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
export const decodeHtml = text => String(text || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
export function matchAll(html, regex) { return [...String(html || '').matchAll(regex)] }
export function attr(tag, name) { return decodeHtml(String(tag || '').match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))?.[1] || '') }

function select(source, selector) {
  const meta = selector.match(/^meta\[(property|name)=["']([^"']+)["']\]$/i)
  if (meta) return [...source.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]).filter(tag => attr(tag, meta[1]) === meta[2])
  const tag = selector.match(/^[a-z][\w-]*$/i)?.[0]
  if (tag) return [...source.matchAll(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'))].map(m => m[0])
  return []
}

function collection(nodes) {
  return {
    length: nodes.length,
    text: () => stripTags(nodes.join(' ')),
    html: () => nodes.join(''),
    attr: name => attr(nodes[0], name) || undefined,
    each(fn) { nodes.forEach((node, index) => fn.call(node, index, node)); return this },
    map(fn) { const mapped = nodes.map((node, index) => fn.call(node, index, node)); return { get: () => mapped } },
    get: index => index == null ? nodes : nodes[index]
  }
}

export function load(html) {
  const source = String(html || '')
  const api = selector => collection(typeof selector === 'string' && selector.startsWith('<') ? [selector] : select(source, String(selector || '')))
  api.html = () => source
  api.text = () => stripTags(source)
  return api
}
export default { load }
