const eur0 = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const eur2 = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const num0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })

/** Currency without cents, e.g. "319.000 €". */
export function euro(value: number): string {
  const v = Math.round(value)
  return eur0.format(v === 0 ? 0 : v) // normalisiert -0 → 0
}

/** Currency with cents, e.g. "1.284,52 €". */
export function euroCents(value: number): string {
  return eur2.format(value)
}

/** Compact currency for big numbers, e.g. "1,2 Mio. €". */
export function euroShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio. €`
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 })}k €`
  return euro(value)
}

export function num(value: number): string {
  return num0.format(value)
}

export function pct(value: number, digits = 1): string {
  return `${value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`
}

export function area(value: number): string {
  return `${num(value)} m²`
}

/** Format an in-game month index (0 = start) into a readable date. */
export function gameDate(monthIndex: number, startYear = 2026): string {
  const months = [
    'Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni',
    'Juli', 'Aug', 'Sept', 'Okt', 'Nov', 'Dez',
  ]
  const year = startYear + Math.floor(monthIndex / 12)
  const m = ((monthIndex % 12) + 12) % 12
  return `${months[m]} ${year}`
}
