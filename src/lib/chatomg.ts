// Chat OMG — offline KI-Assistent. Antwortet aus dem Spielstand heraus.
// (Später ggf. auf Live-KI umstellbar — siehe Erinnerungsliste.)
import {
  gesamtVermoegen,
  monatlicheMiete,
  monatlicheRaten,
  nettoVermoegen,
  portfolioWert,
  schulden,
  sparGuthaben,
  useGame,
} from '../state/game'
import { depotWert } from '../data/assets'
import { ASSETS, assetPreis, assetVeraenderung } from '../data/assets'
import { GRUNDERWERBSTEUER } from '../lib/finanzen'
import { euro, pct } from '../lib/format'

const BUNDESLAENDER = Object.keys(GRUNDERWERBSTEUER)

/** Beantwortet eine Frage offline aus dem aktuellen Spielstand. */
export function chatOmgAntwort(frageRoh: string): string {
  const f = frageRoh.toLowerCase()
  const g = useGame.getState()
  const { cash, owned, depot, monthIndex, tagesgeld, festgeld } = g

  const hat = (...w: string[]) => w.some((x) => f.includes(x))

  // Begrüßung / Identität
  if (hat('hallo', 'hi', 'hey', 'moin', 'guten tag'))
    return 'Hey! Ich bin Chat OMG, dein Assistent. Frag mich nach deinem Vermögen, ob sich ein Kauf lohnt, nach Steuern, Krediten oder der Börse. 🤖'
  if (hat('wer bist du', 'was kannst du', 'hilfe'))
    return 'Ich helfe dir beim Immobilien-Investieren: Vermögen & Cashflow checken, Grunderwerbsteuer & Kaufnebenkosten erklären, Finanzierung, Sparen und Börse. Frag einfach drauflos.'

  // Vermögen
  if (hat('vermögen', 'reich', 'wie viel hab', 'wie viel habe', 'net worth', 'wert')) {
    const spar = sparGuthaben(tagesgeld, festgeld)
    const gv = gesamtVermoegen(cash, owned, depot, monthIndex, spar)
    const teile = [
      `Liquidität ${euro(cash)}`,
      `Immobilien ${euro(portfolioWert(owned))}`,
      schulden(owned) > 0 ? `− Schulden ${euro(schulden(owned))}` : null,
      depotWert(depot, monthIndex) > 0 ? `Depot ${euro(depotWert(depot, monthIndex))}` : null,
      spar > 0 ? `Sparen ${euro(spar)}` : null,
    ].filter(Boolean)
    return `Dein Gesamtvermögen liegt bei ${euro(gv)}. Zusammensetzung: ${teile.join(', ')}.`
  }

  // Liquidität
  if (hat('liquidität', 'cash', 'kontostand', 'bargeld', 'wie viel geld'))
    return `Auf dem Girokonto hast du ${euro(cash)}${tagesgeld > 0 ? `, dazu ${euro(tagesgeld)} Tagesgeld` : ''}. Netto insgesamt ${euro(nettoVermoegen(cash, owned))} (ohne Depot/Sparen).`

  // Schulden / Kredit
  if (hat('schulden', 'kredit', 'darlehen', 'rate'))
    return owned.some((o) => o.restschuld > 0)
      ? `Deine Restschulden betragen ${euro(schulden(owned))}, die monatlichen Kreditraten ${euro(monatlicheRaten(owned))}. Tipp: mehr Eigenkapital senkt den Zins.`
      : 'Du hast aktuell keine laufenden Kredite. Finanzierungen schließt du direkt beim Kauf ab — mehr Eigenkapital oder ein höheres Zinsangebot erhöhen die Genehmigungschance.'

  // Miete
  if (hat('miete', 'mieteinnahmen', 'cashflow'))
    return `Deine Mieteinnahmen betragen ${euro(monatlicheMiete(owned))}/Monat, die Kreditraten ${euro(monatlicheRaten(owned))}/Monat. Vermieten läuft über ImmoProud: dort inserierst du dein Objekt (kostet Gebühr) und Anfragen treffen mit der Zeit ein.`

  // Grunderwerbsteuer
  if (hat('grunderwerbsteuer', 'grest')) {
    const land = BUNDESLAENDER.find((b) => f.includes(b.toLowerCase()))
    if (land) return `Die Grunderwerbsteuer in ${land} beträgt ${pct(GRUNDERWERBSTEUER[land] * 100)}. Sie fällt beim Kauf auf den Kaufpreis an.`
    return 'Die Grunderwerbsteuer variiert je Bundesland zwischen 3,5 % (Bayern) und 6,5 % (z. B. NRW, Brandenburg). Nenn mir ein Bundesland für den genauen Satz — oder schau in den Ratgeber „ImmoWissen" bei Giggle.'
  }

  // Kaufnebenkosten
  if (hat('nebenkosten', 'kaufnebenkosten', 'notar', 'makler'))
    return 'Kaufnebenkosten = Grunderwerbsteuer (3,5–6,5 %) + Notar (~1,5 %) + Grundbuch (~0,5 %) + ggf. Makler (~3,57 %). Zusammen oft 8–12 % des Kaufpreises. Plane sie als Eigenkapital ein.'

  // Spekulationssteuer
  if (hat('spekulationssteuer', 'steuer', 'verkauf', 'flip'))
    return 'Verkaufst du eine Immobilie innerhalb von 10 Jahren mit Gewinn, fällt Spekulationssteuer auf den Gewinn an (mit deinem persönlichen Steuersatz). Nach 10 Jahren Haltedauer ist der Gewinn steuerfrei.'

  // Börse
  if (hat('aktie', 'börse', 'kurs', 'investier', 'krypto', 'etf')) {
    const sortiert = [...ASSETS].sort((a, b) => assetVeraenderung(b, monthIndex) - assetVeraenderung(a, monthIndex))
    const top = sortiert[0]
    const flop = sortiert[sortiert.length - 1]
    return `Aktuell top: ${top.name} (${top.kuerzel}) ${assetVeraenderung(top, monthIndex) >= 0 ? '+' : ''}${assetVeraenderung(top, monthIndex).toFixed(1)} % bei ${euro(assetPreis(top, monthIndex))}. Schwächster: ${flop.name} (${assetVeraenderung(flop, monthIndex).toFixed(1)} %). Denk dran: Kurse schwanken — Krypto besonders stark.`
  }

  // Sparen
  if (hat('sparen', 'tagesgeld', 'festgeld', 'zins'))
    return 'Tagesgeld bringt 3,0 % p. a. und ist täglich verfügbar. Festgeld gibt es mit 6/12/24 Monaten Laufzeit zu 3,5/4,0/4,5 % — dafür ist das Geld gebunden. Beides ist sicher, aber bringt weniger als gute Immobilien oder die Börse.'

  // Renovieren
  if (hat('renovier', 'sanier', 'bauträger'))
    return 'Renovieren steigert den Wert. Beauftrage den Bauträger über die Bauträger-App und verhandle Preis und Tempo. Gut verhandelt = bessere Konditionen. Danach kannst du teurer verkaufen oder höhere Miete verlangen.'

  // Objekt-Bewertung generisch
  if (hat('lohnt', 'guter deal', 'kaufen', 'gutes objekt', 'empfehl'))
    return 'Ob sich ein Objekt lohnt, hängt von Kaufpreis vs. Marktwert, der Mietrendite und dem Sanierungspotenzial ab. Öffne das Objekt und recherchiere es bei Giggle auf „ImmoScout24" — dann bekommst du die genaue Deal-Einschätzung freigeschaltet.'

  // Fallback
  return 'Gute Frage! Ich kann dir bei Vermögen, Cashflow, Krediten, Steuern (Grunderwerb-/Spekulationssteuer), Sparen und der Börse weiterhelfen. Für Objekt-Details recherchier am besten bei Giggle. Frag mich ruhig konkreter.'
}
