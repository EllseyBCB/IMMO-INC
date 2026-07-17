import { useState } from 'react'
import { useGame } from '../../state/game'
import { euro, dauer } from '../../lib/format'
import { renoRestMs } from '../../state/game'
import { Badge } from '../../components/ui'
import BautraegerModal from '../portfolio/BautraegerModal'

export default function BautraegerApp({ onClose }: { onClose: () => void }) {
  const owned = useGame((s) => s.owned)
  const [uid, setUid] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const objekt = owned.find((o) => o.uid === uid) ?? null

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white/85 px-2 py-2 pt-3 backdrop-blur">
        <button onClick={onClose} className="rounded-lg px-2 py-1 text-lg text-brand-600" aria-label="Zurück">
          ‹
        </button>
        <span className="text-sm font-bold text-ink-900">Bauträger</span>
      </div>

      {toast && (
        <div className="m-3 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">✅ {toast}</div>
      )}

      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
        {owned.length === 0 && (
          <div className="mt-8 text-center text-sm text-ink-500">Kauf erst eine Immobilie, dann kannst du renovieren.</div>
        )}
        {owned.map((o) => {
          const inArbeit = o.renovierung?.status === 'in_arbeit'
          const fertig = o.renovierung?.status === 'fertig'
          return (
            <div key={o.uid} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-ink-900">{o.property.titel}</div>
                  <div className="text-[11px] text-ink-500">
                    {o.property.stadt} · {o.property.zustand}
                  </div>
                </div>
                {inArbeit && <Badge tone="amber">Baustelle</Badge>}
                {fertig && <Badge tone="blue">Renoviert</Badge>}
              </div>

              {inArbeit && o.renovierung ? (
                <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  🏗️ {o.renovierung.bautraeger ?? 'Bauträger'} — fertig in{' '}
                  <span className="tabular-nums">{dauer(renoRestMs(o))}</span>
                </div>
              ) : (
                <button
                  onClick={() => setUid(o.uid)}
                  className="mt-2 w-full rounded-xl bg-brand-50 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                >
                  🏗️ Angebote einholen &amp; verhandeln
                </button>
              )}
            </div>
          )
        })}
      </div>

      {objekt && (
        <BautraegerModal
          o={objekt}
          onClose={() => setUid(null)}
          onBeauftragt={(info) => setToast(`Beauftragt: ${info.gewerke.join(', ')} für ${euro(info.kosten)}`)}
        />
      )}
    </div>
  )
}
