import type { Objektart, Property, Zustand } from './types'

// ---------------------------------------------------------------------------
// OpenImmo-Parser — liest den XML-Feed und liefert typisierte Properties.
// Bewusst tolerant geschrieben, damit später ein echter OpenImmo-Export passt.
// ---------------------------------------------------------------------------

function text(el: Element | null, selector: string): string {
  if (!el) return ''
  const node = el.querySelector(selector)
  return node?.textContent?.trim() ?? ''
}

function number(el: Element | null, selector: string, fallback = 0): number {
  // Werte im Feed nutzen Punkt als Dezimaltrenner (z. B. "2.5" Zimmer);
  // ein evtl. Komma wird ebenfalls als Dezimaltrenner behandelt.
  const raw = text(el, selector).replace(',', '.')
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function userField(el: Element, feldname: string): string {
  const fields = Array.from(el.querySelectorAll('user_defined_simplefield'))
  const match = fields.find((f) => f.getAttribute('feldname') === feldname)
  return match?.textContent?.trim() ?? ''
}

const ZUSTAND_MAP: Record<string, Zustand> = {
  SANIERUNGSBEDUERFTIG: 'sanierungsbedürftig',
  RENOVIERUNGSBEDUERFTIG: 'renovierungsbedürftig',
  GEPFLEGT: 'gepflegt',
  MODERNISIERT: 'modernisiert',
  SANIERT: 'modernisiert',
  RENOVIERT: 'modernisiert',
  NEUWERTIG: 'neuwertig',
  ERSTBEZUG: 'erstbezug',
}

function mapZustand(art: string): Zustand {
  return ZUSTAND_MAP[art] ?? 'gepflegt'
}

function mapObjektart(el: Element): Objektart {
  const objektart = el.querySelector('objektkategorie objektart')
  if (!objektart) return 'Wohnung'
  const haus = objektart.querySelector('haus')
  if (haus) {
    const typ = haus.getAttribute('haustyp') ?? ''
    if (typ === 'REIHENHAUS') return 'Reihenhaus'
    if (typ === 'MEHRFAMILIENHAUS') return 'Mehrfamilienhaus'
    return 'Haus'
  }
  const wohnung = objektart.querySelector('wohnung')
  if (wohnung) {
    const typ = wohnung.getAttribute('wohnungtyp') ?? ''
    if (typ === 'DACHGESCHOSS') return 'Dachgeschoss'
    return 'Wohnung'
  }
  return 'Wohnung'
}

/** Erweitert eine Unsplash-Basis-URL um Sizing-Parameter. */
export function sizedImage(url: string, w = 1200, q = 72): string {
  if (!url) return url
  if (url.includes('images.unsplash.com') && !url.includes('?')) {
    return `${url}?auto=format&fit=crop&w=${w}&q=${q}`
  }
  return url
}

function parseImmobilie(el: Element): Property {
  const kaufpreis = number(el, 'preise kaufpreis')
  const wohnflaeche = number(el, 'flaechen wohnflaeche')
  const zustandArt = el.querySelector('zustand_angaben zustand')?.getAttribute('zustand_art') ?? ''

  const marktwertRaw = userField(el, 'marktwert')
  const marktwert = marktwertRaw ? parseFloat(marktwertRaw) : Math.round(kaufpreis * 1.04)
  const potenzialRaw = userField(el, 'sanierungspotenzial')
  const sanierungspotenzial = potenzialRaw ? parseFloat(potenzialRaw) : 0.2

  const geo = el.querySelector('geo')
  const bilder = Array.from(el.querySelectorAll('anhaenge anhang daten pfad'))
    .map((n) => n.textContent?.trim() ?? '')
    .filter(Boolean)
    .map((u) => sizedImage(u))

  const ausstattungText = text(el, 'freitexte ausstatt_beschr')
  const ausstattung = ausstattungText
    ? ausstattungText.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
    : []

  const hausgeld = number(el, 'preise hausgeld')
  const nebenkosten = number(el, 'preise nebenkosten')

  return {
    id: userField(el, 'objektnr_intern') || text(el, 'verwaltung_techn objektnr_intern') || crypto.randomUUID(),
    titel: text(el, 'freitexte objekttitel') || 'Immobilie',
    objektart: mapObjektart(el),
    stadt: text(geo, 'ort'),
    stadtteil: text(geo, 'regionaler_zusatz'),
    bundesland: text(geo, 'bundesland'),
    plz: text(geo, 'plz'),
    kaufpreis,
    wohnflaeche,
    grundstueck: number(el, 'flaechen grundstuecksflaeche') || undefined,
    zimmer: number(el, 'flaechen anzahl_zimmer'),
    baujahr: number(el, 'zustand_angaben baujahr'),
    zustand: mapZustand(zustandArt),
    energieklasse: text(el, 'zustand_angaben energiepass wertklasse') || '—',
    hausgeldOderNebenkosten: hausgeld || nebenkosten,
    kaltmieteMarkt: number(el, 'preise kaltmiete'),
    lat: parseFloat(geo?.querySelector('geokoordinaten')?.getAttribute('breitengrad') ?? '0') || 0,
    lng: parseFloat(geo?.querySelector('geokoordinaten')?.getAttribute('laengengrad') ?? '0') || 0,
    bilder,
    beschreibung: text(el, 'freitexte objektbeschreibung'),
    ausstattung,
    marktwert,
    sanierungspotenzial,
  }
}

/** Parst einen OpenImmo-XML-String zu Properties. */
export function parseOpenImmo(xml: string): Property[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('OpenImmo-XML konnte nicht geparst werden.')
  }
  return Array.from(doc.querySelectorAll('immobilie')).map(parseImmobilie)
}

let cache: Property[] | null = null

/** Lädt und cached den Markt-Datensatz (kuratierte OpenImmo-Objekte + generierte). */
export async function ladeMarkt(): Promise<Property[]> {
  if (cache) return cache
  const res = await fetch(`${import.meta.env.BASE_URL}data/immobilien.xml`)
  if (!res.ok) throw new Error(`Marktdaten konnten nicht geladen werden (${res.status}).`)
  const xml = await res.text()
  const kuratiert = parseOpenImmo(xml)
  // Lazy-Import vermeidet Zyklus; generierte Objekte füllen den Markt auf 500+.
  const { generateMarkt } = await import('./generated')
  cache = [...kuratiert, ...generateMarkt()]
  return cache
}
