export type BauStil = 'günstig' | 'solide' | 'premium'

export interface Bauangebot {
  id: string
  name: string
  emoji: string
  stil: BauStil
  profil: string
  preis: number // ursprüngliches Angebot
  minPreis: number // verdeckte Untergrenze
  bauzeit: number // Monate (Stil-abhängig)
  angebot: number // aktueller Preis auf dem Tisch
  geduld: number
  runden: number // geführte Verhandlungsrunden (mehr = besserer Preis)
  status: 'offen' | 'einig' | 'abgelehnt'
}

// Je mehr Runden verhandelt wurde, desto tiefer geht der Bauträger mit dem Preis.
const MAX_BONUS = 0.15
function verhandlungsBonus(runden: number) {
  return Math.min(MAX_BONUS, runden * 0.035)
}

const FIRMEN = [
  'Yılmaz Bau', 'Meister & Sohn', 'BauProfi', 'Renova GmbH', 'Handwerk Nord', 'CityBau',
  'Schneider Sanierung', 'Alpin Bau', 'Fix & Fertig', 'Koch Renovierung', 'Wagner Bau', 'Elite Ausbau',
]

interface StilVorlage {
  stil: BauStil
  emoji: string
  profil: string
  preisF: [number, number]
  zeitF: [number, number]
}

const STILE: StilVorlage[] = [
  { stil: 'günstig', emoji: '🔧', profil: 'Günstigster Preis, dafür etwas länger und ohne Schnickschnack.', preisF: [0.82, 0.98], zeitF: [1.2, 1.6] },
  { stil: 'solide', emoji: '👷', profil: 'Faires Preis-Leistungs-Verhältnis, verlässliche Arbeit.', preisF: [0.98, 1.12], zeitF: [0.9, 1.1] },
  { stil: 'premium', emoji: '🏗️', profil: 'Top-Qualität und schnell — hat aber seinen Preis.', preisF: [1.15, 1.42], zeitF: [0.6, 0.85] },
]

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a)
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function runde(v: number, step = 100) {
  return Math.round(v / step) * step
}

function ausStil(s: StilVorlage, baseKosten: number, baseBauzeit: number, i: number): Bauangebot {
  const preis = Math.max(500, runde(baseKosten * rnd(s.preisF[0], s.preisF[1])))
  const minPreis = runde(preis * rnd(0.78, 0.9))
  const bauzeit = Math.max(1, Math.round(baseBauzeit * rnd(s.zeitF[0], s.zeitF[1])))
  return {
    id: `b-${Date.now()}-${i}-${Math.floor(rnd(100, 999))}`,
    name: pick(FIRMEN),
    emoji: s.emoji,
    stil: s.stil,
    profil: s.profil,
    preis,
    minPreis,
    bauzeit,
    angebot: preis,
    geduld: 3,
    runden: 0,
    status: 'offen',
  }
}

/** Erzeugt 3–4 Bauträger-Angebote für eine geplante Renovierung. */
export function generiereAngebote(baseKosten: number, baseBauzeit: number): Bauangebot[] {
  const gewaehlt: StilVorlage[] = [
    STILE[0], // immer ein günstiges
    STILE[2], // immer ein premium
    STILE[1],
  ]
  if (Math.random() < 0.5) gewaehlt.push(pick(STILE))
  return gewaehlt.sort(() => Math.random() - 0.5).map((s, i) => ausStil(s, baseKosten, baseBauzeit, i))
}

export interface BauReaktion {
  angebot: Bauangebot
  spielerNachricht: string
  bauNachricht: string
}

const JA = [
  'Okay, dafür mach ich das. Abgemacht!',
  'Passt, dann machen wir es zu dem Preis.',
  'Einverstanden — wir legen los.',
  'Deal. Ich schick dir die Truppe.',
]
const KNAPP = [
  'Da verdien ich fast nichts mehr, aber gut — abgemacht.',
  'Hart verhandelt. Okay, ich mach es.',
  'Für dich als Stammkunde: einverstanden.',
]

/** Der Bauträger reagiert auf einen gebotenen Preis (du drückst runter). */
export function verhandleBau(b: Bauangebot, gebot: number): BauReaktion {
  const spielerNachricht = `Ich zahle dafür ${gebot.toLocaleString('de-DE')} €.`
  // Bonus aus bisherigen Runden: die Untergrenze sinkt mit der Verhandlung.
  const effektiverMin = Math.round(b.minPreis * (1 - verhandlungsBonus(b.runden)))
  const copy = { ...b, runden: b.runden + 1 }

  if (gebot >= b.angebot) {
    return { angebot: copy, spielerNachricht, bauNachricht: `Gern, ${b.angebot.toLocaleString('de-DE')} € und es ist deins.` }
  }
  if (gebot >= effektiverMin) {
    copy.angebot = gebot
    const knapp = gebot < effektiverMin * 1.06
    return { angebot: copy, spielerNachricht, bauNachricht: pick(knapp ? KNAPP : JA) }
  }
  // unter der (aktuellen) Schmerzgrenze
  copy.geduld = b.geduld - 1
  if (copy.geduld <= 0) {
    copy.status = 'abgelehnt'
    return { angebot: copy, spielerNachricht, bauNachricht: 'Sorry, dafür steh ich morgens nicht auf. Ich bin raus.' }
  }
  copy.angebot = effektiverMin
  return {
    angebot: copy,
    spielerNachricht,
    bauNachricht: `Zäh, zäh… ${gebot.toLocaleString('de-DE')} € sind zu wenig. Aber ${effektiverMin.toLocaleString('de-DE')} € — das wäre mein letztes Wort.`,
  }
}

export function stilTon(s: BauStil): 'green' | 'amber' | 'blue' {
  return s === 'günstig' ? 'green' : s === 'solide' ? 'amber' : 'blue'
}

// --- Großes Bauträger-Verzeichnis (online bei Giggle findbar) ----------------
// Viele Firmen mit Bewertungen. Günstig = niedrige Sterne = höheres Risiko,
// dass die Renovierung schiefgeht (Pfusch/Wasserschaden danach).

export interface Bautraeger {
  id: string
  name: string
  emoji: string
  stil: BauStil
  rating: number // 1.0 – 5.0 Sterne
  bewertungen: number // Anzahl Bewertungen
  preisFaktor: number // Multiplikator auf die Basiskosten
  zeitFaktor: number // Multiplikator auf die Bauzeit
  qualiFaktor: number // Multiplikator auf die Wertsteigerung/Miet-Uplift
  risiko: number // 0..1 Chance auf Pfusch/Wasserschaden nach Fertigstellung
  spezialitaet: string
  slogan: string
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const BT_NAMEN = [
  'Yılmaz Bau', 'Meister & Sohn', 'BauProfi 24', 'Renova GmbH', 'Handwerk Nord', 'CityBau',
  'Schneider Sanierung', 'Alpin Bau', 'Fix & Fertig', 'Koch Renovierung', 'Wagner Bau', 'Elite Ausbau',
  'Kraft Bau', 'Novak Renovierungen', 'Sanierpro', 'Berg & Tal Bau', 'Feinwerk Ausbau', 'Turbo Renov',
  'Öztürk Bau', 'Kellermann GmbH', 'Sonnenbau', 'Präzision Ausbau', 'Diskont Bau', 'MeisterHand',
  'Baucrew Rhein', 'Klotz & Partner', 'Schnellrenov', 'PremiumHaus Ausbau', 'Spar-Sanierer', 'GoldBau',
]
const BT_SPEZ = ['Bäder & Küchen', 'Komplettsanierung', 'Energetische Sanierung', 'Böden & Malerarbeiten', 'Altbau-Spezialist', 'Fassade & Dach', 'Innenausbau', 'Wohnungsrenovierung']
const BT_SLOGAN = [
  'Schnell, sauber, zuverlässig.', 'Ihr Zuhause in besten Händen.', 'Qualität zum fairen Preis.',
  'Günstig muss nicht schlecht sein… meistens.', 'Wir packen an!', 'Renovieren wie die Profis.',
  'Termintreu und ehrlich.', 'Vom Keller bis zum Dach.', 'Preiswert — Risiko inklusive.', 'Meisterbetrieb seit Jahren.',
]

function machBautraeger(i: number): Bautraeger {
  const rng = mulberry32((i + 1) * 0x9e3779b1)
  const q = rng() // Qualitäts-/Preistier 0..1 (0 = billig/schlecht, 1 = premium)
  const stil: BauStil = q < 0.38 ? 'günstig' : q < 0.74 ? 'solide' : 'premium'
  const emoji = stil === 'günstig' ? '🔧' : stil === 'solide' ? '👷' : '🏗️'
  const rating = Math.min(5, Math.max(1.4, Math.round((1.9 + q * 3.0 + (rng() - 0.5) * 0.6) * 10) / 10))
  const bewertungen = 8 + Math.floor(rng() * rng() * 900)
  const preisFaktor = Math.round((0.55 + q * 1.05 + (rng() - 0.5) * 0.1) * 100) / 100
  const zeitFaktor = Math.round((1.55 - q * 0.95 + (rng() - 0.5) * 0.2) * 100) / 100
  const qualiFaktor = Math.round((0.78 + q * 0.5) * 100) / 100
  const risiko = Math.round(Math.min(0.55, Math.max(0.01, 0.5 * Math.pow(1 - q, 1.6) + (rng() - 0.5) * 0.06)) * 100) / 100
  return {
    id: `bt-${i}`,
    name: BT_NAMEN[i % BT_NAMEN.length],
    emoji,
    stil,
    rating,
    bewertungen,
    preisFaktor: Math.max(0.5, preisFaktor),
    zeitFaktor: Math.max(0.5, zeitFaktor),
    qualiFaktor,
    risiko,
    spezialitaet: BT_SPEZ[Math.floor(rng() * BT_SPEZ.length)],
    slogan: BT_SLOGAN[Math.floor(rng() * BT_SLOGAN.length)],
  }
}

/** Fester, deterministischer Pool an Bauträgern (wie ein Online-Verzeichnis). */
export const BAUTRAEGER_POOL: Bautraeger[] = Array.from({ length: 24 }, (_, i) => machBautraeger(i))

export function getBautraeger(id: string): Bautraeger | undefined {
  return BAUTRAEGER_POOL.find((b) => b.id === id)
}

/** Preisniveau-Symbol (€ / €€ / €€€) aus dem Preisfaktor. */
export function preisLevel(preisFaktor: number): string {
  return preisFaktor < 0.85 ? '€' : preisFaktor < 1.15 ? '€€' : '€€€'
}

/** Baut aus einem Bauträger + Basispreis ein verhandelbares Angebot. */
export function bautraegerAlsAngebot(bt: Bautraeger, basisKosten: number, basisBauzeit: number): Bauangebot {
  const preis = Math.max(500, runde(basisKosten * bt.preisFaktor))
  const minPreis = runde(preis * 0.84)
  const bauzeit = Math.max(1, Math.round(basisBauzeit * bt.zeitFaktor))
  return {
    id: bt.id,
    name: bt.name,
    emoji: bt.emoji,
    stil: bt.stil,
    profil: bt.slogan,
    preis,
    minPreis,
    bauzeit,
    angebot: preis,
    geduld: 3,
    runden: 0,
    status: 'offen',
  }
}
