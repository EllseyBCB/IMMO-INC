export type Zustand =
  | 'sanierungsbedürftig'
  | 'renovierungsbedürftig'
  | 'gepflegt'
  | 'modernisiert'
  | 'neuwertig'
  | 'erstbezug'

export type Objektart = 'Wohnung' | 'Haus' | 'Reihenhaus' | 'Mehrfamilienhaus' | 'Dachgeschoss'

export interface Property {
  id: string
  titel: string
  objektart: Objektart
  stadt: string
  stadtteil: string
  bundesland: string
  plz: string
  kaufpreis: number
  wohnflaeche: number
  grundstueck?: number
  zimmer: number
  baujahr: number
  zustand: Zustand
  energieklasse: string
  hausgeldOderNebenkosten: number // € / Monat laufend
  kaltmieteMarkt: number // erzielbare Marktmiete kalt € / Monat
  lat: number
  lng: number
  bilder: string[] // vollständige Bild-URLs
  beschreibung: string
  ausstattung: string[]
  /** Interne Marktschätzung (fairer Verkehrswert) — leicht abweichend vom Angebotspreis. */
  marktwert: number
  /** Wieviel Wertsteigerungspotenzial durch Sanierung noch im Objekt steckt (0..1). */
  sanierungspotenzial: number
}

export type RenovationScope =
  | 'kueche'
  | 'bad'
  | 'boden'
  | 'waende'
  | 'fassade'
  | 'energetisch'
  | 'grundriss'
  | 'smarthome'

export type Qualitaet = 'standard' | 'gehoben' | 'luxus'
