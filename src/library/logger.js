const noop = () => {}
export default function pino() {
  const logger = { level: 'silent', trace: noop, debug: noop, info: noop, warn: noop, error: noop, fatal: noop }
  logger.child = () => logger
  return logger
}
