import type { Objektart, Property, Zustand } from './types'
import { sizedImage } from './openimmo'

// ---------------------------------------------------------------------------
// Prozeduraler Markt-Generator: 500+ realistische Objekte aus echten deutschen
// Städten mit marktnahen €/m²-Preisen. Deterministisch (seeded) — damit IDs und
// Angebote über Reloads stabil bleiben (wichtig für Kauf/Verkauf-Tracking).
// ---------------------------------------------------------------------------

interface StadtInfo {
  stadt: string
  bundesland: string
  preisM2: number // Kauf €/m²
  teile: string[]
  lat: number
  lng: number
}

const STAEDTE: StadtInfo[] = [
  { stadt: 'München', bundesland: 'Bayern', preisM2: 9400, teile: ['Sendling', 'Giesing', 'Schwabing', 'Neuhausen'], lat: 48.137, lng: 11.575 },
  { stadt: 'Frankfurt am Main', bundesland: 'Hessen', preisM2: 6400, teile: ['Bornheim', 'Bockenheim', 'Sachsenhausen', 'Nordend'], lat: 50.11, lng: 8.68 },
  { stadt: 'Hamburg', bundesland: 'Hamburg', preisM2: 6200, teile: ['Barmbek', 'Eimsbüttel', 'Altona', 'Wandsbek'], lat: 53.55, lng: 9.99 },
  { stadt: 'Berlin', bundesland: 'Berlin', preisM2: 5200, teile: ['Wedding', 'Neukölln', 'Prenzlauer Berg', 'Friedrichshain', 'Spandau'], lat: 52.52, lng: 13.405 },
  { stadt: 'Stuttgart', bundesland: 'Baden-Württemberg', preisM2: 5100, teile: ['Bad Cannstatt', 'Vaihingen', 'Feuerbach', 'West'], lat: 48.775, lng: 9.182 },
  { stadt: 'Köln', bundesland: 'Nordrhein-Westfalen', preisM2: 4700, teile: ['Ehrenfeld', 'Nippes', 'Sülz', 'Deutz'], lat: 50.937, lng: 6.96 },
  { stadt: 'Düsseldorf', bundesland: 'Nordrhein-Westfalen', preisM2: 4600, teile: ['Bilk', 'Oberkassel', 'Flingern', 'Gerresheim'], lat: 51.227, lng: 6.773 },
  { stadt: 'Freiburg', bundesland: 'Baden-Württemberg', preisM2: 5000, teile: ['Wiehre', 'Stühlinger', 'Herdern', 'Vauban'], lat: 47.999, lng: 7.842 },
  { stadt: 'Heidelberg', bundesland: 'Baden-Württemberg', preisM2: 4900, teile: ['Neuenheim', 'Handschuhsheim', 'Bergheim', 'Weststadt'], lat: 49.399, lng: 8.672 },
  { stadt: 'Mainz', bundesland: 'Rheinland-Pfalz', preisM2: 4400, teile: ['Neustadt', 'Altstadt', 'Gonsenheim', 'Bretzenheim'], lat: 49.992, lng: 8.247 },
  { stadt: 'Nürnberg', bundesland: 'Bayern', preisM2: 3800, teile: ['Gostenhof', 'St. Johannis', 'Wöhrd', 'Südstadt'], lat: 49.452, lng: 11.077 },
  { stadt: 'Bonn', bundesland: 'Nordrhein-Westfalen', preisM2: 4300, teile: ['Poppelsdorf', 'Endenich', 'Beuel', 'Südstadt'], lat: 50.735, lng: 7.1 },
  { stadt: 'Münster', bundesland: 'Nordrhein-Westfalen', preisM2: 4100, teile: ['Kreuzviertel', 'Hansaviertel', 'Gievenbeck', 'Mauritz'], lat: 51.96, lng: 7.626 },
  { stadt: 'Regensburg', bundesland: 'Bayern', preisM2: 4400, teile: ['Innenstadt', 'Kumpfmühl', 'Stadtamhof', 'Kasernenviertel'], lat: 49.013, lng: 12.101 },
  { stadt: 'Karlsruhe', bundesland: 'Baden-Württemberg', preisM2: 4200, teile: ['Südstadt', 'Weststadt', 'Durlach', 'Mühlburg'], lat: 49.007, lng: 8.404 },
  { stadt: 'Augsburg', bundesland: 'Bayern', preisM2: 4100, teile: ['Lechhausen', 'Pfersee', 'Göggingen', 'Innenstadt'], lat: 48.371, lng: 10.898 },
  { stadt: 'Leipzig', bundesland: 'Sachsen', preisM2: 3100, teile: ['Plagwitz', 'Connewitz', 'Südvorstadt', 'Gohlis'], lat: 51.34, lng: 12.375 },
  { stadt: 'Dresden', bundesland: 'Sachsen', preisM2: 3000, teile: ['Neustadt', 'Striesen', 'Löbtau', 'Pieschen'], lat: 51.05, lng: 13.738 },
  { stadt: 'Hannover', bundesland: 'Niedersachsen', preisM2: 3500, teile: ['List', 'Linden', 'Südstadt', 'Nordstadt'], lat: 52.375, lng: 9.732 },
  { stadt: 'Bremen', bundesland: 'Bremen', preisM2: 3200, teile: ['Findorff', 'Neustadt', 'Schwachhausen', 'Walle'], lat: 53.079, lng: 8.801 },
  { stadt: 'Dortmund', bundesland: 'Nordrhein-Westfalen', preisM2: 2700, teile: ['Kreuzviertel', 'Hörde', 'Aplerbeck', 'Kaiserviertel'], lat: 51.514, lng: 7.466 },
  { stadt: 'Essen', bundesland: 'Nordrhein-Westfalen', preisM2: 2700, teile: ['Rüttenscheid', 'Frohnhausen', 'Werden', 'Holsterhausen'], lat: 51.456, lng: 7.012 },
  { stadt: 'Kiel', bundesland: 'Schleswig-Holstein', preisM2: 3100, teile: ['Ravensberg', 'Gaarden', 'Düsternbrook', 'Wik'], lat: 54.323, lng: 10.139 },
  { stadt: 'Rostock', bundesland: 'Mecklenburg-Vorpommern', preisM2: 3200, teile: ['Kröpeliner-Tor-Vorstadt', 'Warnemünde', 'Stadtmitte', 'Reutershagen'], lat: 54.092, lng: 12.099 },
  { stadt: 'Erfurt', bundesland: 'Thüringen', preisM2: 2900, teile: ['Altstadt', 'Krämpfervorstadt', 'Andreasvorstadt', 'Löbervorstadt'], lat: 50.978, lng: 11.029 },
  { stadt: 'Wuppertal', bundesland: 'Nordrhein-Westfalen', preisM2: 2400, teile: ['Elberfeld', 'Barmen', 'Vohwinkel', 'Cronenberg'], lat: 51.256, lng: 7.15 },
]

const AUSSEN = [
  '1568605114967-8130f3a36994', '1570129477492-45c003edd2be', '1512917774080-9991f1c4c750',
  '1600585154340-be6161a56a0c', '1600596542815-ffad4c1539a9', '1600607687939-ce8a6c25118c',
  '1600566753086-00f18fb6b3ea', '1580587771525-78b9dba3b914', '1564013799919-ab600027ffc6',
  '1583608205776-bfd35f0d9f83', '1512918728675-ed5a9ecdebfd', '1449844908441-8829872d2607',
  '1554995207-c18c203602cb', '1600585154526-990dced4db0d',
]
const INNEN = [
  '1522708323590-d24dbb6b0267', '1524758631624-e2822e304c36', '1493809842364-78817add7ffb',
  '1502672260266-1c1ef2d93688', '1560185007-cde436f6a4d0', '1600607687920-4e2a09cf159d',
  '1600047509807-ba8f99d2cdde', '1560448204-e02f11c3d0e2', '1616486338812-3dadae4b4ace',
  '1616594039964-ae9021a400a0', '1615529182904-14819c35db37', '1586023492125-27b2c045efd7',
]
const KUECHE = ['1556911220-bff31c812dba', '1584622650111-993a426fbf0a', '1600489000022-c2086d79f9d4', '1616137466211-f939a420be84', '1600210491369-e753d80a41f3', '1502005229762-cf1b2da7c5d6']
const BAD = ['1620626011761-996317b8d101', '1617806118233-18e1de247200', '1631679706909-1844bbd07221', '1600566752355-35792bedcfea', '1600121848594-d8644e57abab']
const SCHLAF = ['1505691938895-1758d7feb511', '1522771739844-6a9f6d5f14af', '1513694203232-719a280e022f', '1533779283484-8ad4940aa3a8', '1598928506311-c55ded91a20c', '1567767292278-a4f21aa2d36e', '1552321554-5fefe8c9ef14', '1502005097973-6a7082348e28', '1484154218962-a197022b5858']

const AUSSTATTUNG_POOL = ['Balkon', 'Einbauküche', 'Keller', 'Aufzug', 'Stellplatz', 'Garten', 'Gäste-WC', 'Fußbodenheizung', 'Terrasse', 'Kamin', 'Tageslichtbad', 'Abstellraum', 'Loggia', 'Dachterrasse']

// Deterministischer PRNG (mulberry32)
function prng(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const OBJEKTARTEN: { art: Objektart; gewicht: number }[] = [
  { art: 'Wohnung', gewicht: 58 },
  { art: 'Haus', gewicht: 14 },
  { art: 'Reihenhaus', gewicht: 12 },
  { art: 'Dachgeschoss', gewicht: 9 },
  { art: 'Mehrfamilienhaus', gewicht: 7 },
]

function waehleObjektart(r: number): Objektart {
  let x = r * 100
  for (const o of OBJEKTARTEN) {
    if (x < o.gewicht) return o.art
    x -= o.gewicht
  }
  return 'Wohnung'
}

function istHaus(a: Objektart) {
  return a === 'Haus' || a === 'Reihenhaus' || a === 'Mehrfamilienhaus'
}

function zustandVon(baujahr: number, r: number): Zustand {
  if (baujahr >= 2021) return 'erstbezug'
  if (baujahr >= 2012) return r < 0.7 ? 'neuwertig' : 'modernisiert'
  if (baujahr >= 1995) return r < 0.5 ? 'modernisiert' : 'gepflegt'
  if (baujahr >= 1970) return r < 0.4 ? 'gepflegt' : r < 0.75 ? 'renovierungsbedürftig' : 'modernisiert'
  return r < 0.45 ? 'sanierungsbedürftig' : r < 0.8 ? 'renovierungsbedürftig' : 'gepflegt'
}

function potenzialVon(z: Zustand): number {
  switch (z) {
    case 'sanierungsbedürftig':
      return 0.48
    case 'renovierungsbedürftig':
      return 0.36
    case 'gepflegt':
      return 0.18
    case 'modernisiert':
      return 0.1
    default:
      return 0.05
  }
}

function energieVon(baujahr: number, z: Zustand): string {
  if (z === 'erstbezug' || baujahr >= 2021) return 'A'
  if (z === 'neuwertig') return 'B'
  if (z === 'modernisiert') return 'C'
  if (baujahr >= 1995) return 'D'
  if (baujahr >= 1975) return 'E'
  if (z === 'sanierungsbedürftig') return 'H'
  return 'G'
}

function bilderFuer(art: Objektart, rnd: () => number): string[] {
  const pick = (arr: string[]) => arr[Math.floor(rnd() * arr.length)]
  const cover = istHaus(art) ? pick(AUSSEN) : pick(INNEN)
  const roh = [cover, pick(INNEN), pick(KUECHE), rnd() < 0.5 ? pick(BAD) : pick(SCHLAF)]
  return roh.map((id) => sizedImage(`https://images.unsplash.com/photo-${id}`))
}

function rundeAuf(v: number, step: number) {
  return Math.round(v / step) * step
}

function einObjekt(i: number): Property {
  const rnd = prng(1000 + i * 2654435761)
  const info = STAEDTE[i % STAEDTE.length]
  const objektart = waehleObjektart(rnd())
  const teil = info.teile[Math.floor(rnd() * info.teile.length)]

  const flaeche = istHaus(objektart)
    ? Math.round(95 + rnd() * 130) // 95–225
    : objektart === 'Dachgeschoss'
      ? Math.round(55 + rnd() * 70)
      : Math.round(38 + rnd() * 95) // 38–133

  const zimmer = Math.max(1, Math.round((flaeche / 26) * 2) / 2)
  const baujahr = Math.floor(1900 + Math.pow(rnd(), 0.6) * 124) // Richtung neuer gewichtet
  const zustand = zustandVon(baujahr, rnd())

  const lageFaktor = 0.85 + rnd() * 0.4 // Stadtteil/Zustand-Streuung
  const zustandsFaktor = zustand === 'sanierungsbedürftig' ? 0.82 : zustand === 'renovierungsbedürftig' ? 0.9 : zustand === 'erstbezug' ? 1.12 : 1
  const preisM2 = info.preisM2 * lageFaktor * zustandsFaktor
  const kaufpreis = Math.max(90000, rundeAuf(flaeche * preisM2, 1000))
  const marktwert = rundeAuf(kaufpreis * (0.97 + rnd() * 0.09), 1000)
  const mieteM2 = (info.preisM2 / 385) * (0.9 + rnd() * 0.3)
  const kaltmiete = rundeAuf(flaeche * mieteM2, 10)
  const nk = Math.round(flaeche * (2.4 + rnd() * 1.8))

  const ausstattung = [...AUSSTATTUNG_POOL].sort(() => rnd() - 0.5).slice(0, 3 + Math.floor(rnd() * 3))

  return {
    id: `gen-${i}`,
    titel: `${zimmer.toLocaleString('de-DE')}-Zimmer-${objektart} in ${info.stadt}-${teil}`,
    objektart,
    stadt: info.stadt,
    stadtteil: teil,
    bundesland: info.bundesland,
    plz: '',
    kaufpreis,
    wohnflaeche: flaeche,
    grundstueck: istHaus(objektart) ? Math.round(flaeche * (1.3 + rnd() * 1.6)) : undefined,
    zimmer,
    baujahr,
    zustand,
    energieklasse: energieVon(baujahr, zustand),
    hausgeldOderNebenkosten: nk,
    kaltmieteMarkt: kaltmiete,
    lat: info.lat,
    lng: info.lng,
    bilder: bilderFuer(objektart, rnd),
    beschreibung: `${objektart} in ${teil} (${info.stadt}). Baujahr ${baujahr}, Zustand: ${zustand}. ${
      potenzialVon(zustand) > 0.3 ? 'Deutliches Aufwertungspotenzial durch Sanierung.' : 'Gepflegtes Objekt in gefragter Lage.'
    }`,
    ausstattung,
    marktwert,
    sanierungspotenzial: potenzialVon(zustand),
  }
}

let cache: Property[] | null = null

/** Liefert die (deterministisch) generierten Marktobjekte. */
export function generateMarkt(anzahl = 512): Property[] {
  if (cache) return cache
  cache = Array.from({ length: anzahl }, (_, i) => einObjekt(i))
  return cache
}
