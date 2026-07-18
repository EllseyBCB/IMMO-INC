// Eigenes In-Game-Internet: Fake-Websites + Giggle-Suchindex.
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Property } from './types'
import { GRUNDERWERBSTEUER } from '../lib/finanzen'
import { ASSETS, aktuelleNews, assetPreis, assetVeraenderung } from './assets'
import { euro, pct, area } from '../lib/format'
import { mietrendite } from '../features/markt/propertyUtil'
import { useGame } from '../state/game'
import type { AppId, PhoneNav } from '../features/phone/nav'

export type GigglePage =
  | { typ: 'artikel'; id: string }
  | { typ: 'immoscout'; id?: string; q?: string }
  | { typ: 'boersenblick' }
  | { typ: 'stadtwiki'; stadt: string }
  | { typ: 'service'; id: string }

export interface WebResult {
  titel: string
  url: string
  snippet: string
  page: GigglePage
}

interface Artikel {
  id: string
  titel: string
  url: string
  keywords: string[]
  snippet: string
  Body: () => ReactNode
}

const ARTIKEL: Artikel[] = [
  {
    id: 'grunderwerbsteuer',
    titel: 'Grunderwerbsteuer nach Bundesland — ImmoWissen',
    url: 'immowissen.gg/grunderwerbsteuer',
    keywords: ['grunderwerbsteuer', 'grest', 'steuer', 'bundesland', 'kauf'],
    snippet: 'Wie hoch ist die Grunderwerbsteuer in deinem Bundesland? Komplette Tabelle 3,5 %–6,5 %.',
    Body: () => (
      <div>
        <p className="text-sm text-ink-700">
          Beim Immobilienkauf zahlst du <b>Grunderwerbsteuer</b> auf den Kaufpreis. Der Satz hängt vom Bundesland ab:
        </p>
        <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {Object.entries(GRUNDERWERBSTEUER)
            .sort((a, b) => a[1] - b[1])
            .map(([land, satz]) => (
              <div key={land} className="flex items-center justify-between px-3 py-1.5 text-sm">
                <span className="text-ink-700">{land}</span>
                <span className="font-bold tabular-nums text-ink-900">{pct(satz * 100)}</span>
              </div>
            ))}
        </div>
        <p className="mt-3 text-xs text-ink-500">Tipp: Bayern (3,5 %) ist am günstigsten, NRW & Brandenburg (6,5 %) am teuersten.</p>
      </div>
    ),
  },
  {
    id: 'nebenkosten',
    titel: 'Kaufnebenkosten: Was kostet ein Immobilienkauf wirklich?',
    url: 'immowissen.gg/kaufnebenkosten',
    keywords: ['nebenkosten', 'kaufnebenkosten', 'notar', 'makler', 'grundbuch', 'kosten'],
    snippet: 'Notar, Grundbuch, Makler & Steuer — plane 8–12 % on top ein.',
    Body: () => (
      <div className="space-y-2 text-sm text-ink-700">
        <p>Neben dem Kaufpreis kommen typischerweise diese Nebenkosten dazu:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Grunderwerbsteuer: 3,5 %–6,5 % (je Bundesland)</li>
          <li>Notar & Beurkundung: ~1,5 %</li>
          <li>Grundbucheintrag: ~0,5 %</li>
          <li>Maklercourtage (Käuferanteil): ~3,57 % (falls Makler)</li>
        </ul>
        <p className="text-ink-900">
          <b>Summe: oft 8–12 % des Kaufpreises.</b> Diese Kosten musst du aus Eigenkapital bezahlen — die Bank finanziert sie i. d. R. nicht mit.
        </p>
      </div>
    ),
  },
  {
    id: 'spekulationssteuer',
    titel: 'Spekulationssteuer & die 10-Jahres-Frist — ImmoWissen',
    url: 'immowissen.gg/spekulationssteuer',
    keywords: ['spekulationssteuer', 'verkauf', 'flip', 'flippen', 'steuer', 'gewinn', 'frist'],
    snippet: 'Wann ist der Verkaufsgewinn steuerfrei? Die wichtigste Regel beim Flippen.',
    Body: () => (
      <div className="space-y-2 text-sm text-ink-700">
        <p>
          Verkaufst du eine Immobilie <b>innerhalb von 10 Jahren</b> mit Gewinn, fällt <b>Spekulationssteuer</b> an — der
          Gewinn wird mit deinem persönlichen Steuersatz versteuert.
        </p>
        <p>
          Nach <b>über 10 Jahren</b> Haltedauer ist der Gewinn <b>komplett steuerfrei</b>. Beim schnellen Flippen frisst
          die Steuer also einen Teil der Marge — kalkuliere sie immer mit ein.
        </p>
      </div>
    ),
  },
  {
    id: 'finanzierung',
    titel: 'Bessere Finanzierung: Eigenkapital & Zinsangebot — ImmoWissen',
    url: 'immowissen.gg/finanzierung',
    keywords: ['finanzierung', 'kredit', 'zins', 'eigenkapital', 'bonität', 'bank', 'genehmigung'],
    snippet: 'So bekommst du den Kredit — und bessere Konditionen.',
    Body: () => (
      <div className="space-y-2 text-sm text-ink-700">
        <p>Zwei Hebel entscheiden über deine Finanzierung:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <b>Mehr Eigenkapital</b> → niedrigerer Beleihungsauslauf (LTV) → <b>niedrigerer Zins</b> und leichtere Zusage.
          </li>
          <li>
            <b>Höheres Zinsangebot</b> → die Bank verdient mehr → <b>höhere Genehmigungschance</b> und größerer Kreditrahmen.
          </li>
        </ul>
        <p>Beim Kauf stellst du beides selbst ein und siehst live die „Finanzierungschance".</p>
      </div>
    ),
  },
]

export function getArtikel(id: string): Artikel | undefined {
  return ARTIKEL.find((a) => a.id === id)
}

// --- Dienstleister-Verzeichnisse: verlinken direkt in die passende App ---
interface Service {
  id: string
  titel: string
  url: string
  keywords: string[]
  snippet: string
  appZiel: AppId
  extra?: Record<string, unknown>
  ctaText: string
  Body: () => ReactNode
}

function Sterne({ n }: { n: number }) {
  return <span className="text-amber-500">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}
function Profil({ emoji, name, fach, note, text }: { emoji: string; name: string; fach: string; note: number; text: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-lg">{emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ink-900">{name}</div>
          <div className="text-[11px] text-ink-500">{fach}</div>
        </div>
        <Sterne n={note} />
      </div>
      <p className="mt-1.5 text-xs text-ink-600">{text}</p>
    </div>
  )
}

const SERVICES: Service[] = [
  {
    id: 'bautraeger',
    titel: 'HandwerkerHeld — Bauträger & Sanierungsprofis finden',
    url: 'handwerkerheld.gg',
    keywords: ['bauträger', 'bautraeger', 'handwerker', 'renovieren', 'renovierung', 'sanieren', 'sanierung', 'modernisieren', 'umbau', 'küche', 'kueche', 'bad', 'badezimmer', 'energetisch', 'malern'],
    snippet: 'Geprüfte Bauträger für Renovierung & Sanierung. Angebote einholen und beauftragen.',
    appZiel: 'bautraeger',
    ctaText: '🔨 Bauträger beauftragen',
    Body: () => (
      <div className="space-y-2">
        <p className="text-sm text-ink-700">Finde den passenden Bauträger, der deine Immobilie renoviert — vergleiche Angebote und verhandle Preis & Bauzeit.</p>
        <Profil emoji="🛠️" name="Baris Yılmaz — Sanierungsprofi" fach="Komplettsanierung, Bäder, Küchen" note={5} text="Zuverlässig, ehrlich zu versteckten Mängeln. Meistgebucht in der Region." />
        <Profil emoji="🏗️" name="BauStark GmbH" fach="Energetische Sanierung, Fassade" note={4} text="Faire Preise, etwas längere Bauzeit im Sparmodus." />
        <Profil emoji="⚡" name="TurboBau24" fach="Express-Renovierungen" note={4} text="Blitzschnell fertig — dafür etwas teurer." />
      </div>
    ),
  },
  {
    id: 'makler',
    titel: 'MaklerMatch — Immobilienmakler & Beratung',
    url: 'maklermatch.gg',
    keywords: ['makler', 'immobilienmakler', 'beratung', 'besichtigung', 'verkaufsberatung'],
    snippet: 'Erfahrene Makler für Kauf, Verkauf und Besichtigungen. Direkt Kontakt aufnehmen.',
    appZiel: 'nachrichten',
    ctaText: '💬 Makler anschreiben',
    Body: () => (
      <div className="space-y-2">
        <p className="text-sm text-ink-700">Ein guter Makler kennt jedes Objekt und hilft ehrlich bei Chancen & Risiken.</p>
        <Profil emoji="🏘️" name="Sabine Kern — IMMO INC" fach="Kauf, Verkauf, Marktkenntnis" note={5} text="Bestens vernetzt, offen über Preise und Lagen. Schreib ihr direkt in den Nachrichten." />
      </div>
    ),
  },
  {
    id: 'vermieten',
    titel: 'MieterFinder — Wohnung vermieten & Mieter finden',
    url: 'mieterfinder.gg',
    keywords: ['vermieten', 'mieter', 'mietersuche', 'mieter finden', 'inserieren', 'nachmieter', 'vermietung'],
    snippet: 'Inseriere deine Wohnung und finde solvente Mieter. Anfragen treffen zeitversetzt ein.',
    appZiel: 'immobilien',
    extra: { tab: 'vermieten' },
    ctaText: '📢 Objekt inserieren (ImmoProud)',
    Body: () => (
      <div className="space-y-2 text-sm text-ink-700">
        <p>So findest du Mieter: Inseriere dein Objekt in ImmoProud (kostet eine Inseratsgebühr). Danach treffen mit der Zeit Anfragen ein — dann verhandelst du Miete & wählst den besten Mieter.</p>
        <p className="text-xs text-ink-500">Tipp: Renoviere vor dem Vermieten — das hebt die erzielbare Miete.</p>
      </div>
    ),
  },
  {
    id: 'kredit',
    titel: 'KreditKompass — Baufinanzierung & Kredit vergleichen',
    url: 'kreditkompass.gg',
    keywords: ['kredit', 'finanzierung', 'baufinanzierung', 'hypothek', 'darlehen', 'zins', 'zinsen', 'bonität', 'bonitaet'],
    snippet: 'Finanzierung berechnen, Bonität prüfen und die besten Konditionen sichern.',
    appZiel: 'bank',
    ctaText: '🏦 Zur Bank',
    Body: () => (
      <div className="space-y-2 text-sm text-ink-700">
        <p>Deine Bank prüft die Bonität und macht dir ein Angebot. Zwei Hebel entscheiden: <b>mehr Eigenkapital</b> → niedrigerer Zins, <b>höheres Zinsangebot</b> → höhere Genehmigungschance.</p>
        <p className="text-xs text-ink-500">Im Bank-Rechner siehst du Monatsrate & Bonitäts-Score. Die eigentliche Finanzierung schließt du beim Kauf ab.</p>
      </div>
    ),
  },
  {
    id: 'verkaufen',
    titel: 'FlipDeal — Immobilie verkaufen & Gewinn realisieren',
    url: 'flipdeal.gg',
    keywords: ['verkaufen', 'flippen', 'flip', 'gewinn', 'immobilie verkaufen', 'weiterverkauf'],
    snippet: 'Verkaufe deine Immobilien mit Gewinn — beachte Spekulationssteuer bei < 10 Jahren.',
    appZiel: 'portfolio',
    ctaText: '💰 Zum Portfolio (verkaufen)',
    Body: () => (
      <div className="space-y-2 text-sm text-ink-700">
        <p>Verkaufen läuft über dein Portfolio: renoviere günstig, verkaufe teurer (Flip). Achte auf die <b>Spekulationssteuer</b>, wenn du innerhalb von 10 Jahren verkaufst.</p>
      </div>
    ),
  },
]

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id)
}

/** Giggle-Suche über das In-Game-Web. */
export function sucheGiggle(query: string, objekte: Property[]): WebResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tokens = q.split(/\s+/)
  const res: WebResult[] = []

  // Dienstleister (Bauträger, Makler, Vermieten, Finanzierung, Verkaufen) — zuerst
  for (const s of SERVICES) {
    if (s.keywords.some((k) => q.includes(k)) || tokens.some((t) => s.titel.toLowerCase().includes(t)))
      res.push({ titel: s.titel, url: s.url, snippet: s.snippet, page: { typ: 'service', id: s.id } })
  }

  // Ratgeber-Artikel
  for (const a of ARTIKEL) {
    if (a.keywords.some((k) => q.includes(k)) || tokens.some((t) => a.titel.toLowerCase().includes(t)))
      res.push({ titel: a.titel, url: a.url, snippet: a.snippet, page: { typ: 'artikel', id: a.id } })
  }

  // Börse / News
  if (['börse', 'boerse', 'aktie', 'aktien', 'kurs', 'news', 'krypto', 'etf', 'nachrichten'].some((k) => q.includes(k)))
    res.push({
      titel: 'BörsenBlick — Aktuelle Kurse & Schlagzeilen',
      url: 'boersenblick.gg',
      snippet: 'Live-Ticker, Marktnews und Analysen zu Aktien, ETFs und Krypto.',
      page: { typ: 'boersenblick' },
    })

  // Städte
  const staedte = Array.from(new Set(objekte.map((o) => o.stadt)))
  for (const stadt of staedte) {
    if (q.includes(stadt.toLowerCase())) {
      res.push({
        titel: `${stadt} — Immobilienmarkt & Preise (Stadt-Wiki)`,
        url: `stadt-wiki.gg/${stadt.toLowerCase()}`,
        snippet: `Durchschnittspreise, Lage und Mietniveau in ${stadt}.`,
        page: { typ: 'stadtwiki', stadt },
      })
    }
  }

  // Objekte (ImmoScout-Klon)
  const treffer = objekte
    .filter(
      (o) =>
        tokens.some(
          (t) =>
            o.titel.toLowerCase().includes(t) ||
            o.stadt.toLowerCase().includes(t) ||
            o.stadtteil.toLowerCase().includes(t) ||
            o.objektart.toLowerCase().includes(t),
        ),
    )
    .slice(0, 6)
  if (treffer.length > 0 || ['immobilie', 'wohnung', 'haus', 'kaufen', 'objekt'].some((k) => q.includes(k))) {
    res.push({
      titel: 'ImmoScout24 — Immobilien kaufen',
      url: `immoscout24.gg/suche?q=${encodeURIComponent(query)}`,
      snippet: `${treffer.length || 'Viele'} Angebote passend zu „${query}". Mit Marktwert-Einschätzung.`,
      page: { typ: 'immoscout', q: query },
    })
    for (const o of treffer) {
      res.push({
        titel: `${o.titel} — ${o.stadt} · ${euro(o.kaufpreis)}`,
        url: `immoscout24.gg/expose/${o.id.slice(0, 8)}`,
        snippet: `${o.objektart}, ${area(o.wohnflaeche)}, ${o.zimmer} Zi. in ${o.stadtteil || o.stadt}. Deal-Analyse verfügbar.`,
        page: { typ: 'immoscout', id: o.id },
      })
    }
  }

  return res
}

/** Rendert eine In-Game-Website im Browser. */
export function WebPage({ page, objekte, nav }: { page: GigglePage; objekte: Property[]; nav: PhoneNav }) {
  const freischalten = useGame((s) => s.freischalten)
  const monthIndex = useGame((s) => s.monthIndex)

  // Recherche-Gating: bestimmte Seiten schalten Infos frei.
  useEffect(() => {
    if (page.typ === 'immoscout' && page.id) freischalten('analyse:' + page.id)
    if (page.typ === 'stadtwiki') freischalten('stadt:' + page.stadt)
  }, [page, freischalten])

  if (page.typ === 'artikel') {
    const a = getArtikel(page.id)
    if (!a) return <WebFehler />
    return (
      <div className="p-4">
        <div className="text-[11px] text-emerald-600">🔒 immowissen.gg</div>
        <h1 className="mt-1 text-lg font-black text-ink-900">{a.titel}</h1>
        <div className="mt-3">{a.Body()}</div>
      </div>
    )
  }

  if (page.typ === 'service') {
    const s = getService(page.id)
    if (!s) return <WebFehler />
    return (
      <div className="p-4">
        <div className="text-[11px] text-emerald-600">🔒 {s.url}</div>
        <h1 className="mt-1 text-lg font-black text-ink-900">{s.titel}</h1>
        <div className="mt-3">{s.Body()}</div>
        <button
          onClick={() => nav.open(s.appZiel, s.extra)}
          className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          {s.ctaText} →
        </button>
      </div>
    )
  }

  if (page.typ === 'boersenblick') {
    const news = aktuelleNews(monthIndex, 6)
    return (
      <div className="p-4">
        <div className="text-[11px] text-emerald-600">🔒 boersenblick.gg</div>
        <h1 className="mt-1 text-lg font-black text-ink-900">📰 BörsenBlick</h1>
        <div className="mt-3 space-y-1.5">
          {news.map((n, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="min-w-0 truncate text-xs text-ink-700">{n.text}</span>
              <span className={`shrink-0 text-xs font-black ${n.positiv ? 'text-emerald-600' : 'text-rose-600'}`}>
                {n.positiv ? '+' : '−'}{n.prozent.toFixed(1)} %
              </span>
            </div>
          ))}
        </div>
        <h2 className="mt-4 text-sm font-bold uppercase tracking-wide text-ink-500">Kurse</h2>
        <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {ASSETS.map((a) => {
            const chg = assetVeraenderung(a, monthIndex)
            return (
              <div key={a.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                <span className="text-ink-700">{a.emoji} {a.name}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-ink-900">{euro(assetPreis(a, monthIndex))}</span>
                  <span className={`w-16 text-right text-xs font-bold ${chg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(1)} %
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (page.typ === 'stadtwiki') {
    const inStadt = objekte.filter((o) => o.stadt === page.stadt)
    const schnitt = inStadt.length
      ? Math.round(inStadt.reduce((s, o) => s + o.kaufpreis / o.wohnflaeche, 0) / inStadt.length)
      : 0
    const mietSchnitt = inStadt.length
      ? Math.round(inStadt.reduce((s, o) => s + o.kaltmieteMarkt / o.wohnflaeche, 0) / inStadt.length)
      : 0
    return (
      <div className="p-4">
        <div className="text-[11px] text-emerald-600">🔒 stadt-wiki.gg</div>
        <h1 className="mt-1 text-lg font-black text-ink-900">{page.stadt}</h1>
        <p className="mt-2 text-sm text-ink-600">Marktüberblick aus {inStadt.length} aktuellen Angeboten.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Kachel label="Ø Kaufpreis / m²" wert={euro(schnitt)} />
          <Kachel label="Ø Miete / m²" wert={`${euro(mietSchnitt)}`} />
          <Kachel label="Ø Rendite" wert={pct(schnitt ? (mietSchnitt * 12) / schnitt * 100 : 0)} />
          <Kachel label="Angebote" wert={String(inStadt.length)} />
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Faustregel: Liegt ein Objekt deutlich unter dem Ø-Preis/m², ist es potenziell ein guter Deal.
        </p>
      </div>
    )
  }

  // ImmoScout: Suche oder Einzelobjekt
  if (page.id) {
    const o = objekte.find((x) => x.id === page.id)
    if (!o) return <WebFehler />
    const preisProM2 = Math.round(o.kaufpreis / o.wohnflaeche)
    const marktProM2 = Math.round(o.marktwert / o.wohnflaeche)
    const diff = (o.marktwert - o.kaufpreis) / o.kaufpreis
    const rendite = mietrendite(o.kaltmieteMarkt, o.kaufpreis)
    const einschaetzung = diff > 0.05 ? 'unter Marktwert 👍' : diff < -0.05 ? 'über Marktwert ⚠️' : 'fair bepreist'
    return (
      <div className="p-4">
        <div className="text-[11px] text-emerald-600">🔒 immoscout24.gg</div>
        <img src={o.bilder[0]} alt="" className="mt-2 aspect-[16/10] w-full rounded-xl object-cover" />
        <h1 className="mt-2 text-base font-black text-ink-900">{o.titel}</h1>
        <p className="text-xs text-ink-500">{o.stadtteil ? `${o.stadtteil}, ` : ''}{o.stadt} · {o.objektart}</p>

        <div className="mt-3 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Deal-Analyse</div>
          <div className="mt-1 text-sm font-black text-emerald-800">Einschätzung: {einschaetzung}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Kachel label="Kaufpreis / m²" wert={euro(preisProM2)} />
            <Kachel label="Marktwert / m²" wert={euro(marktProM2)} />
            <Kachel label="Brutto-Rendite" wert={pct(rendite)} />
            <Kachel label="Sanierungspotenzial" wert={euro(o.sanierungspotenzial)} />
          </div>
        </div>

        <button
          onClick={() => nav.openObjekt(o.id)}
          className="mt-3 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          Objekt öffnen & kaufen →
        </button>
      </div>
    )
  }

  // ImmoScout-Suchergebnis
  const q = (page.q ?? '').toLowerCase()
  const tokens = q.split(/\s+/).filter(Boolean)
  const liste = objekte
    .filter((o) =>
      !tokens.length ||
      tokens.some(
        (t) => o.titel.toLowerCase().includes(t) || o.stadt.toLowerCase().includes(t) || o.stadtteil.toLowerCase().includes(t),
      ),
    )
    .slice(0, 12)
  return (
    <div className="p-4">
      <div className="text-[11px] text-emerald-600">🔒 immoscout24.gg</div>
      <h1 className="mt-1 text-lg font-black text-ink-900">Immobilien-Angebote</h1>
      <div className="mt-3 space-y-2">
        {liste.map((o) => (
          <ImmoTreffer key={o.id} o={o} />
        ))}
      </div>
    </div>
  )
}

function ImmoTreffer({ o }: { o: Property }) {
  const setPage = usePageSetter()
  return (
    <button
      onClick={() => setPage({ typ: 'immoscout', id: o.id })}
      className="flex w-full items-center gap-3 rounded-xl bg-white p-2 text-left shadow-soft ring-1 ring-black/5 transition hover:bg-slate-50"
    >
      <img src={o.bilder[0]} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-ink-900">{o.titel}</div>
        <div className="text-xs text-ink-500">{o.stadt} · {area(o.wohnflaeche)} · {euro(o.kaufpreis)}</div>
      </div>
      <span className="text-ink-300">›</span>
    </button>
  )
}

// Kleiner Kontext, damit ImmoTreffer die Browser-Seite wechseln kann.
import { createContext, useContext } from 'react'
const PageCtx = createContext<(p: GigglePage) => void>(() => {})
export const PageProvider = PageCtx.Provider
function usePageSetter() {
  return useContext(PageCtx)
}

function Kachel({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="text-sm font-bold tabular-nums text-ink-900">{wert}</div>
    </div>
  )
}

function WebFehler() {
  return <div className="p-8 text-center text-sm text-ink-400">Seite nicht gefunden (404).</div>
}
