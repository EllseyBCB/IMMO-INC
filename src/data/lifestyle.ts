// Lebensstandard & Lifestyle-Shop.
// - Der Lebensstandard startet ganz unten und steigt mit dem Vermögen UND mit
//   dem, was man sich im Shop kauft.
// - Sonderausgaben wachsen progressiv mit dem Vermögen (Lifestyle-Creep) plus
//   dem Unterhalt der gekauften Luxusgüter → früh investieren lohnt sich.

export type LuxusKategorie = 'Mobilität' | 'Wohnen' | 'Uhren & Schmuck' | 'Reisen' | 'Freizeit' | 'Tech'

export interface LuxusItem {
  id: string
  name: string
  emoji: string
  kategorie: LuxusKategorie
  preis: number
  /** Lebensstandard-Punkte, die der Kauf dauerhaft bringt. */
  punkte: number
  /** Monatlicher Unterhalt (fließt in die Sonderausgaben). */
  unterhalt: number
  beschreibung: string
}

export const LUXUS_KATALOG: LuxusItem[] = [
  // Mobilität
  { id: 'auto_klein', name: 'Gebrauchter Kleinwagen', emoji: '🚗', kategorie: 'Mobilität', preis: 6_000, punkte: 3, unterhalt: 60, beschreibung: 'Bringt dich zuverlässig von A nach B.' },
  { id: 'auto_kombi', name: 'Mittelklasse-Kombi', emoji: '🚙', kategorie: 'Mobilität', preis: 28_000, punkte: 7, unterhalt: 180, beschreibung: 'Solide, bequem, alltagstauglich.' },
  { id: 'auto_suv', name: 'Premium-SUV', emoji: '🚐', kategorie: 'Mobilität', preis: 65_000, punkte: 14, unterhalt: 420, beschreibung: 'Thront über dem Verkehr.' },
  { id: 'auto_limo', name: 'Luxus-Limousine', emoji: '🚘', kategorie: 'Mobilität', preis: 110_000, punkte: 22, unterhalt: 750, beschreibung: 'Chauffeur-Feeling inklusive.' },
  { id: 'auto_sport', name: 'Sportwagen', emoji: '🏎️', kategorie: 'Mobilität', preis: 140_000, punkte: 26, unterhalt: 900, beschreibung: '0 auf 100 in unter 4 Sekunden.' },
  { id: 'auto_oldtimer', name: 'Oldtimer-Sammlung', emoji: '🚓', kategorie: 'Mobilität', preis: 320_000, punkte: 40, unterhalt: 1_400, beschreibung: 'Rollende Wertanlage mit Stil.' },

  // Wohnen
  { id: 'wohn_einrichtung', name: 'Eigene Einrichtung', emoji: '🛋️', kategorie: 'Wohnen', preis: 4_000, punkte: 3, unterhalt: 20, beschreibung: 'Endlich kein Sperrmüll mehr.' },
  { id: 'wohn_smart', name: 'Smart-Home-Ausbau', emoji: '💡', kategorie: 'Wohnen', preis: 15_000, punkte: 6, unterhalt: 120, beschreibung: 'Licht, Klima, Sicherheit per App.' },
  { id: 'wohn_designer', name: 'Designer-Möbel', emoji: '🪑', kategorie: 'Wohnen', preis: 22_000, punkte: 8, unterhalt: 90, beschreibung: 'Jedes Stück ein Statement.' },
  { id: 'wohn_wein', name: 'Eigener Weinkeller', emoji: '🍷', kategorie: 'Wohnen', preis: 45_000, punkte: 10, unterhalt: 200, beschreibung: 'Grand Cru für besondere Abende.' },
  { id: 'wohn_penthouse', name: 'Penthouse-Ausstattung', emoji: '🏙️', kategorie: 'Wohnen', preis: 90_000, punkte: 18, unterhalt: 500, beschreibung: 'Dachterrasse, Kamin, Skyline.' },

  // Uhren & Schmuck
  { id: 'uhr_auto', name: 'Automatikuhr', emoji: '⌚', kategorie: 'Uhren & Schmuck', preis: 3_500, punkte: 4, unterhalt: 10, beschreibung: 'Der erste Schritt zur Sammlung.' },
  { id: 'uhr_chrono', name: 'Luxus-Chronograph', emoji: '⏱️', kategorie: 'Uhren & Schmuck', preis: 18_000, punkte: 9, unterhalt: 30, beschreibung: 'Schweizer Manufaktur am Handgelenk.' },
  { id: 'uhr_haute', name: 'Haute Horlogerie', emoji: '🕰️', kategorie: 'Uhren & Schmuck', preis: 85_000, punkte: 20, unterhalt: 120, beschreibung: 'Komplikationen, die kaum jemand kennt.' },
  { id: 'schmuck_diamant', name: 'Diamant-Set', emoji: '💎', kategorie: 'Uhren & Schmuck', preis: 150_000, punkte: 28, unterhalt: 200, beschreibung: 'Funkelt in jeder Loge.' },

  // Reisen
  { id: 'reise_city', name: 'Städtetrip', emoji: '🧳', kategorie: 'Reisen', preis: 1_500, punkte: 2, unterhalt: 0, beschreibung: 'Kurz raus, Kopf frei.' },
  { id: 'reise_fern', name: 'Fernreise Luxusklasse', emoji: '🏝️', kategorie: 'Reisen', preis: 12_000, punkte: 6, unterhalt: 0, beschreibung: 'Overwater-Villa, Business-Class.' },
  { id: 'reise_welt', name: 'Weltreise (6 Monate)', emoji: '🌍', kategorie: 'Reisen', preis: 60_000, punkte: 16, unterhalt: 0, beschreibung: 'Einmal um den Globus, ohne Eile.' },
  { id: 'reise_jet', name: 'Privatjet-Anteil', emoji: '🛩️', kategorie: 'Reisen', preis: 400_000, punkte: 45, unterhalt: 3_000, beschreibung: 'Abheben, wann immer du willst.' },

  // Freizeit
  { id: 'frei_bike', name: 'E-Bike / Rennrad', emoji: '🚴', kategorie: 'Freizeit', preis: 5_000, punkte: 3, unterhalt: 20, beschreibung: 'Fit bleiben mit Rückenwind.' },
  { id: 'frei_yacht_segel', name: 'Segelyacht', emoji: '⛵', kategorie: 'Freizeit', preis: 180_000, punkte: 30, unterhalt: 1_600, beschreibung: 'Wochenenden auf dem Wasser.' },
  { id: 'frei_ferienhaus', name: 'Ferienhaus am See', emoji: '🏡', kategorie: 'Freizeit', preis: 350_000, punkte: 38, unterhalt: 900, beschreibung: 'Dein Rückzugsort in der Natur.' },
  { id: 'frei_yacht_motor', name: 'Motoryacht', emoji: '🛥️', kategorie: 'Freizeit', preis: 750_000, punkte: 60, unterhalt: 6_000, beschreibung: 'Schwimmende Villa mit Crew.' },

  // Tech
  { id: 'tech_phone', name: 'Neuestes Smartphone', emoji: '📱', kategorie: 'Tech', preis: 1_400, punkte: 2, unterhalt: 15, beschreibung: 'Immer das aktuellste Modell.' },
  { id: 'tech_setup', name: 'Gaming-/Studio-Setup', emoji: '🎧', kategorie: 'Tech', preis: 6_500, punkte: 3, unterhalt: 20, beschreibung: 'Highend-Rechner und Peripherie.' },
  { id: 'tech_heimkino', name: 'Heimkino', emoji: '🍿', kategorie: 'Tech', preis: 9_000, punkte: 4, unterhalt: 30, beschreibung: 'Großes Kino im eigenen Wohnzimmer.' },
]

export interface Stufe {
  name: string
  emoji: string
  ab: number
}

/** Lebensstandard-Stufen von ganz unten bis nach ganz oben. */
export const LEBENSSTANDARD_STUFEN: Stufe[] = [
  { name: 'Existenzminimum', emoji: '🥫', ab: 0 },
  { name: 'Bescheiden', emoji: '🍜', ab: 5 },
  { name: 'Solide', emoji: '🏠', ab: 12 },
  { name: 'Komfortabel', emoji: '🛋️', ab: 25 },
  { name: 'Gehoben', emoji: '🥂', ab: 45 },
  { name: 'Wohlhabend', emoji: '💼', ab: 75 },
  { name: 'Luxuriös', emoji: '💎', ab: 120 },
  { name: 'High Society', emoji: '👑', ab: 200 },
]

/** Punkte aus dem Vermögen — wächst langsam, damit man am Anfang wirklich unten startet. */
export function wohlstandsPunkte(vermoegen: number): number {
  if (vermoegen <= 0) return 0
  return Math.floor(Math.sqrt(vermoegen / 4000))
}

/** Punkte aus gekauften Luxusgütern. */
export function kaufPunkte(gekaufteIds: string[]): number {
  return gekaufteIds.reduce((sum, id) => {
    const item = LUXUS_KATALOG.find((i) => i.id === id)
    return sum + (item?.punkte ?? 0)
  }, 0)
}

/** Gesamter Lebensstandard-Score. */
export function lebensstandardPunkte(vermoegen: number, gekaufteIds: string[]): number {
  return wohlstandsPunkte(vermoegen) + kaufPunkte(gekaufteIds)
}

/** Aktuelle Stufe + Fortschritt zur nächsten Stufe (0..1). */
export function lebensstandard(vermoegen: number, gekaufteIds: string[]) {
  const punkte = lebensstandardPunkte(vermoegen, gekaufteIds)
  let idx = 0
  for (let i = 0; i < LEBENSSTANDARD_STUFEN.length; i++) {
    if (punkte >= LEBENSSTANDARD_STUFEN[i].ab) idx = i
  }
  const stufe = LEBENSSTANDARD_STUFEN[idx]
  const naechste = LEBENSSTANDARD_STUFEN[idx + 1]
  const fortschritt = naechste ? Math.min(1, (punkte - stufe.ab) / (naechste.ab - stufe.ab)) : 1
  return { punkte, stufe, index: idx, naechste, fortschritt }
}

/** Monatlicher Unterhalt aller gekauften Luxusgüter. */
export function luxusUnterhalt(gekaufteIds: string[]): number {
  return gekaufteIds.reduce((sum, id) => {
    const item = LUXUS_KATALOG.find((i) => i.id === id)
    return sum + (item?.unterhalt ?? 0)
  }, 0)
}

/** Progressiver Wohlstands-Drag: je höher das Vermögen, desto mehr Lifestyle-Ausgaben. */
export function wohlstandsDrag(vermoegen: number): number {
  if (vermoegen <= 0) return 0
  // Jahres-Staffel auf das Netto-Vermögen, monatlich abgerechnet.
  const staffel: [number, number][] = [
    [50_000, 0], // Freibetrag
    [250_000, 0.012],
    [1_000_000, 0.02],
    [5_000_000, 0.028],
    [Infinity, 0.035],
  ]
  let rest = vermoegen
  let prev = 0
  let jahr = 0
  for (const [grenze, rate] of staffel) {
    const anteil = Math.min(rest, grenze - prev)
    if (anteil <= 0) break
    jahr += anteil * rate
    rest -= anteil
    prev = grenze
  }
  return Math.round(jahr / 12)
}

/** Gesamte Sonderausgaben pro Monat (Wohlstands-Drag + Luxus-Unterhalt). */
export function sonderausgabenMonat(vermoegen: number, gekaufteIds: string[]): number {
  return wohlstandsDrag(vermoegen) + luxusUnterhalt(gekaufteIds)
}
