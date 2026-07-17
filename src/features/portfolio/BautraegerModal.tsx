import { useEffect, useRef, useState } from 'react'
import type { OwnedProperty } from '../../state/game'
import { useGame } from '../../state/game'
import type { Qualitaet, RenovationScope, Bautempo } from '../../data/types'
import { BAUTEMPO, QUALITAET_FAKTOR, RENOVATION_KATALOG, berechneRenovierung } from '../../data/renovation'
import { generiereAngebote, verhandleBau, stilTon, type Bauangebot } from '../../data/bauangebote'
import { Badge, Button, Modal, Stat } from '../../components/ui'
import { euro } from '../../lib/format'

export interface BeauftragtInfo {
  titel: string
  gewerke: string[]
  tempoLabel: string
  kosten: number
  bauzeit: number
  bautraeger?: string
}

type ChatMsg = { from: 'spieler' | 'bau'; text: string }

export default function BautraegerModal({
  o,
  onClose,
  onBeauftragt,
}: {
  o: OwnedProperty
  onClose: () => void
  onBeauftragt?: (info: BeauftragtInfo) => void
}) {
  const { cash, renovierenAushandeln } = useGame()
  const [scopes, setScopes] = useState<RenovationScope[]>([])
  const [qualitaet, setQualitaet] = useState<Qualitaet>('gehoben')
  const [tempo, setTempo] = useState<Bautempo>('standard')

  const [view, setView] = useState<'planen' | 'angebote' | 'chat'>('planen')
  const [angebote, setAngebote] = useState<Bauangebot[]>([])
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>({})
  const [aktivId, setAktivId] = useState<string | null>(null)

  const r = berechneRenovierung(
    scopes,
    qualitaet,
    tempo,
    o.property.wohnflaeche,
    o.property.marktwert,
    o.property.sanierungspotenzial,
  )
  const nichtsGewaehlt = scopes.length === 0
  const gewerkeLabels = scopes.map((s) => RENOVATION_KATALOG.find((x) => x.scope === s)?.label ?? s)

  function toggle(scope: RenovationScope) {
    setScopes((s) => (s.includes(scope) ? s.filter((x) => x !== scope) : [...s, scope]))
  }

  function angeboteEinholen() {
    const a = generiereAngebote(r.kosten, r.bauzeit)
    const c: Record<string, ChatMsg[]> = {}
    for (const b of a) {
      c[b.id] = [
        {
          from: 'bau',
          text: `Moin! Für ${gewerkeLabels.join(', ') || 'die Arbeiten'} veranschlage ich ${b.preis.toLocaleString('de-DE')} €, fertig in ${b.bauzeit} ${b.bauzeit === 1 ? 'Monat' : 'Monaten'}. ${b.profil}`,
        },
      ]
    }
    setAngebote(a)
    setChats(c)
    setView('angebote')
  }

  function bieten(id: string, gebot: number) {
    const b = angebote.find((x) => x.id === id)
    if (!b) return
    const re = verhandleBau(b, gebot)
    setAngebote((list) => list.map((x) => (x.id === id ? re.angebot : x)))
    setChats((c) => ({
      ...c,
      [id]: [...(c[id] ?? []), { from: 'spieler', text: re.spielerNachricht }, { from: 'bau', text: re.bauNachricht }],
    }))
  }

  function ablehnen(id: string) {
    setAngebote((list) => list.map((x) => (x.id === id ? { ...x, status: 'abgelehnt' as const } : x)))
    setAktivId(null)
  }

  function deal(b: Bauangebot) {
    if (b.angebot > cash) return
    renovierenAushandeln(o.uid, scopes, qualitaet, tempo, b.angebot, b.bauzeit, b.name)
    onBeauftragt?.({
      titel: o.property.titel,
      gewerke: gewerkeLabels,
      tempoLabel: BAUTEMPO[tempo].label,
      kosten: b.angebot,
      bauzeit: b.bauzeit,
      bautraeger: b.name,
    })
    onClose()
  }

  // ---- Verhandlungs-Chat ----------------------------------------------------
  const aktiv = angebote.find((x) => x.id === aktivId) ?? null
  if (view === 'chat' && aktiv) {
    return (
      <Modal open onClose={onClose} title="🏗️ Angebot verhandeln">
        <BauChat
          b={aktiv}
          basis={r.kosten}
          thread={chats[aktiv.id] ?? []}
          zuTeuer={aktiv.angebot > cash}
          onBack={() => setView('angebote')}
          onBieten={(g) => bieten(aktiv.id, g)}
          onAblehnen={() => {
            ablehnen(aktiv.id)
            setView('angebote')
          }}
          onDeal={() => deal(aktiv)}
        />
      </Modal>
    )
  }

  // ---- Angebotsliste --------------------------------------------------------
  if (view === 'angebote') {
    return (
      <Modal open onClose={onClose} title="🏗️ Bauträger-Angebote">
        <p className="text-sm text-ink-500">
          {angebote.length} Angebote für <span className="font-semibold text-ink-700">{gewerkeLabels.join(', ')}</span>.
          Tipp: verhandeln lohnt sich!
        </p>
        <div className="mt-3 space-y-2">
          {angebote.map((b) => (
            <button
              key={b.id}
              disabled={b.status === 'abgelehnt'}
              onClick={() => {
                setAktivId(b.id)
                setView('chat')
              }}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                b.status === 'abgelehnt' ? 'border-slate-200 bg-slate-50 opacity-50' : 'border-slate-200 hover:border-brand-300'
              }`}
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl">{b.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-ink-900">{b.name}</span>
                  <Badge tone={stilTon(b.stil)}>{b.stil}</Badge>
                </div>
                <div className="text-[11px] text-ink-500">fertig in {b.bauzeit} {b.bauzeit === 1 ? 'Monat' : 'Monaten'}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-bold text-ink-900">{euro(b.angebot)}</div>
                <div className="text-[10px] text-ink-400">Angebot</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="ghost" className="w-full" onClick={() => setView('planen')}>
            ← Umfang ändern
          </Button>
        </div>
      </Modal>
    )
  }

  // ---- Planen ---------------------------------------------------------------
  return (
    <Modal open onClose={onClose} title="🏗️ Bauträger — Renovierung planen">
      <p className="text-sm text-ink-500">
        Wähle Gewerke für <span className="font-semibold text-ink-700">{o.property.titel}</span> ({o.property.wohnflaeche} m²).
        Danach holst du dir Angebote und verhandelst den Preis.
      </p>

      <div className="mt-4 space-y-2">
        {RENOVATION_KATALOG.map((item) => {
          const aktivG = scopes.includes(item.scope)
          const einzel = berechneRenovierung(
            [item.scope],
            qualitaet,
            tempo,
            o.property.wohnflaeche,
            o.property.marktwert,
            o.property.sanierungspotenzial,
          )
          return (
            <button
              key={item.scope}
              onClick={() => toggle(item.scope)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                aktivG ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink-900">{item.label}</span>
                <span className="block text-xs text-ink-500">{item.beschreibung}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-bold text-ink-900">{euro(einzel.kosten)}</span>
                <span className={`grid h-5 w-5 place-items-center rounded-md text-xs ${aktivG ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {aktivG ? '✓' : '+'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <div className="mb-1 text-sm font-medium text-ink-700">Ausführungsqualität</div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(QUALITAET_FAKTOR) as Qualitaet[]).map((q) => (
            <button
              key={q}
              onClick={() => setQualitaet(q)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                qualitaet === q ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-700'
              }`}
            >
              {QUALITAET_FAKTOR[q].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-sm font-medium text-ink-700">Bautempo — Zeit gegen Geld</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(BAUTEMPO) as Bautempo[]).map((tp) => {
            const info = BAUTEMPO[tp]
            const aktivT = tempo === tp
            return (
              <button
                key={tp}
                onClick={() => setTempo(tp)}
                title={info.beschreibung}
                className={`rounded-xl border px-2 py-2 text-center transition ${
                  aktivT ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-700 hover:border-slate-300'
                }`}
              >
                <div className="text-lg leading-none">{info.emoji}</div>
                <div className="mt-1 text-xs font-bold">{info.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {!nichtsGewaehlt && (
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
          <Stat label="Richtpreis" value={euro(r.kosten)} tone="down" />
          <Stat label="Wertsteigerung" value={euro(r.wertsteigerung)} tone="up" />
          <Stat label="Bauzeit ~" value={`${r.bauzeit} Mon`} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Abbrechen
        </Button>
        <Button className="flex-1" disabled={nichtsGewaehlt} onClick={angeboteEinholen}>
          Angebote einholen
        </Button>
      </div>
    </Modal>
  )
}

function BauChat({
  b,
  basis,
  thread,
  zuTeuer,
  onBack,
  onBieten,
  onAblehnen,
  onDeal,
}: {
  b: Bauangebot
  basis: number
  thread: ChatMsg[]
  zuTeuer: boolean
  onBack: () => void
  onBieten: (gebot: number) => void
  onAblehnen: () => void
  onDeal: () => void
}) {
  const [gebot, setGebot] = useState(b.angebot)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread.length])

  const min = Math.max(500, Math.round(Math.min(b.minPreis, basis) * 0.7))
  const max = b.preis
  const abgelehnt = b.status === 'abgelehnt'

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button onClick={onBack} className="rounded-lg px-2 py-1 text-lg text-brand-600" aria-label="Zurück">
          ‹
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-base">{b.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-ink-900">{b.name}</span>
            <Badge tone={stilTon(b.stil)}>{b.stil}</Badge>
          </div>
          <div className="text-[11px] text-ink-500">fertig in {b.bauzeit} {b.bauzeit === 1 ? 'Monat' : 'Monaten'}</div>
        </div>
      </div>

      <div ref={scrollRef} className="no-scrollbar max-h-[38vh] space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
        {thread.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'spieler' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                m.from === 'spieler' ? 'rounded-br-md bg-brand-500 text-white' : 'rounded-bl-md bg-white text-ink-800 ring-1 ring-black/5'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {abgelehnt && (
          <div className="rounded-xl bg-rose-50 p-2 text-center text-xs font-medium text-rose-700">
            {b.name} ist aus der Verhandlung ausgestiegen.
          </div>
        )}
      </div>

      {!abgelehnt && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-ink-500">Dein Gebot</span>
            <span className="font-bold tabular-nums text-ink-900">{euro(gebot)}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={100}
            value={gebot}
            onChange={(e) => setGebot(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => onBieten(gebot)}>
              {euro(gebot)} bieten
            </Button>
            <Button variant="success" disabled={zuTeuer} onClick={onDeal}>
              Beauftragen · {euro(b.angebot)}
            </Button>
          </div>
          {zuTeuer && <p className="mt-2 text-center text-xs font-medium text-rose-600">Nicht genug Liquidität für {euro(b.angebot)}.</p>}
          <button onClick={onAblehnen} className="mt-2 w-full py-1 text-[11px] font-semibold text-rose-500">
            Angebot ablehnen
          </button>
        </div>
      )}
    </div>
  )
}
