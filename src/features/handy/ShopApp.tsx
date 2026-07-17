import { useMemo, useState } from 'react'
import { gesamtVermoegen, useGame } from '../../state/game'
import {
  LUXUS_KATALOG,
  lebensstandard,
  luxusUnterhalt,
  sonderausgabenMonat,
  type LuxusItem,
  type LuxusKategorie,
} from '../../data/lifestyle'
import { euro } from '../../lib/format'

const KATEGORIEN: LuxusKategorie[] = ['Mobilität', 'Wohnen', 'Uhren & Schmuck', 'Reisen', 'Freizeit', 'Tech']

export default function ShopApp({ onClose }: { onClose: () => void }) {
  const { cash, owned, gekaufteLuxus, depot, monthIndex } = useGame()
  const luxusKaufen = useGame((s) => s.luxusKaufen)
  const [filter, setFilter] = useState<LuxusKategorie | 'alle'>('alle')

  const vermoegen = gesamtVermoegen(cash, owned, depot, monthIndex)
  const ls = lebensstandard(vermoegen, gekaufteLuxus)
  const unterhalt = luxusUnterhalt(gekaufteLuxus)
  const sonder = sonderausgabenMonat(vermoegen, gekaufteLuxus)

  const items = useMemo(
    () => LUXUS_KATALOG.filter((i) => filter === 'alle' || i.kategorie === filter),
    [filter],
  )

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Kopf */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 pt-3 text-white">
        <button onClick={onClose} className="rounded-lg px-1.5 py-0.5 text-lg" aria-label="Schließen">
          ✕
        </button>
        <span className="text-sm font-bold">Lifestyle&nbsp;Shop</span>
        <span className="ml-auto text-[11px] text-white/80">Verfügbar {euro(cash)}</span>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {/* Lebensstandard-Status */}
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 pb-4 pt-1 text-white">
          <div className="text-[11px] uppercase tracking-wide text-white/70">Dein Lebensstandard</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl">{ls.stufe.emoji}</span>
            <span className="text-2xl font-black">{ls.stufe.name}</span>
          </div>
          {/* Fortschrittsbalken zur nächsten Stufe */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.round(ls.fortschritt * 100)}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-white/80">
            <span>{ls.punkte} Punkte</span>
            <span>{ls.naechste ? `Nächste: ${ls.naechste.name}` : 'Höchste Stufe erreicht 👑'}</span>
          </div>
        </div>

        {/* Ausgaben-Hinweis */}
        <div className="mx-3 -mt-3 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Sonderausgaben / Monat</span>
            <span className="font-bold tabular-nums text-rose-600">− {euro(sonder)}</span>
          </div>
          <div className="mt-1 text-[11px] leading-snug text-ink-400">
            Steigt mit deinem Vermögen{unterhalt > 0 ? ` und dem Unterhalt deiner Anschaffungen (${euro(unterhalt)}/M)` : ''}.
            Wer früh investiert, wächst schneller als die Ausgaben.
          </div>
        </div>

        {/* Kategorie-Filter */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-3">
          <FilterChip label="Alle" aktiv={filter === 'alle'} onClick={() => setFilter('alle')} />
          {KATEGORIEN.map((k) => (
            <FilterChip key={k} label={k} aktiv={filter === k} onClick={() => setFilter(k)} />
          ))}
        </div>

        {/* Artikel */}
        <div className="space-y-2 px-3 pb-4">
          {items.map((item) => (
            <ShopKarte
              key={item.id}
              item={item}
              besitzt={gekaufteLuxus.includes(item.id)}
              leistbar={item.preis <= cash}
              onKaufen={() => luxusKaufen(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterChip({ label, aktiv, onClick }: { label: string; aktiv: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        aktiv ? 'bg-violet-600 text-white' : 'bg-white text-ink-600 ring-1 ring-black/5 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
}

function ShopKarte({
  item,
  besitzt,
  leistbar,
  onKaufen,
}: {
  item: LuxusItem
  besitzt: boolean
  leistbar: boolean
  onKaufen: () => void
}) {
  return (
    <div className={`rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5 ${besitzt ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-2xl">{item.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-ink-900">{item.name}</span>
            <span className="text-[10px] font-bold text-violet-600">+{item.punkte}</span>
          </div>
          <div className="text-[11px] leading-snug text-ink-500">{item.beschreibung}</div>
          <div className="mt-0.5 text-[10px] text-ink-400">
            {item.unterhalt > 0 ? `Unterhalt ${euro(item.unterhalt)}/Monat` : 'Kein laufender Unterhalt'}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-black tabular-nums text-ink-900">{euro(item.preis)}</span>
        {besitzt ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">✓ Im Besitz</span>
        ) : (
          <button
            onClick={onKaufen}
            disabled={!leistbar}
            className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-ink-400"
          >
            {leistbar ? 'Kaufen' : 'Zu teuer'}
          </button>
        )}
      </div>
    </div>
  )
}
