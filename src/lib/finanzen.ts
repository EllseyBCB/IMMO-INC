// ---------------------------------------------------------------------------
// Finanz-Engine — realistische deutsche Immobilienrechnungen
// ---------------------------------------------------------------------------

/** Grunderwerbsteuer-Sätze je Bundesland (Stand 2026, gerundet). */
export const GRUNDERWERBSTEUER: Record<string, number> = {
  'Baden-Württemberg': 0.05,
  Bayern: 0.035,
  Berlin: 0.06,
  Brandenburg: 0.065,
  Bremen: 0.05,
  Hamburg: 0.055,
  Hessen: 0.06,
  'Mecklenburg-Vorpommern': 0.06,
  Niedersachsen: 0.05,
  'Nordrhein-Westfalen': 0.065,
  'Rheinland-Pfalz': 0.05,
  Saarland: 0.065,
  Sachsen: 0.055,
  'Sachsen-Anhalt': 0.05,
  'Schleswig-Holstein': 0.065,
  Thüringen: 0.05,
}

export const NOTAR_QUOTE = 0.015 // Notar + Beurkundung
export const GRUNDBUCH_QUOTE = 0.005 // Grundbucheintrag
export const MAKLER_QUOTE = 0.0357 // Käuferanteil Maklercourtage (inkl. USt), teilbar

export interface Kaufnebenkosten {
  grunderwerbsteuer: number
  notar: number
  grundbuch: number
  makler: number
  gesamt: number
  quote: number
}

/** Berechnet die Kaufnebenkosten für einen Kaufpreis. */
export function kaufnebenkosten(
  kaufpreis: number,
  bundesland: string,
  mitMakler: boolean,
): Kaufnebenkosten {
  const grestSatz = GRUNDERWERBSTEUER[bundesland] ?? 0.05
  const grunderwerbsteuer = kaufpreis * grestSatz
  const notar = kaufpreis * NOTAR_QUOTE
  const grundbuch = kaufpreis * GRUNDBUCH_QUOTE
  const makler = mitMakler ? kaufpreis * MAKLER_QUOTE : 0
  const gesamt = grunderwerbsteuer + notar + grundbuch + makler
  return {
    grunderwerbsteuer,
    notar,
    grundbuch,
    makler,
    gesamt,
    quote: gesamt / kaufpreis,
  }
}

/** Monatliche Annuität (Zins + Tilgung) für ein Darlehen. */
export function annuitaet(darlehen: number, sollzinsProJahr: number, laufzeitJahre: number): number {
  if (darlehen <= 0) return 0
  const i = sollzinsProJahr / 12
  const n = laufzeitJahre * 12
  if (i === 0) return darlehen / n
  return (darlehen * i) / (1 - Math.pow(1 + i, -n))
}

/** Restschuld nach `monate` Monaten bei fester Annuität. */
export function restschuld(
  darlehen: number,
  sollzinsProJahr: number,
  monatsrate: number,
  monate: number,
): number {
  const i = sollzinsProJahr / 12
  let saldo = darlehen
  for (let m = 0; m < monate; m++) {
    const zins = saldo * i
    const tilgung = Math.max(0, monatsrate - zins)
    saldo = Math.max(0, saldo - tilgung)
  }
  return saldo
}

/** Zins- und Tilgungsanteil der aktuellen Monatsrate. */
export function ratenAufteilung(saldo: number, sollzinsProJahr: number, monatsrate: number) {
  const zins = saldo * (sollzinsProJahr / 12)
  const tilgung = Math.max(0, monatsrate - zins)
  return { zins, tilgung }
}

// --- Bonität / Bank -------------------------------------------------------

export interface Bonitaet {
  score: number // 0..100
  maxDarlehen: number
  empfohlenerZins: number
  label: string
}

/**
 * Sehr vereinfachte Bonitätsbewertung: verfügbares Monatseinkommen,
 * Eigenkapital und bestehende Belastungen bestimmen Score, Zins und Rahmen.
 */
export function bonitaet(params: {
  nettoEinkommen: number
  fixkosten: number
  eigenkapital: number
  bestehendeRaten: number
}): Bonitaet {
  const { nettoEinkommen, fixkosten, eigenkapital, bestehendeRaten } = params
  const verfuegbar = Math.max(0, nettoEinkommen - fixkosten - bestehendeRaten)
  // Banken kalkulieren grob mit ~35% des Nettoeinkommens als tragbarer Rate.
  const tragbareRate = Math.max(0, nettoEinkommen * 0.4 - bestehendeRaten)

  let score = 40
  score += Math.min(30, (verfuegbar / 1500) * 30)
  score += Math.min(20, (eigenkapital / 60000) * 20)
  score -= Math.min(25, (bestehendeRaten / 1500) * 25)
  score = Math.max(5, Math.min(99, Math.round(score)))

  // Zins fällt mit besserer Bonität (Basis ~4,4 %).
  const empfohlenerZins = Math.max(0.031, 0.052 - (score / 100) * 0.022)

  // Maximales Darlehen aus tragbarer Rate rückgerechnet (25 J, empf. Zins).
  const i = empfohlenerZins / 12
  const n = 25 * 12
  const maxDarlehen = tragbareRate > 0 ? (tragbareRate * (1 - Math.pow(1 + i, -n))) / i : 0

  let label = 'ausreichend'
  if (score >= 80) label = 'sehr gut'
  else if (score >= 65) label = 'gut'
  else if (score >= 50) label = 'solide'
  else if (score >= 35) label = 'grenzwertig'
  else label = 'schwach'

  return { score, maxDarlehen, empfohlenerZins, label }
}

// --- Finanzierungsangebot: Zins & Eigenkapital steuern die Genehmigung -----

export interface FinanzAngebot {
  darlehen: number
  ltv: number
  fairZins: number
  angebotenerZins: number
  rahmen: number // maximal genehmigungsfähiges Darlehen bei diesem Zinsangebot
  monatsrate: number
  chance: number // 0..1 – "Finanzierungschance" für die Anzeige
  genehmigt: boolean
  maxZinsAufschlag: number
}

export const MAX_ZINS_AUFSCHLAG = 0.045 // bis +4,5 Prozentpunkte über dem fairen Zins

/**
 * Bewertet ein Finanzierungsangebot.
 * - Mehr Eigenkapital (niedrigerer Beleihungsauslauf/LTV) => niedrigerer fairer Zins.
 * - Höheres Zinsangebot => größere Kreditbereitschaft der Bank => eher genehmigt.
 * Deterministisch: die "chance" ist eine Anzeige, die man über Zins/EK auf
 * "genehmigt" hochschiebt – kein Zufall bei der Kreditzusage.
 */
export function finanzierungsAngebot(params: {
  bon: Bonitaet
  nettoEinkommen: number
  kaufpreis: number
  nebenkosten: number
  eigenkapitalEinsatz: number
  zinsAufschlag: number
  laufzeitJahre: number
}): FinanzAngebot {
  const { bon, nettoEinkommen, kaufpreis, nebenkosten, eigenkapitalEinsatz, zinsAufschlag, laufzeitJahre } = params

  const darlehen = Math.max(0, Math.round(kaufpreis + nebenkosten - eigenkapitalEinsatz))
  const ltv = kaufpreis > 0 ? darlehen / kaufpreis : 0

  // Mehr EK (niedriger LTV) => niedrigerer fairer Zins. Über 50 % LTV wird es teurer.
  const fairZins = Math.min(0.09, Math.max(0.031, bon.empfohlenerZins + Math.max(0, ltv - 0.5) * 0.03))

  const aufschlag = Math.max(0, Math.min(MAX_ZINS_AUFSCHLAG, zinsAufschlag))
  const angebotenerZins = Math.min(0.095, fairZins + aufschlag)

  // Kreditbereitschaft steigt mit dem Zinsangebot (bis +80 % Rahmen) – der
  // Aufschlag ist Risikoprämie für die Bank, macht dich also attraktiver.
  const willingness = 1 + Math.min(1, aufschlag / Math.max(0.001, fairZins)) * 0.8
  let rahmen = bon.maxDarlehen * willingness

  // Tragbarkeitsdeckel: Monatsrate darf 55 % des Nettoeinkommens nicht übersteigen.
  // Bewusst am fairen Zins bemessen, damit ein höheres Angebot die Obergrenze
  // nicht wieder auffrisst (Spielmechanik: mehr Zins => eher genehmigt).
  const rateCap = nettoEinkommen * 0.55
  const i = fairZins / 12
  const n = laufzeitJahre * 12
  const maxAusRate = i > 0 ? (rateCap * (1 - Math.pow(1 + i, -n))) / i : rateCap * n
  rahmen = Math.max(0, Math.min(rahmen, maxAusRate, kaufpreis)) // keine >100 %-Finanzierung

  const monatsrate = Math.round(annuitaet(darlehen, angebotenerZins, laufzeitJahre))
  const genehmigt = darlehen <= rahmen + 1

  // Chance-Meter: Headroom im Rahmen + Eigenkapitalquote.
  const ekQuote = eigenkapitalEinsatz / Math.max(1, kaufpreis + nebenkosten)
  let chance: number
  if (genehmigt) {
    const headroom = rahmen > 0 ? (rahmen - darlehen) / rahmen : 0
    chance = 0.6 + Math.min(0.4, headroom * 0.6 + ekQuote * 0.5)
  } else {
    const ratio = darlehen > 0 ? rahmen / darlehen : 0
    chance = Math.min(0.59, Math.max(0, ratio * 0.59))
  }

  return {
    darlehen,
    ltv,
    fairZins,
    angebotenerZins,
    rahmen: Math.round(rahmen),
    monatsrate,
    chance: Math.max(0, Math.min(1, chance)),
    genehmigt,
    maxZinsAufschlag: MAX_ZINS_AUFSCHLAG,
  }
}

// --- Renovierung / Wertermittlung -----------------------------------------

/**
 * Spekulationssteuer: Gewinn aus privatem Immobilienverkauf ist innerhalb
 * von 10 Jahren steuerpflichtig (hier vereinfacht mit persönlichem Steuersatz).
 */
export function spekulationssteuer(
  gewinn: number,
  haltedauerMonate: number,
  steuersatz = 0.35,
): number {
  if (gewinn <= 0) return 0
  if (haltedauerMonate >= 120) return 0 // > 10 Jahre steuerfrei
  return gewinn * steuersatz
}

/** Verkaufsnebenkosten für den Verkäufer (Energieausweis, ggf. Restmakler). */
export function verkaufsnebenkosten(verkaufspreis: number): number {
  return verkaufspreis * 0.01 + 250
}
