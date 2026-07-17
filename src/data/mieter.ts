export type Risiko = 'gering' | 'mittel' | 'hoch'

export interface Mieter {
  id: string
  name: string
  emoji: string
  beruf: string
  profil: string
  risiko: Risiko
  wunschMiete: number // was er/sie gern zahlen würde
  maxMiete: number // absolute Schmerzgrenze (verdeckt)
  angebot: number // aktuelles Angebot auf dem Tisch
  geduld: number // wie oft man noch über die Grenze fordern kann
  runden: number // Anzahl geführter Verhandlungsrunden (mehr = besser)
  status: 'offen' | 'einig' | 'abgelehnt'
}

// Je mehr Runden verhandelt wurde, desto mehr gibt der Mieter beim Preis nach
// (die verdeckte Schmerzgrenze steigt). Belohnt intensives Verhandeln.
const MAX_BONUS = 0.15
function verhandlungsBonus(runden: number) {
  return Math.min(MAX_BONUS, runden * 0.035)
}

const VORNAMEN = [
  'Lena', 'Jonas', 'Sophie', 'Max', 'Marie', 'Paul', 'Emma', 'Ben', 'Laura', 'Tim',
  'Julia', 'Felix', 'Anna', 'Lukas', 'Sarah', 'David', 'Nina', 'Jan', 'Clara', 'Tom',
  'Aylin', 'Deniz', 'Mert', 'Fatma', 'Kevin', 'Chantal', 'Marco', 'Bianca',
]
const NACHNAMEN = [
  'Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch',
  'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger',
  'Yılmaz', 'Kaya', 'Nowak', 'Petrov',
]

interface ProfilVorlage {
  beruf: string
  emoji: string
  risiko: Risiko
  profil: string
}

const PROFILE: ProfilVorlage[] = [
  { beruf: 'Beamtin', emoji: '👩‍💼', risiko: 'gering', profil: 'Unbefristet verbeamtet, sucht langfristig. Top-Bonität.' },
  { beruf: 'Softwareentwickler', emoji: '👨‍💻', risiko: 'gering', profil: 'Festanstellung, gutes Gehalt, sehr zuverlässig.' },
  { beruf: 'Lehrerin', emoji: '👩‍🏫', risiko: 'gering', profil: 'Sicheres Einkommen, ruhig, langfristig orientiert.' },
  { beruf: 'Rentnerpaar', emoji: '👵', risiko: 'gering', profil: 'Feste Rente, sehr solvent, pfleglich.' },
  { beruf: 'Angestellter', emoji: '🧑‍💼', risiko: 'mittel', profil: 'Solides Einkommen, Probezeit gerade vorbei.' },
  { beruf: 'Studentin', emoji: '👩‍🎓', risiko: 'mittel', profil: 'Kleines Budget, aber Eltern bürgen.' },
  { beruf: 'Selbstständiger', emoji: '🧑‍🔧', risiko: 'mittel', profil: 'Schwankendes Einkommen, gute Auftragslage.' },
  { beruf: 'Kellner', emoji: '🧑‍🍳', risiko: 'hoch', profil: 'Trinkgeld-Einkommen, unregelmäßig. Zahlt gern bar.' },
  { beruf: 'zwischen zwei Jobs', emoji: '🧑', risiko: 'hoch', profil: 'Keine lückenlose Schufa, will sich beweisen.' },
  { beruf: 'Neustart nach Insolvenz', emoji: '🧑‍🦱', risiko: 'hoch', profil: 'Sucht eine zweite Chance, bietet dafür mehr.' },
]

function rint(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1))
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function rundeAuf(v: number, step = 10) {
  return Math.round(v / step) * step
}

function ausProfil(p: ProfilVorlage, markt: number, i: number): Mieter {
  // Höheres Risiko => bereit, mehr zu zahlen (kompensiert die Unsicherheit).
  const spanne =
    p.risiko === 'gering' ? [0.9, 1.05] : p.risiko === 'mittel' ? [1.0, 1.2] : [1.12, 1.45]
  const maxMiete = rundeAuf(markt * (spanne[0] + Math.random() * (spanne[1] - spanne[0])))
  const wunschMiete = rundeAuf(maxMiete * (0.82 + Math.random() * 0.1))
  return {
    id: `m-${Date.now()}-${i}-${rint(100, 999)}`,
    name: `${pick(VORNAMEN)} ${pick(NACHNAMEN)}`,
    emoji: p.emoji,
    beruf: p.beruf,
    profil: p.profil,
    risiko: p.risiko,
    wunschMiete,
    maxMiete,
    angebot: wunschMiete,
    geduld: 3,
    runden: 0,
    status: 'offen',
  }
}

/** Erzeugt 3–4 Bewerber mit gemischten Risikoprofilen für eine Marktmiete. */
export function generiereBewerber(markt: number): Mieter[] {
  const anzahl = rint(3, 4)
  // Für Vielfalt: mind. ein geringes und ein hohes Risiko dabei.
  const gewaehlt: ProfilVorlage[] = [
    pick(PROFILE.filter((p) => p.risiko === 'gering')),
    pick(PROFILE.filter((p) => p.risiko === 'hoch')),
  ]
  while (gewaehlt.length < anzahl) gewaehlt.push(pick(PROFILE))
  return gewaehlt
    .sort(() => Math.random() - 0.5)
    .map((p, i) => ausProfil(p, markt, i))
}

export interface Reaktion {
  mieter: Mieter
  spielerNachricht: string
  mieterNachricht: string
}

const ZUSAGE = [
  'Passt für mich — abgemacht!',
  'Okay, das ist fair. Ich nehme die Wohnung.',
  'Deal! Wo unterschreibe ich?',
  'Einverstanden, die Miete geht klar.',
]
const KNAPP = [
  'Puh, das ist am oberen Limit — aber ich mach es.',
  'Etwas viel, aber die Wohnung ist es mir wert. Ich sage zu.',
  'Gerade noch stemmbar. Einverstanden.',
]

/** Der Mieter reagiert auf eine geforderte Kaltmiete. */
export function verhandle(m: Mieter, forderung: number): Reaktion {
  const spielerNachricht = `Ich hätte gern ${forderung.toLocaleString('de-DE')} € Kaltmiete.`
  // Bonus aus bisherigen Runden: die Schmerzgrenze steigt mit der Verhandlung.
  const effektiverMax = Math.round(m.maxMiete * (1 + verhandlungsBonus(m.runden)))
  const copy = { ...m, runden: m.runden + 1 }

  if (forderung <= m.wunschMiete) {
    copy.angebot = forderung
    return { mieter: copy, spielerNachricht, mieterNachricht: pick(ZUSAGE) }
  }
  if (forderung <= effektiverMax) {
    copy.angebot = forderung
    return { mieter: copy, spielerNachricht, mieterNachricht: pick(KNAPP) }
  }
  // über der (aktuellen) Schmerzgrenze
  copy.geduld = m.geduld - 1
  if (copy.geduld <= 0) {
    copy.status = 'abgelehnt'
    return {
      mieter: copy,
      spielerNachricht,
      mieterNachricht: `Das sprengt mein Budget leider komplett. Ich ziehe meine Bewerbung zurück. Viel Erfolg!`,
    }
  }
  copy.angebot = effektiverMax
  return {
    mieter: copy,
    spielerNachricht,
    mieterNachricht: `Puh, ${forderung.toLocaleString('de-DE')} € sind zu viel. Aber gut, ${effektiverMax.toLocaleString('de-DE')} € könnte ich mir noch überlegen…`,
  }
}

export function risikoTon(r: Risiko): 'green' | 'amber' | 'rose' {
  return r === 'gering' ? 'green' : r === 'mittel' ? 'amber' : 'rose'
}
