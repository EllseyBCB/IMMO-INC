// Börse / Depot — Aktien, ETFs & Krypto mit live schwankenden Kursen.
// Der Kurs ist eine reine Funktion der Spielzeit (monthIndex), damit er
// deterministisch, offline-sicher und über Reloads hinweg konsistent ist.
// Weil monthIndex jede Sekunde weiterläuft (4 Echt-Std = 1 Monat), bewegen sich
// die Kurse laufend — es gibt beim Warten immer etwas zu beobachten.

export type AssetKlasse = 'ETF' | 'Aktie' | 'Krypto'

export interface Asset {
  id: string
  name: string
  kuerzel: string
  emoji: string
  klasse: AssetKlasse
  basis: number
  /** Monatliche Drift (Trend). 0.006 ≈ +7,4 %/Jahr. */
  drift: number
  /** Volatilität (Ausschlag der Schwankung). */
  vola: number
  /** Frequenz-Multiplikator — Krypto zappelt schneller. */
  tempo: number
  /** Jährliche Dividenden-/Ausschüttungsrendite (0 = keine). */
  dividende: number
  seed: number
  beschreibung: string
}

export interface DepotPosition {
  assetId: string
  menge: number
  /** Summe des investierten Kapitals (für Gewinn-/Verlust-Anzeige). */
  investiert: number
}

/** Ordergebühr (Kauf & Verkauf). */
export const ORDERGEBUEHR = 0.005

export const ASSETS: Asset[] = [
  // ETFs — ruhig, leichter Aufwärtstrend
  { id: 'etf_welt', name: 'Welt-Index ETF', kuerzel: 'WRLD', emoji: '🌍', klasse: 'ETF', basis: 100, drift: 0.006, vola: 0.06, tempo: 1, dividende: 0.02, seed: 1.7, beschreibung: 'Breit gestreut über tausende Firmen weltweit. Ruhig und solide.' },
  { id: 'etf_tech', name: 'Tech-Sektor ETF', kuerzel: 'TECH', emoji: '💻', klasse: 'ETF', basis: 140, drift: 0.009, vola: 0.11, tempo: 1.1, dividende: 0.01, seed: 2.9, beschreibung: 'Technologie-Schwergewichte gebündelt. Mehr Chance, mehr Schwankung.' },
  { id: 'etf_div', name: 'Dividenden ETF', kuerzel: 'DIVD', emoji: '💰', klasse: 'ETF', basis: 80, drift: 0.004, vola: 0.05, tempo: 1, dividende: 0.045, seed: 4.1, beschreibung: 'Fokus auf hohe Ausschüttungen — zahlt jeden Monat Dividende.' },

  // Aktien — mittlere Schwankung, teils Dividende
  { id: 'ak_technova', name: 'TechNova AG', kuerzel: 'TNV', emoji: '🚀', klasse: 'Aktie', basis: 210, drift: 0.011, vola: 0.20, tempo: 1.2, dividende: 0, seed: 5.5, beschreibung: 'Wachstumsstar ohne Dividende — Kurs macht die Musik.' },
  { id: 'ak_greenwatt', name: 'GreenWatt Energie', kuerzel: 'GRW', emoji: '⚡', klasse: 'Aktie', basis: 60, drift: 0.007, vola: 0.16, tempo: 1.2, dividende: 0.02, seed: 6.8, beschreibung: 'Erneuerbare Energien — solide mit etwas Ausschüttung.' },
  { id: 'ak_automoto', name: 'AutoMoto AG', kuerzel: 'AUT', emoji: '🚗', klasse: 'Aktie', basis: 95, drift: 0.003, vola: 0.15, tempo: 1.2, dividende: 0.035, seed: 8.2, beschreibung: 'Traditioneller Autobauer, zahlt zuverlässig Dividende.' },
  { id: 'ak_pharmavit', name: 'PharmaVit AG', kuerzel: 'PHV', emoji: '💊', klasse: 'Aktie', basis: 130, drift: 0.006, vola: 0.12, tempo: 1.1, dividende: 0.028, seed: 9.4, beschreibung: 'Defensiver Pharmawert — läuft auch in stürmischen Zeiten.' },
  { id: 'ak_baustein', name: 'BauStein Immobilien AG', kuerzel: 'BST', emoji: '🏢', klasse: 'Aktie', basis: 45, drift: 0.005, vola: 0.13, tempo: 1.1, dividende: 0.05, seed: 10.6, beschreibung: 'Immobilien-AG — passt zu deinem Portfolio, hohe Dividende.' },

  // Krypto — wild, hohe Ausschläge
  { id: 'kr_bitcore', name: 'BitCore', kuerzel: 'BTC', emoji: '₿', klasse: 'Krypto', basis: 30000, drift: 0.008, vola: 0.5, tempo: 1.7, dividende: 0, seed: 12.3, beschreibung: 'Die digitale Leitwährung. Hohe Chance, hohes Risiko.' },
  { id: 'kr_ethernet', name: 'EtherNet', kuerzel: 'ETN', emoji: '🔷', klasse: 'Krypto', basis: 2000, drift: 0.007, vola: 0.55, tempo: 1.8, dividende: 0, seed: 14.9, beschreibung: 'Smart-Contract-Plattform — schwankt noch heftiger.' },
  { id: 'kr_memecoin', name: 'MemeCoin', kuerzel: 'MEME', emoji: '🐕', klasse: 'Krypto', basis: 0.05, drift: -0.001, vola: 0.9, tempo: 2.2, dividende: 0, seed: 17.1, beschreibung: 'Reines Casino. Kann sich vervielfachen oder zerbröseln.' },
]

export function getAsset(id: string): Asset | undefined {
  return ASSETS.find((a) => a.id === id)
}

/** Aktueller Kurs eines Assets zur Spielzeit t (monthIndex) inkl. News-Schocks. */
export function assetPreis(a: Asset, t: number): number {
  const s = a.seed
  const drift = Math.exp(a.drift * t)
  const f = a.tempo
  const osc =
    0.5 * Math.sin(t * 6.3 * f + s) +
    0.27 * Math.sin(t * 17.7 * f + s * 2.3) +
    0.13 * Math.sin(t * 41.0 * f + s * 3.9) +
    0.1 * Math.sin(t * 150.0 * f + s * 5.1)
  const faktor = 1 + a.vola * osc
  return Math.max(a.basis * 0.03, a.basis * drift * faktor * (1 + newsFaktor(a, t)))
}

/** Prozentuale Kursänderung über die letzte Spanne (Standard ≈ 1 Spiel-Tag). */
export function assetVeraenderung(a: Asset, t: number, spanne = 1 / 30): number {
  const jetzt = assetPreis(a, t)
  const vorher = assetPreis(a, Math.max(0, t - spanne))
  if (vorher <= 0) return 0
  return (jetzt / vorher - 1) * 100
}

/** Kurs-Historie für die Sparkline (n Punkte über die letzte Spanne). */
export function preisHistorie(a: Asset, t: number, n = 32, spanne = 0.25): number[] {
  const von = Math.max(0, t - spanne)
  const schritt = (t - von) / (n - 1)
  const werte: number[] = []
  for (let i = 0; i < n; i++) werte.push(assetPreis(a, von + schritt * i))
  return werte
}

/** Gesamtwert eines Depots zur Spielzeit t. */
export function depotWert(depot: DepotPosition[], t: number): number {
  return depot.reduce((sum, p) => {
    const a = getAsset(p.assetId)
    return sum + (a ? p.menge * assetPreis(a, t) : 0)
  }, 0)
}

/** Investiertes Kapital (Einstandswert) über alle Positionen. */
export function depotEinstand(depot: DepotPosition[]): number {
  return depot.reduce((sum, p) => sum + p.investiert, 0)
}

// --- Börsen-News-Events ----------------------------------------------------
// Rein zeitabhängig & deterministisch: Events werden aus der Spielzeit
// abgeleitet, damit Kurs, Chart, Depotwert und Vermögen automatisch konsistent
// sind. Für den Spieler bleibt es unvorhersehbar und fair (kein Save-Scumming).

/** Zeit-Fenster eines News-Events (~12 Echt-Minuten). */
const NEWS_BUCKET = 0.05
/** Wahrscheinlichkeit, dass in einem Fenster überhaupt etwas passiert. */
const NEWS_CHANCE = 0.45

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const HEADLINES_POS: Record<AssetKlasse, string[]> = {
  ETF: ['{n} zieht dank starker Marktbreite an', 'Zuflüsse treiben {n} nach oben', '{n} auf neuem Jahreshoch'],
  Aktie: ['{n} übertrifft die Erwartungen', 'Analysten stufen {n} hoch', '{n} meldet Rekordgewinn', 'Großauftrag beflügelt {n}', '{n} kündigt Aktienrückkauf an'],
  Krypto: ['{n} explodiert nach ETF-Gerücht', '{n} rallyt — Anleger im Kaufrausch', 'Prominenter Tweet treibt {n}', '{n} durchbricht wichtige Marke'],
}
const HEADLINES_NEG: Record<AssetKlasse, string[]> = {
  ETF: ['{n} gibt mit dem Gesamtmarkt nach', 'Abflüsse belasten {n}', '{n} rutscht ins Minus'],
  Aktie: ['{n} enttäuscht die Anleger', 'Gewinnwarnung bei {n}', 'Analysten stufen {n} ab', 'Skandal erschüttert {n}', '{n} verfehlt die Prognosen'],
  Krypto: ['{n} stürzt nach Hack-Meldung ab', 'Regulierer nehmen {n} ins Visier', 'Panikverkäufe bei {n}', '{n} bricht heftig ein'],
}

export interface NewsEvent {
  assetId: string
  positiv: boolean
  /** Kurs-Schock (z. B. +0.12 / -0.09). */
  schock: number
  /** Betrag der Änderung in Prozent. */
  prozent: number
  /** Dauer des Ausklingens (in Monaten). */
  dauer: number
  /** Startzeit (monthIndex). */
  startT: number
  text: string
}

/** Deterministisches Event für ein Zeitfenster k (oder null). */
function bucketEvent(k: number): NewsEvent | null {
  if (k < 0) return null
  const rng = mulberry32(((k + 1) * 0x9e3779b1) >>> 0)
  if (rng() > NEWS_CHANCE) return null
  const a = ASSETS[Math.floor(rng() * ASSETS.length)]
  const positiv = rng() < 0.55
  const r = rng()
  const mag =
    a.klasse === 'ETF' ? 0.02 + r * 0.03 : a.klasse === 'Aktie' ? 0.04 + r * 0.08 : 0.08 + r * 0.22
  const dauer = 0.1 + rng() * 0.25
  const vorlagen = (positiv ? HEADLINES_POS : HEADLINES_NEG)[a.klasse]
  const text = vorlagen[Math.floor(rng() * vorlagen.length)].replace('{n}', a.name)
  return {
    assetId: a.id,
    positiv,
    schock: (positiv ? 1 : -1) * mag,
    prozent: mag * 100,
    dauer,
    startT: k * NEWS_BUCKET,
    text,
  }
}

/** Summierter News-Effekt auf ein Asset zur Zeit t (klingt linear aus). */
export function newsFaktor(a: Asset, t: number): number {
  const k0 = Math.floor(t / NEWS_BUCKET)
  let sum = 0
  for (let k = k0; k >= k0 - 10 && k >= 0; k--) {
    const ev = bucketEvent(k)
    if (!ev || ev.assetId !== a.id) continue
    const dt = t - ev.startT
    if (dt < 0 || dt > ev.dauer) continue
    sum += ev.schock * (1 - dt / ev.dauer)
  }
  return Math.max(-0.5, Math.min(0.6, sum))
}

/** 'pos' | 'neg' | null — ob ein Asset gerade ein aktives Event hat (für Badge). */
export function assetEventBadge(a: Asset, t: number): 'pos' | 'neg' | null {
  const f = newsFaktor(a, t)
  if (f > 0.01) return 'pos'
  if (f < -0.01) return 'neg'
  return null
}

/** Die letzten n Schlagzeilen bis zur Zeit t (neueste zuerst). */
export function aktuelleNews(t: number, n = 6): (NewsEvent & { aktiv: boolean })[] {
  const k0 = Math.floor(t / NEWS_BUCKET)
  const out: (NewsEvent & { aktiv: boolean })[] = []
  for (let k = k0; k >= 0 && out.length < n; k--) {
    const ev = bucketEvent(k)
    if (!ev || ev.startT > t) continue
    out.push({ ...ev, aktiv: t <= ev.startT + ev.dauer })
  }
  return out
}
