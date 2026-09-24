export function cn(...args) {
  return args.filter(Boolean).join(' ')
}

export function fmtUSD(n) {
  return '$' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2)
}

export function fmtDate(s) {
  if (!s) return ''
  try {
    return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(s))
  } catch {
    return s
  }
}

export function roundCents(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}
