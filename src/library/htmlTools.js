export const stripTags = html => decodeHtml(String(html || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
export const decodeHtml = text => String(text || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
export function matchAll(html, regex) { return [...String(html || '').matchAll(regex)] }
export function attr(tag, name) { return decodeHtml(String(tag || '').match(new RegExp(`\\s${name}=["']([^"']*)["']`, 'i'))?.[1] || '') }

function splitSelector(selector = '') { return String(selector).split(',').map(s => s.trim()).filter(Boolean) }
function getClasses(tag = '') { return (attr(tag, 'class') || '').split(/\s+/).filter(Boolean) }
function tagName(node = '') { return String(node).match(/^<\s*([a-z][\w-]*)/i)?.[1]?.toLowerCase() || '' }
function matchesSimple(node, selector) {
  selector = String(selector || '').trim()
  if (!selector) return false
  const nth = selector.match(/^([\w-]+)\s*:\s*nth-child\((\d+)\)$/i)
  if (nth) selector = nth[1]
  const meta = selector.match(/^meta\[(property|name)=["']([^"']+)["']\]$/i)
  if (meta) return tagName(node) === 'meta' && attr(node, meta[1]) === meta[2]
  const id = selector.match(/^#([\w-]+)$/)
  if (id) return attr(node, 'id') === id[1]
  const cls = selector.match(/^\.([\w-]+)$/)
  if (cls) return getClasses(node).includes(cls[1])
  const tagCls = selector.match(/^([a-z][\w-]*)\.([\w-]+)$/i)
  if (tagCls) return tagName(node) === tagCls[1].toLowerCase() && getClasses(node).includes(tagCls[2])
  const attrSel = selector.match(/^([a-z][\w-]*)?\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]$/i)
  if (attrSel) return (!attrSel[1] || tagName(node) === attrSel[1].toLowerCase()) && (attrSel[3] == null ? Boolean(attr(node, attrSel[2])) : attr(node, attrSel[2]) === attrSel[3])
  return tagName(node) === selector.toLowerCase()
}
function allTags(source) {
  source = String(source || '')
  const names = [...new Set([...source.matchAll(/<([a-z][\w-]*)\b[^>]*\/?>/gi)].map(m => m[1].toLowerCase()))]
  const nodes = []
  for (const name of names) {
    const paired = new RegExp(`<${name}\\b[^>]*>[\\s\\S]*?<\\/${name}>`, 'gi')
    nodes.push(...[...source.matchAll(paired)].map(m => m[0]))
    const single = new RegExp(`<${name}\\b[^>]*\\/?>`, 'gi')
    nodes.push(...[...source.matchAll(single)].map(m => m[0]))
  }
  return [...new Set(nodes)]
}
function select(source, selector) {
  let current = [String(source || '')]
  const parts = String(selector || '').replace(/>/g, ' ').split(/\s+/).filter(Boolean)
  for (const part of parts) current = current.flatMap(scope => allTags(scope).filter(node => matchesSimple(node, part)))
  return current
}
function innerHtml(node = '') {
  const text = String(node || '')
  const openEnd = text.indexOf('>')
  const closeStart = text.lastIndexOf('</')
  return openEnd !== -1 && closeStart > openEnd ? text.slice(openEnd + 1, closeStart) : text
}
function collection(nodes) {
  nodes = nodes.filter(Boolean)
  const api = {
    length: nodes.length,
    text: () => stripTags(nodes.join(' ')),
    html: () => innerHtml(nodes[0] || ''),
    attr: name => attr(nodes[0], name) || undefined,
    first: () => collection(nodes.slice(0, 1)),
    eq: index => collection(nodes.slice(index, index + 1)),
    find: selector => collection(nodes.flatMap(node => splitSelector(selector).flatMap(sel => select(node, sel)))),
    filter(fn) { return collection(nodes.filter((node, index) => fn.call(node, index, node))) },
    each(fn) { nodes.forEach((node, index) => fn.call(node, index, node)); return this },
    map(fn) { const mapped = nodes.map((node, index) => fn.call(node, index, node)); return { get: () => mapped, toArray: () => mapped } },
    get: index => index == null ? nodes : nodes[index],
    toArray: () => nodes
  }
  return api
}
export function load(html) {
  const source = String(html || '')
  const api = selector => {
    if (typeof selector !== 'string') return collection([String(selector || '')])
    if (selector.startsWith('<')) return collection([selector])
    return collection(splitSelector(selector).flatMap(sel => select(source, sel)))
  }
  api.html = () => source
  api.text = () => stripTags(source)
  return api
}
export default { load }
