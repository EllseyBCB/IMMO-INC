import { useEffect, useRef, useState } from 'react'
import { euro, gameDate } from '../../lib/format'
import { portfolioWert, useGame, type OwnedProperty } from '../../state/game'
import { useMessages } from '../../state/messages'
import { Modal } from '../../components/ui'
import BautraegerModal, { type BeauftragtInfo } from '../portfolio/BautraegerModal'
import { CONTACTS, getContact, type Contact } from './contacts'
import { frageKontakt, type GameContext } from '../../lib/ai'
import VermietungApp from './VermietungApp'
import BautraegerApp from './BautraegerApp'
import BankingApp from './BankingApp'
import ShopApp from './ShopApp'

export default function Handy() {
  const [offen, setOffen] = useState<string | null>(null)
  const [appOffen, setAppOffen] = useState<string | null>(null)
  const contact = offen ? getContact(offen) : null

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-ink-900">Dein Handy</h1>
        <p className="text-sm text-ink-500">Kontakte anschreiben und Mieter verwalten.</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[380px]">
          <div className="rounded-[2.5rem] border-[10px] border-ink-900 bg-ink-900 shadow-2xl">
            <div className="relative h-[640px] overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-50 to-white">
              {contact ? (
                <ChatView contact={contact} onBack={() => setOffen(null)} />
              ) : appOffen === 'vermietung' ? (
                <VermietungApp onClose={() => setAppOffen(null)} />
              ) : appOffen === 'bautraeger' ? (
                <BautraegerApp onClose={() => setAppOffen(null)} />
              ) : appOffen === 'banking' ? (
                <BankingApp onClose={() => setAppOffen(null)} />
              ) : appOffen === 'shop' ? (
                <ShopApp onClose={() => setAppOffen(null)} />
              ) : (
                <HomeScreen onOpen={setOffen} onOpenApp={setAppOffen} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppKachel({ emoji, label, farbe, onClick }: { emoji: string; label: string; farbe: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br ${farbe} px-2 py-3 text-white shadow-md transition active:scale-[0.97]`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-xl">{emoji}</span>
      <span className="text-[11px] font-black">{label}</span>
    </button>
  )
}

function StatusBar() {
  const monthIndex = useGame((s) => s.monthIndex)
  return (
    <div className="relative flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-ink-700">
      <span>{gameDate(monthIndex).split(' ')[0]}</span>
      <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-ink-900" />
      <span>📶 🔋</span>
    </div>
  )
}

function HomeScreen({ onOpen, onOpenApp }: { onOpen: (id: string) => void; onOpenApp: (app: string) => void }) {
  const threads = useMessages((s) => s.threads)

  return (
    <div className="flex h-full flex-col">
      <StatusBar />

      {/* App-Kacheln */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-1 pt-2">
        <AppKachel emoji="🔑" label="Vermietung" farbe="from-emerald-400 to-emerald-600" onClick={() => onOpenApp('vermietung')} />
        <AppKachel emoji="🏗️" label="Bauträger" farbe="from-orange-400 to-orange-600" onClick={() => onOpenApp('bautraeger')} />
        <AppKachel emoji="🏦" label="Banking" farbe="from-brand-500 to-brand-700" onClick={() => onOpenApp('banking')} />
        <AppKachel emoji="🛍️" label="Shop" farbe="from-violet-500 to-fuchsia-600" onClick={() => onOpenApp('shop')} />
      </div>

      <div className="px-5 pb-2 pt-3">
        <h2 className="text-lg font-black text-ink-900">Nachrichten</h2>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {CONTACTS.map((c) => {
          const thread = threads[c.id] ?? []
          const letzte = thread[thread.length - 1]
          return (
            <button
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-100/70"
            >
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br ${c.farbe} text-xl shadow-md`}>
                {c.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-bold text-ink-900">{c.name}</span>
                </div>
                <div className="truncate text-xs text-ink-500">
                  {letzte ? `${letzte.from === 'player' ? 'Du: ' : ''}${letzte.text}` : c.role}
                </div>
              </div>
              <span className="text-ink-300">›</span>
            </button>
          )
        })}
      </div>
      <div className="px-5 pb-4">
        <div className="rounded-2xl bg-violet-50/70 p-3 text-center text-[11px] text-violet-700/80">
          Tipp: Frag die Bank nach deinem Zins, den Bauträger nach Sanierungen oder die Verwaltung nach Mietern.
        </div>
      </div>
    </div>
  )
}

function ChatView({ contact, onBack }: { contact: Contact; onBack: () => void }) {
  const { threads, ensureBegruessung, addPlayer, addContact } = useMessages()
  const game = useGame()
  const [text, setText] = useState('')
  const [tippt, setTippt] = useState(false)
  const [renoProperty, setRenoProperty] = useState<OwnedProperty | null>(null)
  const [pickerOffen, setPickerOffen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const thread = threads[contact.id] ?? []
  const istBautraeger = contact.id === 'bautraeger'
  const renovierbar = game.owned.filter((o) => o.renovierung?.status !== 'in_arbeit')

  function starteRenovierung() {
    if (game.owned.length === 0) {
      addContact('bautraeger', 'Du brauchst erst eine eigene Immobilie, die ich anpacken kann 😉 Kauf dir was auf dem Markt, dann leg ich los.')
      return
    }
    if (renovierbar.length === 0) {
      addContact('bautraeger', 'An deinen Objekten arbeite ich doch schon — lass mich die erst fertig machen. 😄')
      return
    }
    if (renovierbar.length === 1) setRenoProperty(renovierbar[0])
    else setPickerOffen(true)
  }

  function nachBeauftragung(info: BeauftragtInfo) {
    addPlayer('bautraeger', `Bitte „${info.titel}" renovieren: ${info.gewerke.join(', ')} — ${info.tempoLabel}.`)
    addContact(
      'bautraeger',
      `Top! Kostenvoranschlag ${euro(info.kosten)}, fertig in ${info.bauzeit} ${info.bauzeit === 1 ? 'Monat' : 'Monaten'}. Meine Truppe rückt an. 🛠️`,
    )
  }

  useEffect(() => {
    ensureBegruessung(contact.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread.length, tippt])

  function context(): GameContext {
    return {
      spielerName: game.spielerName,
      monat: gameDate(game.monthIndex),
      liquiditaet: game.cash,
      objekte: game.owned.length,
      portfolioWert: portfolioWert(game.owned),
    }
  }

  async function senden(nachricht: string) {
    const msg = nachricht.trim()
    if (!msg || tippt) return
    setText('')
    addPlayer(contact.id, msg)
    setTippt(true)
    const aktuell = [...(threads[contact.id] ?? []), { from: 'player' as const, text: msg, ts: Date.now() }]
    const res = await frageKontakt(contact, aktuell, msg, context())
    setTippt(false)
    addContact(contact.id, res.text)
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <StatusBar />
      {/* Kontakt-Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-3 py-2 backdrop-blur">
        <button onClick={onBack} className="rounded-lg px-2 py-1 text-lg text-brand-600" aria-label="Zurück">
          ‹
        </button>
        <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${contact.farbe} text-base shadow`}>
          {contact.emoji}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-ink-900">{contact.name}</div>
          <div className="truncate text-[11px] text-ink-500">{contact.role}</div>
        </div>
      </div>

      {/* Verlauf */}
      <div ref={scrollRef} className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {thread.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'player' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-soft ${
                m.from === 'player'
                  ? 'rounded-br-md bg-brand-500 text-white'
                  : 'rounded-bl-md bg-white text-ink-800 ring-1 ring-black/5'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {tippt && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-ink-400 shadow-soft ring-1 ring-black/5">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce [animation-delay:0.15s]">•</span>
                <span className="animate-bounce [animation-delay:0.3s]">•</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Vorschläge */}
      {thread.length <= 1 && !tippt && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2">
          {contact.vorschlaege.map((v) => (
            <button
              key={v}
              onClick={() => senden(v)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-brand-300 hover:text-brand-700"
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Aktion: Renovierung direkt beim Bauträger beauftragen */}
      {istBautraeger && (
        <div className="border-t border-slate-200 bg-white px-3 pt-2">
          <button
            onClick={starteRenovierung}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 py-2.5 text-sm font-bold text-white shadow-soft transition active:scale-[0.98]"
          >
            🔧 Renovierung beauftragen
          </button>
        </div>
      )}

      {/* Eingabe */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') senden(text)
          }}
          placeholder={`Nachricht an ${contact.name.split(' ')[0]}…`}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
        />
        <button
          onClick={() => senden(text)}
          disabled={!text.trim() || tippt}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-white transition disabled:opacity-40"
          aria-label="Senden"
        >
          ↑
        </button>
      </div>

      {/* Objekt-Auswahl für die Renovierung */}
      <Modal open={pickerOffen} onClose={() => setPickerOffen(false)} title="Welche Immobilie renovieren?">
        <div className="space-y-2">
          {renovierbar.map((o) => (
            <button
              key={o.uid}
              onClick={() => {
                setRenoProperty(o)
                setPickerOffen(false)
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-2 text-left transition hover:border-brand-300 hover:bg-slate-50"
            >
              <img src={o.property.bilder[0]} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink-900">{o.property.titel}</div>
                <div className="text-xs text-ink-500">
                  {o.property.stadtteil}, {o.property.stadt}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {renoProperty && (
        <BautraegerModal o={renoProperty} onClose={() => setRenoProperty(null)} onBeauftragt={nachBeauftragung} />
      )}
    </div>
  )
}
