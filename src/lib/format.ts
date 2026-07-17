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

const MONATE = [
  'Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni',
  'Juli', 'Aug', 'Sept', 'Okt', 'Nov', 'Dez',
]

/** Format an in-game month index (0 = start) into a readable date. */
export function gameDate(monthIndex: number, startYear = 2026): string {
  const mi = Math.floor(monthIndex)
  const year = startYear + Math.floor(mi / 12)
  const m = ((mi % 12) + 12) % 12
  return `${MONATE[m]} ${year}`
}

/** Tag-des-Monats aus dem (fraktionalen) Monatsindex — 4 Echt-Stunden = 1 Monat. */
export function gameTag(monthIndex: number, startYear = 2026): number {
  const mi = Math.floor(monthIndex)
  const year = startYear + Math.floor(mi / 12)
  const m = ((mi % 12) + 12) % 12
  const tageImMonat = new Date(year, m + 1, 0).getDate()
  const frac = Math.min(0.99999, Math.max(0, monthIndex - mi))
  return Math.floor(frac * tageImMonat) + 1
}

/** Volles Datum inkl. Tag, z. B. "17. Jan 2026". */
export function gameDatum(monthIndex: number, startYear = 2026): string {
  return `${gameTag(monthIndex, startYear)}. ${gameDate(monthIndex, startYear)}`
}

/** Format a real-time duration (ms) as a compact countdown, e.g. "2:05 min" or "1h 12m". */
export function dauer(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  if (s < 60) return `${s}s`
  const min = Math.floor(s / 60)
  const rest = s % 60
  if (min < 60) return `${min}:${String(rest).padStart(2, '0')} min`
  const h = Math.floor(min / 60)
  return `${h}h ${min % 60}m`
}
