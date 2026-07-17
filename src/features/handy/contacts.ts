export interface Contact {
  id: string
  name: string
  role: string
  emoji: string
  farbe: string // tailwind gradient
  persona: string
  begruessung: string
  vorschlaege: string[]
}

export const CONTACTS: Contact[] = [
  {
    id: 'makler',
    name: 'Sabine Kern',
    role: 'Immobilienmaklerin bei IMMO INC',
    emoji: '🏘️',
    farbe: 'from-blue-400 to-blue-600',
    persona:
      'Freundlich, verkaufsorientiert, gut vernetzt. Kennt jedes Objekt am Markt, redet Preise gern schön, ist aber ehrlich zu Chancen und Risiken. Bietet Besichtigungen und Tipps an.',
    begruessung:
      'Hallo! Schön, von dir zu hören. Suchst du ein bestimmtes Objekt, oder soll ich dir was mit Potenzial raussuchen?',
    vorschlaege: [
      'Welches Objekt hat gerade die beste Marge?',
      'Kannst du beim Preis noch etwas machen?',
      'Ich suche etwas zum Vermieten unter 300.000 €.',
    ],
  },
  {
    id: 'bank',
    name: 'Dr. Weber',
    role: 'Kreditberater deiner Hausbank',
    emoji: '🏦',
    farbe: 'from-violet-400 to-violet-600',
    persona:
      'Seriös, vorsichtig, zahlenorientiert. Achtet auf Bonität, Eigenkapital und Beleihung. Nennt konkrete Zinsen/Bedingungen und lehnt auch mal ab, wenn die Zahlen nicht passen.',
    begruessung:
      'Guten Tag. Gerne bespreche ich Ihre Finanzierung. Um welche Summe und welches Objekt geht es?',
    vorschlaege: [
      'Welchen Zins bekomme ich aktuell?',
      'Wie viel Kredit würden Sie mir geben?',
      'Kann ich eine Sondertilgung vereinbaren?',
    ],
  },
  {
    id: 'bautraeger',
    name: 'Baris Yılmaz',
    role: 'Bauträger & Sanierungsprofi',
    emoji: '🛠️',
    farbe: 'from-orange-400 to-orange-600',
    persona:
      'Bodenständig, direkt, praxisnah. Schätzt Aufwand und Kosten realistisch, warnt vor versteckten Mängeln, gibt Empfehlungen welche Gewerke sich lohnen. Redet wie ein Handwerker.',
    begruessung:
      'Servus! Was steht an — Küche, Bad, Komplettsanierung? Sag mir das Objekt, dann schätz ich dir das grob.',
    vorschlaege: [
      'Was lohnt sich bei einem Altbau am meisten?',
      'Wie lange dauert eine Badsanierung?',
      'Womit hole ich am meisten Wertsteigerung raus?',
    ],
  },
  {
    id: 'verwaltung',
    name: 'Hausverwaltung Nord',
    role: 'Verwaltung & Mietersuche',
    emoji: '🔑',
    farbe: 'from-emerald-400 to-emerald-600',
    persona:
      'Organisiert, sachlich, erfahren mit Mietern. Hilft beim Inserieren, Besichtigungen, Mieterauswahl und warnt vor Risiken (Mietausfall, schwierige Mieter). Denkt in Rendite und Sicherheit.',
    begruessung:
      'Hallo! Möchten Sie ein Objekt vermieten oder haben Sie Fragen zu Mietern und Verwaltung?',
    vorschlaege: [
      'Wie finde ich sichere Mieter?',
      'Was kann ich für die Wohnung an Miete verlangen?',
      'Lohnt sich ein Mieter mit höherem Risiko?',
    ],
  },
]

export function getContact(id: string): Contact | undefined {
  return CONTACTS.find((c) => c.id === id)
}

// ---------------------------------------------------------------------------
// Lokale Fallback-Antwort-Engine — greift, wenn die KI-Edge-Function (noch)
// nicht erreichbar ist. Kontextbezogen & variiert, damit es sofort spielbar ist.
// ---------------------------------------------------------------------------

export interface FallbackContext {
  liquiditaet: number
  objekte: number
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

export function lokaleAntwort(contactId: string, message: string, ctx: FallbackContext): string {
  const m = message.toLowerCase()
  const seed = message.length + (message.charCodeAt(0) || 0)
  const euro = (n: number) => `${Math.round(n).toLocaleString('de-DE')} €`

  const enthaelt = (...keys: string[]) => keys.some((k) => m.includes(k))

  if (contactId === 'makler') {
    if (enthaelt('preis', 'runter', 'handeln', 'verhandeln', 'rabatt'))
      return pick(
        [
          'Beim Preis ist meist 3–5 % drin, wenn du schnell und ohne Finanzierungsvorbehalt zusagst. Bei den sanierungsbedürftigen Objekten sogar mehr — die Verkäufer wollen die weghaben.',
          'Ich frag mal beim Eigentümer. Ehrlich: bei den gepflegten Objekten ist wenig Spielraum, bei den Altbauten kannst du pokern.',
        ],
        seed,
      )
    if (enthaelt('marge', 'potenzial', 'flip', 'gewinn', 'beste'))
      return 'Die unsanierten Altbauten in Leipzig und Dresden haben die dickste Marge — günstiger Einstieg, viel Aufwertungshebel. Riskanter, aber da holst du am meisten raus.'
    if (enthaelt('vermiet', 'miete', 'rendite'))
      return 'Fürs Vermieten würde ich Essen oder Dortmund empfehlen — solide Rendite, faire Preise. Weniger Glamour, aber verlässlicher Cashflow.'
    if (enthaelt('besichtig', 'termin'))
      return 'Klar, ich mach dir gern einen Besichtigungstermin. Sag mir welches Objekt, dann koordiniere ich mit dem Eigentümer.'
    return pick(
      [
        'Gute Frage! Sag mir, ob du eher flippen oder vermieten willst — dann hab ich passende Objekte für dich.',
        `Mit deiner Liquidität von ${euro(ctx.liquiditaet)} hast du einige Optionen. Willst du günstig einsteigen oder was Gepflegtes?`,
      ],
      seed,
    )
  }

  if (contactId === 'bank') {
    if (enthaelt('zins'))
      return 'Ihr Zins richtet sich nach Bonität und Beleihung — aktuell liegen wir grob zwischen 3,1 % und 5,2 %. Je mehr Eigenkapital, desto besser die Kondition.'
    if (enthaelt('wie viel', 'summe', 'rahmen', 'maximal', 'kredit'))
      return `Das hängt von Ihrem tragbaren Monatsbetrag ab (ca. 40 % des Nettoeinkommens minus laufende Raten). Mit ${euro(ctx.liquiditaet)} Eigenkapital lässt sich ein ordentlicher Rahmen darstellen. Details sehen Sie im Kreditrechner.`
    if (enthaelt('sondertilgung', 'tilgung'))
      return 'Eine Sondertilgung von bis zu 5 % p. a. können wir vereinbaren — das verkürzt die Laufzeit spürbar. Empfehle ich, wenn Sie flippen wollen.'
    if (enthaelt('ablehn', 'bekomme ich', 'geht das'))
      return 'Grundsätzlich machbar, sofern die Rate tragbar bleibt und genug Eigenkapital für die Kaufnebenkosten da ist. Die finanzieren wir nämlich nicht mit.'
    return 'Gerne. Nennen Sie mir Objekt und gewünschte Darlehenssumme, dann prüfe ich Ihre Konditionen.'
  }

  if (contactId === 'bautraeger') {
    if (enthaelt('altbau', 'lohnt', 'wertsteigerung', 'meisten'))
      return pick(
        [
          'Beim Altbau: Bad und Küche zuerst, dann Böden und Wände. Energetisch lohnt sich bei den alten Kisten fast immer — neue Fenster und Heizung heben den Wert und die Energieklasse ordentlich.',
          'Ganz klar Bad und Küche — das sieht der Käufer zuerst. Grundriss öffnen bringt bei den alten Wohnungen auch viel, wenn die Statik mitspielt.',
        ],
        seed,
      )
    if (enthaelt('bad', 'dauer', 'lange', 'zeit'))
      return 'Eine Badsanierung dauert bei mir gut einen Monat, Küche ähnlich. Energetisch mit Fenstern und Heizung solltest du zwei bis drei Monate einplanen.'
    if (enthaelt('kosten', 'preis', 'teuer'))
      return 'Grobe Hausnummer: Bad und Küche je rund 200 €/m², Böden 75 €/m², energetisch das Doppelte. In Luxus-Qualität kannst du das mal 2,5 nehmen.'
    if (enthaelt('mangel', 'schaden', 'risiko', 'feucht', 'schimmel'))
      return 'Pass bei den Altbauten auf Feuchtigkeit und alte Elektrik auf — das sind die typischen versteckten Kostentreiber. Lass mich vorher draufschauen.'
    return 'Sag mir welches Objekt und was du vorhast, dann schätz ich dir Kosten und Bauzeit. Faustregel: das Sichtbare zuerst — Bad, Küche, Böden.'
  }

  // verwaltung
  if (enthaelt('sicher', 'gute mieter', 'auswahl', 'bonität'))
    return 'Sichere Mieter erkennt man an Schufa, Gehaltsnachweis und Bürgschaft. Die zahlen zuverlässig, akzeptieren aber selten die Höchstmiete. Sicherheit kostet ein bisschen Rendite.'
  if (enthaelt('miete', 'verlangen', 'höhe', 'wie viel'))
    return 'Orientieren Sie sich am Mietspiegel des Objekts. Nach einer Sanierung sind 10–20 % Aufschlag realistisch. Ich inseriere das gern für Sie.'
  if (enthaelt('risiko', 'lohnt', 'höher'))
    return 'Ein Mieter mit höherem Risikoprofil zahlt oft mehr Miete — dafür steigt die Gefahr von Zahlungsausfall oder Schäden. Kann sich lohnen, ist aber Glückssache. Streuen Sie das Risiko.'
  if (enthaelt('inserier', 'anzeige', 'vermiet'))
    return 'Schicken Sie mir das Objekt, ich stelle eine Anzeige online. Erfahrungsgemäß kommen die ersten Anfragen innerhalb weniger Tage.'
  return 'Gerne helfe ich bei Vermietung und Verwaltung. Möchten Sie inserieren, oder geht es um die Mieterauswahl?'
}
