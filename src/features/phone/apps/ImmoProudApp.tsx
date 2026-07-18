import { useEffect, useState } from 'react'
import Markt from '../../markt/Markt'
import { useGame, type OwnedProperty } from '../../../state/game'
import { useVermietung } from '../../../state/vermietung'
import { risikoTon, type Mieter } from '../../../data/mieter'
import { Badge } from '../../../components/ui'
import { euro } from '../../../lib/format'
import type { PhoneNav } from '../nav'

function marktMieteOf(o: OwnedProperty): number {
  return Math.round(o.marktMiete || o.property.kaltmieteMarkt || o.kaltmiete || o.property.wohnflaeche * 10)
}
function inseratsGebuehr(markt: number): number {
  return Math.max(150, Math.round(markt * 0.5))
}

export default function ImmoProudApp({ onClose, nav }: { onClose: () => void; nav: PhoneNav }) {
  const [tab, setTab] = useState<'kaufen' | 'vermieten'>('kaufen')
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 pt-3 text-white">
        <button onClick={onClose} className="text-lg" aria-label="Schließen">
          ✕
        </button>
        <span className="text-sm font-black tracking-tight">ImmoProud</span>
        <span className="ml-auto text-[10px] text-white/80">Deine Nr. 1 für Immobilien</span>
      </div>
      <div className="flex border-b border-slate-200 bg-white text-sm font-bold">
        <button onClick={() => setTab('kaufen')} className={`flex-1 py-2.5 ${tab === 'kaufen' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-ink-400'}`}>
          Kaufen
        </button>
        <button onClick={() => setTab('vermieten')} className={`flex-1 py-2.5 ${tab === 'vermieten' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-ink-400'}`}>
          Vermieten
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {tab === 'kaufen' ? (
          <div className="p-3">
            <Markt nav={nav} />
          </div>
        ) : (
          <VermietenTab />
        )}
      </div>
    </div>
  )
}

function VermietenTab() {
  const owned = useGame((s) => s.owned)
  const [uid, setUid] = useState<string | null>(null)
  const [mieterId, setMieterId] = useState<string | null>(null)

  const objekt = owned.find((o) => o.uid === uid) ?? null

  if (objekt && mieterId) return <Verhandlung o={objekt} mieterId={mieterId} onBack={() => setMieterId(null)} onFertig={() => { setMieterId(null); setUid(null) }} />
  if (objekt) return <Bewerberliste o={objekt} onBack={() => setUid(null)} onChat={setMieterId} />
  return <Objektliste onOeffnen={setUid} />
}

function Objektliste({ onOeffnen }: { onOeffnen: (uid: string) => void }) {
  const owned = useGame((s) => s.owned)
  const cash = useGame((s) => s.cash)
  const bezahleInserat = useGame((s) => s.bezahleInserat)
  const setNutzung = useGame((s) => s.setNutzung)
  const { inseriert, kandidaten, inserieren } = useVermietung()

  if (owned.length === 0)
    return <div className="p-8 text-center text-sm text-ink-500">Du hast noch keine Immobilien zum Vermieten. Kauf zuerst ein Objekt im Tab „Kaufen".</div>

  return (
    <div className="space-y-2 p-3">
      {owned.map((o) => {
        const markt = marktMieteOf(o)
        const gebuehr = inseratsGebuehr(markt)
        const istInseriert = inseriert[o.uid] !== undefined
        const anzahl = kandidaten[o.uid]?.length ?? 0
        const inArbeit = o.renovierung?.status === 'in_arbeit'
        return (
          <div key={o.uid} className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-black/5">
            <div className="flex gap-3 p-2">
              <img src={o.property.bilder[0]} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-ink-900">{o.property.titel}</div>
                <div className="text-xs text-ink-500">{o.property.stadt}</div>
                <div className="text-xs font-semibold text-orange-600">Marktmiete ~{euro(markt)}/M</div>
              </div>
            </div>
            <div className="border-t border-slate-100 p-2">
              {o.nutzung === 'vermietet' ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">🔑 Vermietet an {o.mieterName} · {euro(o.kaltmiete)}/M</span>
                  <button onClick={() => setNutzung(o.uid, 'leer')} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-ink-600">
                    Beenden
                  </button>
                </div>
              ) : inArbeit ? (
                <div className="text-center text-xs text-amber-600">🏗️ Erst Renovierung abschließen</div>
              ) : !istInseriert ? (
                <button
                  onClick={() => {
                    if (gebuehr > cash) return
                    bezahleInserat(gebuehr, o.property.titel)
                    inserieren(o.uid, markt)
                  }}
                  disabled={gebuehr > cash}
                  className="w-full rounded-xl bg-orange-500 py-2 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-40"
                >
                  📢 Inserieren · Gebühr {euro(gebuehr)}
                </button>
              ) : (
                <button onClick={() => onOeffnen(o.uid)} className="flex w-full items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  <span>{anzahl > 0 ? `${anzahl} Anfrage${anzahl === 1 ? '' : 'n'}` : 'Warte auf Anfragen…'}</span>
                  <span>›</span>
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Bewerberliste({ o, onBack, onChat }: { o: OwnedProperty; onBack: () => void; onChat: (mieterId: string) => void }) {
  const { kandidaten, anfragenPruefen } = useVermietung()
  const markt = marktMieteOf(o)
  const liste = kandidaten[o.uid] ?? []

  useEffect(() => {
    anfragenPruefen(o.uid, markt)
    const iv = window.setInterval(() => anfragenPruefen(o.uid, markt), 5000)
    return () => window.clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.uid])

  return (
    <div className="p-3">
      <button onClick={onBack} className="mb-2 text-sm font-semibold text-orange-600">‹ Objekte</button>
      <div className="mb-2 text-xs text-ink-500">Marktmiete ~{euro(markt)}/M · neue Anfragen treffen mit der Zeit ein.</div>
      {liste.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft">Noch keine Anfragen — schau gleich nochmal rein. ⏳</div>
      ) : (
        <div className="space-y-2">
          {liste.map((m) => (
            <button
              key={m.id}
              onClick={() => onChat(m.id)}
              className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft ring-1 ring-black/5 ${m.status === 'abgelehnt' ? 'opacity-50' : ''}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg">{m.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-ink-900">{m.name}</span>
                  <Badge tone={risikoTon(m.risiko)}>Risiko {m.risiko}</Badge>
                </div>
                <div className="truncate text-xs text-ink-500">{m.beruf} · Angebot {euro(m.angebot)}/M</div>
              </div>
              <span className="text-ink-300">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Verhandlung({ o, mieterId, onBack, onFertig }: { o: OwnedProperty; mieterId: string; onBack: () => void; onFertig: () => void }) {
  const { kandidaten, chats, fordern, aufraeumen } = useVermietung()
  const vermieten = useGame((s) => s.vermieten)
  const markt = marktMieteOf(o)
  const m: Mieter | undefined = (kandidaten[o.uid] ?? []).find((x) => x.id === mieterId)
  const verlauf = chats[mieterId] ?? []
  const [forderung, setForderung] = useState(markt)

  if (!m) {
    return (
      <div className="p-8 text-center text-sm text-ink-500">
        Bewerber nicht mehr verfügbar. <button onClick={onBack} className="text-orange-600">Zurück</button>
      </div>
    )
  }

  function abschliessen() {
    if (!m) return
    vermieten(o.uid, m.angebot, { name: m.name, risiko: m.risiko })
    aufraeumen(o.uid)
    onFertig()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-3 py-2">
        <button onClick={onBack} className="text-lg text-orange-600" aria-label="Zurück">‹</button>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-base">{m.emoji}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-ink-900">{m.name}</div>
          <div className="text-[11px] text-ink-500">{m.beruf} · Risiko {m.risiko}</div>
        </div>
      </div>

      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
        {verlauf.map((c, i) => (
          <div key={i} className={`flex ${c.from === 'spieler' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-soft ${c.from === 'spieler' ? 'rounded-br-md bg-orange-500 text-white' : 'rounded-bl-md bg-white text-ink-800 ring-1 ring-black/5'}`}>
              {c.text}
            </div>
          </div>
        ))}
      </div>

      {m.status === 'abgelehnt' ? (
        <div className="border-t border-slate-200 bg-white p-3 text-center text-sm text-rose-600">
          {m.name} ist abgesprungen. Zu hart verhandelt. 😕
        </div>
      ) : m.status === 'einig' ? (
        <div className="border-t border-slate-200 bg-white p-3">
          <button onClick={abschliessen} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white">
            ✅ Vermieten für {euro(m.angebot)}/Monat
          </button>
        </div>
      ) : (
        <div className="border-t border-slate-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-ink-600">Deine Forderung</span>
            <span className="font-black tabular-nums text-ink-900">{euro(forderung)}/M</span>
          </div>
          <input
            type="range"
            min={Math.round(markt * 0.5)}
            max={Math.round(markt * 1.7)}
            step={10}
            value={forderung}
            onChange={(e) => setForderung(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-orange-500"
          />
          <div className="mt-1 text-[11px] text-ink-400">
            Länger & fairer verhandeln bringt bessere Mieten. Runde {m.runden} · Geduld {m.geduld}
          </div>
          <button
            onClick={() => fordern(o.uid, m.id, forderung)}
            className="mt-2 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            {euro(forderung)} fordern
          </button>
        </div>
      )}
    </div>
  )
}
