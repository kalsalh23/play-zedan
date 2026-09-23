export function cn(...args) {
  return args.filter(Boolean).join(' ')
}

export function fmtSYP(n) {
  return new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0)) + ' ل.ر'
}

export function fmtDate(s) {
  if (!s) return ''
  try {
    return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(s))
  } catch {
    return s
  }
}

export function round100(n) {
  return Math.ceil(Number(n) / 100) * 100
}
