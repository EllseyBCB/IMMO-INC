import { useGame, renoRestMs, skipKosten } from '../../state/game'
import { euro, dauer } from '../../lib/format'
import type { PhoneNav } from '../phone/nav'

export default function BautraegerApp({ onClose, nav }: { onClose: () => void; nav: PhoneNav }) {
  const owned = useGame((s) => s.owned)
  const cash = useGame((s) => s.cash)
  const renovierungBeschleunigen = useGame((s) => s.renovierungBeschleunigen)
  const aktiv = owned.filter((o) => o.renovierung?.status === 'in_arbeit')

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 pt-3 text-white">
        <button onClick={onClose} className="text-lg" aria-label="Schließen">
          ✕
        </button>
        <span className="text-sm font-bold">🏗️ Bauträger</span>
        <span className="ml-auto text-[10px] text-white/80">Laufende Renovierungen</span>
      </div>

      {aktiv.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl">🏗️</div>
          <div className="mt-3 text-base font-bold text-ink-900">Aktuell läuft keine Renovierung</div>
          <p className="mt-1 text-sm text-ink-500">
            Such dir online bei Giggle einen passenden Bauträger, der deine Immobilie renoviert — vergleiche Preise &amp;
            Bewertungen.
          </p>
          <button
            onClick={() => nav.giggle('günstigen Bauträger finden')}
            className="mt-5 w-full max-w-[280px] rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            🔎 Bauträger bei Giggle suchen
          </button>
        </div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
          {aktiv.map((o) => {
            const reno = o.renovierung!
            const skip = skipKosten(o)
            return (
              <div key={o.uid} className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-black/5">
                <div className="flex gap-3 p-2">
                  <img src={o.property.bilder[0]} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink-900">{o.property.titel}</div>
                    <div className="text-[11px] text-ink-500">{o.property.stadt}</div>
                    <div className="mt-0.5 text-[11px] font-semibold text-orange-600">🏗️ {reno.bautraeger ?? 'Bauträger'}</div>
                  </div>
                </div>
                <div className="border-t border-slate-100 p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-600">
                      Fertig in <span className="font-bold tabular-nums text-amber-700">{dauer(renoRestMs(o))}</span>
                    </span>
                    <span className="font-semibold text-emerald-600">+{euro(reno.wertsteigerung)} Wert</span>
                  </div>
                  <button
                    onClick={() => renovierungBeschleunigen(o.uid)}
                    disabled={skip > cash}
                    className="mt-2 w-full rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-40"
                  >
                    ⚡ Sofort fertigstellen{skip > 0 ? ` · ${euro(skip)}` : ''}
                  </button>
                </div>
              </div>
            )
          })}

          <button
            onClick={() => nav.giggle('günstigen Bauträger finden')}
            className="w-full rounded-xl border border-dashed border-orange-300 bg-orange-50/60 py-2.5 text-sm font-bold text-orange-700"
          >
            + Weitere Renovierung — Bauträger bei Giggle suchen
          </button>
        </div>
      )}
    </div>
  )
}
