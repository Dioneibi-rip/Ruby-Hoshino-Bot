export async function fileTypeFromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return undefined
  const h = buffer.subarray(0, 16)
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' }
  if (h.slice(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return { ext: 'png', mime: 'image/png' }
  if (h.slice(0, 6).toString() === 'GIF87a' || h.slice(0, 6).toString() === 'GIF89a') return { ext: 'gif', mime: 'image/gif' }
  if (h.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return { ext: 'webp', mime: 'image/webp' }
  if (buffer.slice(4, 8).toString() === 'ftyp') return { ext: 'mp4', mime: 'video/mp4' }
  if (h.slice(0, 4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))) return { ext: 'webm', mime: 'video/webm' }
  if (h.slice(0, 3).toString() === 'ID3' || (h[0] === 0xff && (h[1] & 0xe0) === 0xe0)) return { ext: 'mp3', mime: 'audio/mpeg' }
  if (h.slice(0, 4).toString() === 'OggS') return { ext: 'ogg', mime: 'audio/ogg' }
  if (h.slice(0, 4).toString() === 'MThd') return { ext: 'mid', mime: 'audio/midi' }
  return undefined
}
export default fileTypeFromBuffer
