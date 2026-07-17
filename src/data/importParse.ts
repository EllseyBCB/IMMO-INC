import type { Objektart, Property, Zustand } from './types'
import { sizedImage } from './openimmo'

export const PARSE_LISTING_URL =
  'https://mpvosmtsbvwasvnzjuwd.supabase.co/functions/v1/ai-parse-listing'

const ZUSTAND_NORM: Record<string, Zustand> = {
  sanierungsbeduerftig: 'sanierungsbedürftig',
  'sanierungsbedürftig': 'sanierungsbedürftig',
  renovierungsbeduerftig: 'renovierungsbedürftig',
  'renovierungsbedürftig': 'renovierungsbedürftig',
  gepflegt: 'gepflegt',
  modernisiert: 'modernisiert',
  saniert: 'modernisiert',
  neuwertig: 'neuwertig',
  erstbezug: 'erstbezug',
}

const OBJEKTART_ERLAUBT: Objektart[] = ['Wohnung', 'Haus', 'Reihenhaus', 'Mehrfamilienhaus', 'Dachgeschoss']

const REPRAESENTATIV_INNEN = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0',
]
const FOTO_KUECHE = 'https://images.unsplash.com/photo-1556911220-bff31c812dba'
const FOTO_BAD = 'https://images.unsplash.com/photo-1620626011761-996317b8d101'
const FOTO_AUSSEN = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd',
]

/** Repräsentative Fotos je Objektart, wenn das Inserat keine Bilder mitliefert. */
function fallbackBilder(objektart: Objektart, seed: number): string[] {
  const istHaus = objektart === 'Haus' || objektart === 'Reihenhaus' || objektart === 'Mehrfamilienhaus'
  const aussen = FOTO_AUSSEN[seed % FOTO_AUSSEN.length]
  const innen = REPRAESENTATIV_INNEN[seed % REPRAESENTATIV_INNEN.length]
  const roh = istHaus ? [aussen, innen, FOTO_KUECHE, FOTO_BAD] : [innen, FOTO_KUECHE, FOTO_BAD]
  return roh.map((u) => sizedImage(u))
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^\d.,-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

/** Baut aus dem (KI-)Rohobjekt eine vollständige, spielbare Property. */
export function zuProperty(roh: Record<string, unknown>, bilderUrls: string[] = []): Property {
  const objektartRaw = String(roh.objektart ?? 'Wohnung')
  const objektart = (OBJEKTART_ERLAUBT.includes(objektartRaw as Objektart) ? objektartRaw : 'Wohnung') as Objektart
  const zustand = ZUSTAND_NORM[String(roh.zustand ?? '').toLowerCase()] ?? 'gepflegt'
  const kaufpreis = num(roh.kaufpreis)
  const seed = Math.max(1, Math.round(kaufpreis + num(roh.wohnflaeche)))
  const eigeneBilder = bilderUrls.map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u)).map((u) => sizedImage(u))

  return {
    id: `custom-${seed}-${Math.round(num(roh.wohnflaeche))}${objektart[0]}`,
    titel: String(roh.titel || 'Importiertes Inserat'),
    objektart,
    stadt: String(roh.stadt || 'Unbekannt'),
    stadtteil: String(roh.stadtteil || ''),
    bundesland: String(roh.bundesland || ''),
    plz: String(roh.plz || ''),
    kaufpreis,
    wohnflaeche: num(roh.wohnflaeche),
    grundstueck: roh.grundstueck ? num(roh.grundstueck) : undefined,
    zimmer: num(roh.zimmer, 1),
    baujahr: num(roh.baujahr, 1990),
    zustand,
    energieklasse: String(roh.energieklasse || '—'),
    hausgeldOderNebenkosten: num(roh.hausgeldOderNebenkosten, Math.round(num(roh.wohnflaeche) * 3)),
    kaltmieteMarkt: num(roh.kaltmieteMarkt, Math.round(kaufpreis * 0.0035)),
    lat: 0,
    lng: 0,
    bilder: eigeneBilder.length ? eigeneBilder : fallbackBilder(objektart, seed),
    beschreibung: String(roh.beschreibung || ''),
    ausstattung: Array.isArray(roh.ausstattung) ? roh.ausstattung.map(String) : [],
    marktwert: num(roh.marktwert, Math.round(kaufpreis * 1.02)),
    sanierungspotenzial: Math.max(0, Math.min(1, num(roh.sanierungspotenzial, 0.2))),
  }
}

export interface ParseErgebnis {
  objekt: Property | null
  fehler?: string
}

/** Schickt den Inserat-Text an die KI-Edge-Function und liefert eine Property. */
export async function parseInserat(text: string, bilderUrls: string[] = []): Promise<ParseErgebnis> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    const res = await fetch(PARSE_LISTING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ text }),
    })
    clearTimeout(timeout)
    if (!res.ok) return { objekt: null, fehler: `Server-Fehler (${res.status})` }
    const data = await res.json()
    if (!data?.objekt) return { objekt: null, fehler: data?.error === 'missing_key' ? 'KI nicht konfiguriert' : 'Konnte das Inserat nicht auswerten' }
    return { objekt: zuProperty(data.objekt as Record<string, unknown>, bilderUrls) }
  } catch (e) {
    return { objekt: null, fehler: e instanceof Error && e.name === 'AbortError' ? 'Zeitüberschreitung' : 'Netzwerkfehler' }
  }
}
