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
  status: 'offen' | 'einig' | 'abgelehnt'
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
    geduld: 2,
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
  const copy = { ...b }

  if (gebot >= b.angebot) {
    // Du bietest so viel oder mehr als der Preis — er nimmt seinen Preis.
    return { angebot: copy, spielerNachricht, bauNachricht: `Gern, ${b.angebot.toLocaleString('de-DE')} € und es ist deins.` }
  }
  if (gebot >= b.minPreis) {
    copy.angebot = gebot
    const knapp = gebot < b.minPreis * 1.06
    return { angebot: copy, spielerNachricht, bauNachricht: pick(knapp ? KNAPP : JA) }
  }
  // unter der Schmerzgrenze
  copy.geduld = b.geduld - 1
  if (copy.geduld <= 0) {
    copy.status = 'abgelehnt'
    return { angebot: copy, spielerNachricht, bauNachricht: 'Sorry, dafür steh ich morgens nicht auf. Ich bin raus.' }
  }
  copy.angebot = b.minPreis
  return {
    angebot: copy,
    spielerNachricht,
    bauNachricht: `So günstig geht's nicht. Unter ${b.minPreis.toLocaleString('de-DE')} € läuft bei mir nichts.`,
  }
}

export function stilTon(s: BauStil): 'green' | 'amber' | 'blue' {
  return s === 'günstig' ? 'green' : s === 'solide' ? 'amber' : 'blue'
}
