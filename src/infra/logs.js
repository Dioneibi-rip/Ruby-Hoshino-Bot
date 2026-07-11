let stdouts = []
let oldWrite = null

export function logs() {
  return Buffer.concat(stdouts)
}
logs.isModified = false

export function disable() {
  logs.isModified = false
  if (oldWrite) process.stdout.write = oldWrite
  return process.stdout.write
}

export default function captureLogs(maxLength = 200) {
  if (!oldWrite) oldWrite = process.stdout.write.bind(process.stdout)
  process.stdout.write = (chunk, encoding, callback) => {
    stdouts.push(Buffer.from(chunk, encoding))
    oldWrite(chunk, encoding, callback)
    if (stdouts.length > maxLength) stdouts.shift()
  }
  logs.isModified = true
  return logs
}
