export function getCurrencyName(conn = null) {
return conn?.botProfile?.currencyName || conn?.botProfile?.meta?.currencyName || global.currency || 'RubyCoins'
}
