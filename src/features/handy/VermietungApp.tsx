import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../state/game'
import { useVermietung } from '../../state/vermietung'
import { risikoTon } from '../../data/mieter'
import { Badge } from '../../components/ui'
import { euro, pct } from '../../lib/format'

function marktMiete(kaltmieteMarkt: number, kaltmiete: number, flaeche: number) {
  return Math.round(kaltmieteMarkt || kaltmiete || flaeche * 10)
}

export default function VermietungApp({ onClose }: { onClose: () => void }) {
  const owned = useGame((s) => s.owned)
  const vermieten = useGame((s) => s.vermieten)
  const setNutzung = useGame((s) => s.setNutzung)
  const { kandidaten, chats, sucheMieter, fordern, ablehnen, aufraeumen } = useVermietung()

  const [uid, setUid] = useState<string | null>(null)
  const [mieterId, setMieterId] = useState<string | null>(null)
  const [erfolg, setErfolg] = useState<string | null>(null)

  const objekt = owned.find((o) => o.uid === uid) ?? null
  const liste = uid ? kandidaten[uid] ?? [] : []
  const mieter = liste.find((m) => m.id === mieterId) ?? null

  // ---- Verhandlungs-Chat ----------------------------------------------------
  if (objekt && mieter) {
    const markt = marktMiete(objekt.property.kaltmieteMarkt, objekt.kaltmiete, objekt.property.wohnflaeche)
    return (
      <ChatVerhandlung
        markt={markt}
        thread={chats[mieter.id] ?? []}
        mieter={mieter}
        onBack={() => setMieterId(null)}
        onFordern={(f) => fordern(objekt.uid, mieter.id, f)}
        onAblehnen={() => {
          ablehnen(objekt.uid, mieter.id)
          setMieterId(null)
        }}
        onDeal={() => {
          vermieten(objekt.uid, mieter.angebot, { name: mieter.name, risiko: mieter.risiko })
          aufraeumen(objekt.uid)
          setErfolg(`${mieter.name} zieht ein — ${euro(mieter.angebot)}/Monat!`)
          setMieterId(null)
          setUid(null)
        }}
      />
    )
  }

  // ---- Bewerberliste --------------------------------------------------------
  if (objekt) {
    const markt = marktMiete(objekt.property.kaltmieteMarkt, objekt.kaltmiete, objekt.property.wohnflaeche)
    return (
      <div className="flex h-full flex-col bg-slate-50">
        <AppHeader title="Bewerber" onBack={() => setUid(null)} />
        <div className="border-b border-slate-200 bg-white px-4 py-2">
          <div className="truncate text-sm font-bold text-ink-900">{objekt.property.titel}</div>
          <div className="text-xs text-ink-500">Marktmiete ~{euro(markt)}/M</div>
        </div>
        <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
          {liste.length === 0 && (
            <div className="mt-6 text-center text-sm text-ink-500">Noch keine Bewerber. Starte die Suche.</div>
          )}
          {liste.map((m) => (
            <button
              key={m.id}
              disabled={m.status === 'abgelehnt'}
              onClick={() => setMieterId(m.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                m.status === 'abgelehnt'
                  ? 'border-slate-200 bg-slate-50 opacity-50'
                  : 'border-slate-200 bg-white hover:border-brand-300'
              }`}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl">{m.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-ink-900">{m.name}</span>
                  <Badge tone={risikoTon(m.risiko)}>{m.risiko}</Badge>
                </div>
                <div className="truncate text-[11px] text-ink-500">{m.beruf}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-bold text-ink-900">{euro(m.angebot)}</div>
                <div className="text-[10px] text-ink-400">bietet</div>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-200 bg-white p-3">
          <button
            onClick={() => sucheMieter(objekt.uid, markt)}
            className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            {liste.length ? '🔄 Neue Bewerber suchen' : '🔎 Mieter suchen'}
          </button>
        </div>
      </div>
    )
  }

  // ---- Objektliste ----------------------------------------------------------
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <AppHeader title="Vermietung" onBack={onClose} />
      {erfolg && (
        <div className="m-3 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">
          🎉 {erfolg}
        </div>
      )}
      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
        {owned.length === 0 && (
          <div className="mt-8 text-center text-sm text-ink-500">
            Du besitzt noch keine Immobilie. Kauf erst eine, dann kannst du vermieten.
          </div>
        )}
        {owned.map((o) => {
          const markt = marktMiete(o.property.kaltmieteMarkt, o.kaltmiete, o.property.wohnflaeche)
          const bewerber = kandidaten[o.uid]?.filter((m) => m.status !== 'abgelehnt').length ?? 0
          const inArbeit = o.renovierung?.status === 'in_arbeit'
          return (
            <div key={o.uid} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-ink-900">{o.property.titel}</div>
                  <div className="text-[11px] text-ink-500">
                    {o.property.stadt} · Marktmiete ~{euro(markt)}/M
                  </div>
                </div>
                {o.nutzung === 'vermietet' && <Badge tone="green">Vermietet</Badge>}
                {inArbeit && <Badge tone="amber">Baustelle</Badge>}
              </div>

              {o.nutzung === 'vermietet' ? (
                <div className="mt-2">
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    🔑 {o.mieterName ?? 'Mieter'} zahlt <strong>{euro(o.kaltmiete)}/M</strong>
                    {o.mieterRisiko ? ` · Risiko ${o.mieterRisiko}` : ''}
                  </div>
                  <button
                    onClick={() => setNutzung(o.uid, 'leer')}
                    className="mt-1 w-full py-1 text-[11px] font-semibold text-rose-500"
                  >
                    Mietverhältnis beenden
                  </button>
                </div>
              ) : inArbeit ? (
                <div className="mt-2 text-xs text-ink-400">Erst Renovierung abschließen.</div>
              ) : (
                <button
                  onClick={() => {
                    setUid(o.uid)
                    if (!(kandidaten[o.uid]?.length)) sucheMieter(o.uid, markt)
                  }}
                  className="mt-2 w-full rounded-xl bg-brand-50 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                >
                  {bewerber > 0 ? `${bewerber} Bewerber ansehen` : '🔎 Mieter suchen'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AppHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white/85 px-2 py-2 pt-3 backdrop-blur">
      <button onClick={onBack} className="rounded-lg px-2 py-1 text-lg text-brand-600" aria-label="Zurück">
        ‹
      </button>
      <span className="text-sm font-bold text-ink-900">{title}</span>
    </div>
  )
}

function ChatVerhandlung({
  markt,
  thread,
  mieter,
  onBack,
  onFordern,
  onAblehnen,
  onDeal,
}: {
  markt: number
  thread: { from: 'spieler' | 'mieter'; text: string }[]
  mieter: import('../../data/mieter').Mieter
  onBack: () => void
  onFordern: (forderung: number) => void
  onAblehnen: () => void
  onDeal: () => void
}) {
  const [forderung, setForderung] = useState(markt)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread.length])

  const min = Math.round(markt * 0.5)
  const max = Math.round(markt * 1.6)
  const abgelehnt = mieter.status === 'abgelehnt'

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white/85 px-2 py-2 pt-3 backdrop-blur">
        <button onClick={onBack} className="rounded-lg px-2 py-1 text-lg text-brand-600" aria-label="Zurück">
          ‹
        </button>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-base">{mieter.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-ink-900">{mieter.name}</span>
            <Badge tone={risikoTon(mieter.risiko)}>{mieter.risiko}</Badge>
          </div>
          <div className="truncate text-[11px] text-ink-500">{mieter.beruf}</div>
        </div>
      </div>

      {mieter.runden > 0 && (
        <div className="bg-brand-50 px-3 py-1 text-center text-[11px] font-semibold text-brand-700">
          🤝 Runde {mieter.runden} — je länger du verhandelst, desto mehr Miete ist drin
        </div>
      )}

      <div ref={scrollRef} className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {thread.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'spieler' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-soft ${
                m.from === 'spieler'
                  ? 'rounded-br-md bg-brand-500 text-white'
                  : 'rounded-bl-md bg-white text-ink-800 ring-1 ring-black/5'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {abgelehnt && (
          <div className="rounded-xl bg-rose-50 p-2 text-center text-xs font-medium text-rose-700">
            {mieter.name} hat die Bewerbung zurückgezogen.
          </div>
        )}
      </div>

      {!abgelehnt && (
        <div className="border-t border-slate-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-ink-500">Deine Forderung</span>
            <span className="font-bold tabular-nums text-ink-900">
              {euro(forderung)}
              <span className="ml-1 font-medium text-ink-400">
                ({pct((forderung / markt) * 100 - 100, 0)} z. Markt)
              </span>
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={10}
            value={forderung}
            onChange={(e) => setForderung(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => onFordern(forderung)}
              className="rounded-xl bg-ink-900 py-2 text-xs font-bold text-white transition hover:bg-black"
            >
              {euro(forderung)} fordern
            </button>
            <button
              onClick={onDeal}
              className="rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
            >
              Deal · {euro(mieter.angebot)}/M
            </button>
          </div>
          <button onClick={onAblehnen} className="mt-2 w-full py-1 text-[11px] font-semibold text-rose-500">
            Bewerber ablehnen
          </button>
        </div>
      )}
    </div>
  )
}
