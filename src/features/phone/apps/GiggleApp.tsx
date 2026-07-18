import { useEffect, useMemo, useState } from 'react'
import type { Property } from '../../../data/types'
import { ladeMarkt } from '../../../data/openimmo'
import { useCustomListings } from '../../../state/customListings'
import { useInternet } from '../../../state/internet'
import { PageProvider, WebPage, sucheGiggle, type GigglePage, type WebResult } from '../../../data/web'
import type { PhoneNav } from '../nav'

const VORSCHLAEGE = ['Grunderwerbsteuer Bayern', 'Kaufnebenkosten', 'Spekulationssteuer', 'Börse News', 'Wohnung Leipzig']

export default function GiggleApp({ onClose, nav, initial }: { onClose: () => void; nav: PhoneNav; initial?: string }) {
  const custom = useCustomListings((s) => s.objekte)
  const addSuche = useInternet((s) => s.addSuche)
  const verlauf = useInternet((s) => s.suchen)
  const [alle, setAlle] = useState<Property[]>([])
  const [q, setQ] = useState(initial ?? '')
  const [aktiv, setAktiv] = useState(initial ?? '') // ausgeführte Suche
  const [page, setPage] = useState<GigglePage | null>(null)

  useEffect(() => {
    ladeMarkt().then((m) => setAlle(m)).catch(() => setAlle([]))
  }, [])

  const objekte = useMemo(() => [...custom, ...alle], [custom, alle])
  const ergebnisse: WebResult[] = useMemo(() => (aktiv ? sucheGiggle(aktiv, objekte) : []), [aktiv, objekte])

  function suchen(text: string) {
    const t = text.trim()
    if (!t) return
    setQ(t)
    setAktiv(t)
    setPage(null)
    addSuche(t)
  }

  // Browser-Ansicht
  if (page) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-2 py-2">
          <button onClick={() => setPage(null)} className="rounded-lg px-2 py-1 text-lg text-brand-600" aria-label="Zurück">
            ‹
          </button>
          <div className="flex-1 truncate rounded-full bg-slate-100 px-3 py-1.5 text-xs text-ink-500">
            {seiteUrl(page, objekte)}
          </div>
          <button onClick={onClose} className="px-1 text-ink-400" aria-label="Schließen">
            ✕
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto">
          <PageProvider value={setPage}>
            <WebPage page={page} objekte={objekte} nav={nav} />
          </PageProvider>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Suchleiste */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-2 py-2 pt-3">
        <button onClick={onClose} className="px-1 text-lg text-ink-400" aria-label="Schließen">
          ✕
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && suchen(q)}
          placeholder="Bei Giggle suchen…"
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
        />
        <button onClick={() => suchen(q)} className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white" aria-label="Suchen">
          🔎
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {!aktiv ? (
          <div className="flex flex-col items-center px-6 pt-10">
            <div className="text-4xl font-black tracking-tight">
              <span className="text-rose-500">G</span>
              <span className="text-amber-500">i</span>
              <span className="text-emerald-500">g</span>
              <span className="text-blue-500">g</span>
              <span className="text-rose-500">l</span>
              <span className="text-amber-500">e</span>
            </div>
            <p className="mt-2 text-center text-xs text-ink-400">Recherchiere Objekte, Städte, Steuern & die Börse.</p>
            <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
              {VORSCHLAEGE.map((v) => (
                <button
                  key={v}
                  onClick={() => suchen(v)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-brand-300"
                >
                  {v}
                </button>
              ))}
            </div>
            {verlauf.length > 0 && (
              <div className="mt-6 w-full">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Zuletzt gesucht</div>
                {verlauf.slice(0, 6).map((s) => (
                  <button key={s} onClick={() => suchen(s)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink-600 hover:bg-slate-50">
                    🕘 {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : ergebnisse.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-400">
            Keine Ergebnisse für „{aktiv}". Versuch z. B. eine Stadt, „Grunderwerbsteuer" oder „Börse".
          </div>
        ) : (
          <div className="divide-y divide-slate-100 px-3">
            {ergebnisse.map((r, i) => (
              <button key={i} onClick={() => setPage(r.page)} className="block w-full py-3 text-left">
                <div className="text-[11px] text-emerald-700">{r.url}</div>
                <div className="text-sm font-semibold text-blue-700">{r.titel}</div>
                <div className="mt-0.5 text-xs text-ink-500">{r.snippet}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function seiteUrl(page: GigglePage, objekte: Property[]): string {
  switch (page.typ) {
    case 'artikel':
      return 'immowissen.gg'
    case 'boersenblick':
      return 'boersenblick.gg'
    case 'stadtwiki':
      return `stadt-wiki.gg/${page.stadt.toLowerCase()}`
    case 'immoscout':
      return page.id ? `immoscout24.gg/expose/${page.id.slice(0, 8)}` : 'immoscout24.gg'
  }
  void objekte
  return 'giggle.gg'
}
