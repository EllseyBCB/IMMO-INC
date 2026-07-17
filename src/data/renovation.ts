import type { RenovationScope, Qualitaet } from './types'

export interface RenovationItem {
  scope: RenovationScope
  label: string
  emoji: string
  beschreibung: string
  /** Basiskosten pro m² Wohnfläche (Qualität "standard"). */
  kostenProM2: number
  /** Wertsteigerung als Anteil des Marktwerts bei Standard-Qualität. */
  wertHebel: number
  /** Bauzeit in Monaten (grob). */
  bauzeit: number
  /** Prompt-Bausteine für die spätere KI-Bildgenerierung. */
  promptTeil: string
}

export const RENOVATION_KATALOG: RenovationItem[] = [
  {
    scope: 'kueche',
    label: 'Küche',
    emoji: '🍳',
    beschreibung: 'Neue Einbauküche inkl. Geräte, Arbeitsplatte und Beleuchtung.',
    kostenProM2: 190,
    wertHebel: 0.05,
    bauzeit: 1,
    promptTeil: 'a brand new modern fitted kitchen with high-end appliances',
  },
  {
    scope: 'bad',
    label: 'Badezimmer',
    emoji: '🛁',
    beschreibung: 'Komplettsanierung Bad: Fliesen, Sanitär, ebenerdige Dusche.',
    kostenProM2: 210,
    wertHebel: 0.05,
    bauzeit: 1,
    promptTeil: 'a fully renovated modern bathroom with walk-in shower and large-format tiles',
  },
  {
    scope: 'boden',
    label: 'Böden',
    emoji: '🪵',
    beschreibung: 'Hochwertiges Parkett / Vinyl in allen Wohnräumen.',
    kostenProM2: 75,
    wertHebel: 0.03,
    bauzeit: 1,
    promptTeil: 'new light oak wooden flooring throughout',
  },
  {
    scope: 'waende',
    label: 'Wände & Malerarbeiten',
    emoji: '🎨',
    beschreibung: 'Glatte Wände, frische Farbe, moderne Innentüren.',
    kostenProM2: 45,
    wertHebel: 0.02,
    bauzeit: 1,
    promptTeil: 'freshly painted smooth white walls, bright and clean',
  },
  {
    scope: 'fassade',
    label: 'Fassade & Außen',
    emoji: '🏠',
    beschreibung: 'Fassade streichen/verputzen, Eingang und Außenanlage aufwerten.',
    kostenProM2: 95,
    wertHebel: 0.04,
    bauzeit: 2,
    promptTeil: 'a clean freshly plastered modern facade with tidy landscaping',
  },
  {
    scope: 'energetisch',
    label: 'Energetische Sanierung',
    emoji: '⚡',
    beschreibung: 'Dämmung, neue Fenster, moderne Heizung (Wärmepumpe).',
    kostenProM2: 260,
    wertHebel: 0.07,
    bauzeit: 3,
    promptTeil: 'energy-efficient triple-glazed windows and a modern look',
  },
  {
    scope: 'grundriss',
    label: 'Grundriss öffnen',
    emoji: '📐',
    beschreibung: 'Wände versetzen, offener Wohn-/Kochbereich.',
    kostenProM2: 130,
    wertHebel: 0.05,
    bauzeit: 2,
    promptTeil: 'an open-plan bright living and dining area with lots of natural light',
  },
  {
    scope: 'smarthome',
    label: 'Smart Home',
    emoji: '📱',
    beschreibung: 'Smarte Heizung, Licht, Rollläden und Sicherheit.',
    kostenProM2: 40,
    wertHebel: 0.02,
    bauzeit: 1,
    promptTeil: 'subtle smart-home details, modern and tidy',
  },
]

export const QUALITAET_FAKTOR: Record<Qualitaet, { kosten: number; wert: number; label: string }> = {
  standard: { kosten: 1, wert: 1, label: 'Standard' },
  gehoben: { kosten: 1.6, wert: 1.4, label: 'Gehoben' },
  luxus: { kosten: 2.6, wert: 1.9, label: 'Luxus' },
}

export interface RenovationResult {
  kosten: number
  wertsteigerung: number
  bauzeit: number
  prompt: string
}

/** Berechnet Kosten, Wertsteigerung und Bauzeit einer Renovierungsauswahl. */
export function berechneRenovierung(
  scopes: RenovationScope[],
  qualitaet: Qualitaet,
  wohnflaeche: number,
  marktwert: number,
  sanierungspotenzial: number,
): RenovationResult {
  const q = QUALITAET_FAKTOR[qualitaet]
  let kosten = 0
  let wertHebel = 0
  let bauzeit = 0
  const promptTeile: string[] = []

  for (const scope of scopes) {
    const item = RENOVATION_KATALOG.find((r) => r.scope === scope)
    if (!item) continue
    kosten += item.kostenProM2 * wohnflaeche * q.kosten
    wertHebel += item.wertHebel * q.wert
    bauzeit = Math.max(bauzeit, item.bauzeit) + item.bauzeit * 0.4
    promptTeile.push(item.promptTeil)
  }

  // Wertsteigerung wird durch das tatsächliche Sanierungspotenzial gedeckelt:
  // ein bereits neuwertiges Objekt lässt sich kaum aufwerten.
  const gedeckelterHebel = Math.min(wertHebel, sanierungspotenzial + 0.05)
  const wertsteigerung = marktwert * gedeckelterHebel

  return {
    kosten: Math.round(kosten),
    wertsteigerung: Math.round(wertsteigerung),
    bauzeit: Math.max(1, Math.round(bauzeit)),
    prompt: promptTeile.join(', '),
  }
}
