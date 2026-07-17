import { useEffect, useMemo, useState } from 'react'
import type { Property } from '../../data/types'
import { ladeMarkt } from '../../data/openimmo'
import { useGame } from '../../state/game'
import { useCustomListings } from '../../state/customListings'
import PropertyCard from './PropertyCard'
import ImportModal from './ImportModal'
import { euro } from '../../lib/format'

type Sort = 'preis-auf' | 'preis-ab' | 'rendite' | 'potenzial'

export default function Markt() {
  const verkauft = useGame((s) => s.verkauft)
  const custom = useCustomListings((s) => s.objekte)
  const [alle, setAlle] = useState<Property[] | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [stadt, setStadt] = useState('alle')
  const [maxPreis, setMaxPreis] = useState(2000000)
  const [sort, setSort] = useState<Sort>('potenzial')
  const [importOffen, setImportOffen] = useState(false)

  useEffect(() => {
    ladeMarkt()
      .then(setAlle)
      .catch((e) => setFehler(String(e.message ?? e)))
  }, [])

  // Eigene importierte Inserate zuerst, dann der kuratierte Feed.
  const alleObjekte = useMemo<Property[] | null>(
    () => (alle ? [...custom, ...alle] : custom.length ? custom : null),
    [alle, custom],
  )

  const staedte = useMemo(() => {
    if (!alleObjekte) return []
    return Array.from(new Set(alleObjekte.map((p) => p.stadt))).sort()
  }, [alleObjekte])

  const gefiltert = useMemo(() => {
    if (!alleObjekte) return []
    let list = alleObjekte.filter((p) => !verkauft.includes(p.id))
    if (q.trim()) {
      const s = q.toLowerCase()
      list = list.filter(
        (p) =>
          p.titel.toLowerCase().includes(s) ||
          p.stadt.toLowerCase().includes(s) ||
          p.stadtteil.toLowerCase().includes(s),
      )
    }
    if (stadt !== 'alle') list = list.filter((p) => p.stadt === stadt)
    list = list.filter((p) => p.kaufpreis <= maxPreis)

    const sorted = [...list]
    switch (sort) {
      case 'preis-auf':
        sorted.sort((a, b) => a.kaufpreis - b.kaufpreis)
        break
      case 'preis-ab':
        sorted.sort((a, b) => b.kaufpreis - a.kaufpreis)
        break
      case 'rendite':
        sorted.sort((a, b) => b.kaltmieteMarkt / b.kaufpreis - a.kaltmieteMarkt / a.kaufpreis)
        break
      case 'potenzial':
        sorted.sort((a, b) => b.sanierungspotenzial - a.sanierungspotenzial)
        break
    }
    return sorted
  }, [alleObjekte, verkauft, q, stadt, maxPreis, sort])

  if (fehler) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-rose-700">
        Marktdaten konnten nicht geladen werden: {fehler}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink-900">Immobilienmarkt</h1>
          <p className="text-sm text-ink-500">
            {alleObjekte ? `${gefiltert.length} von ${alleObjekte.length} Objekten` : 'Lädt…'} · OpenImmo-Feed
            {custom.length > 0 ? ` + ${custom.length} importiert` : ''}
          </p>
        </div>
        <button
          onClick={() => setImportOffen(true)}
          className="shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600"
        >
          + Inserat importieren
        </button>
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/[0.04] sm:grid-cols-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suchen…"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:col-span-2"
        />
        <select
          value={stadt}
          onChange={(e) => setStadt(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        >
          <option value="alle">Alle Städte</option>
          {staedte.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        >
          <option value="potenzial">Meiste Marge</option>
          <option value="rendite">Höchste Rendite</option>
          <option value="preis-auf">Preis aufsteigend</option>
          <option value="preis-ab">Preis absteigend</option>
        </select>
        <div className="sm:col-span-4">
          <div className="mb-1 flex justify-between text-xs text-ink-500">
            <span>Max. Kaufpreis</span>
            <span className="font-semibold text-ink-700">{euro(maxPreis)}</span>
          </div>
          <input
            type="range"
            min={150000}
            max={2000000}
            step={25000}
            value={maxPreis}
            onChange={(e) => setMaxPreis(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
          />
        </div>
      </div>

      {!alleObjekte ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="aspect-[4/3] bg-slate-100" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : gefiltert.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-ink-500 shadow-card">
          Keine Objekte gefunden. Passe die Filter an.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gefiltert.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {importOffen && <ImportModal onClose={() => setImportOffen(false)} />}
    </div>
  )
}
