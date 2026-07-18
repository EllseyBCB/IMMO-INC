import { useEffect, useRef, useState } from 'react'
import { useInternet } from '../../../state/internet'
import { chatOmgAntwort } from '../../../lib/chatomg'
import type { PhoneNav } from '../nav'

const VORSCHLAEGE = ['Wie viel Vermögen habe ich?', 'Grunderwerbsteuer in Bayern?', 'Welche Aktie läuft gerade?', 'Wie funktioniert Spekulationssteuer?']

export default function ChatOmgApp({ onClose }: { onClose: () => void; nav: PhoneNav }) {
  const { omg, omgAdd, omgReset } = useInternet()
  const [text, setText] = useState('')
  const [tippt, setTippt] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (omg.length === 0)
      omgAdd('contact', 'Hey, ich bin Chat OMG 🤖 — dein Assistent fürs Immobilien-Business. Frag mich alles zu deinem Vermögen, Steuern, Finanzierung oder der Börse.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [omg.length, tippt])

  function senden(frage: string) {
    const f = frage.trim()
    if (!f || tippt) return
    setText('')
    omgAdd('player', f)
    setTippt(true)
    const antwort = chatOmgAntwort(f)
    window.setTimeout(() => {
      omgAdd('contact', antwort)
      setTippt(false)
    }, 500)
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-2 pt-3 text-white">
        <button onClick={onClose} className="text-lg" aria-label="Schließen">
          ✕
        </button>
        <span className="grid h-6 w-6 place-items-center rounded-md bg-white/20 text-sm">🤖</span>
        <span className="text-sm font-bold">Chat OMG</span>
        <button onClick={omgReset} className="ml-auto text-[11px] text-white/80">
          Neu
        </button>
      </div>

      <div ref={scrollRef} className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {omg.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'player' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-soft ${
                m.from === 'player' ? 'rounded-br-md bg-teal-600 text-white' : 'rounded-bl-md bg-white text-ink-800 ring-1 ring-black/5'
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

      {omg.length <= 1 && !tippt && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2">
          {VORSCHLAEGE.map((v) => (
            <button
              key={v}
              onClick={() => senden(v)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-teal-300"
            >
              {v}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && senden(text)}
          placeholder="Frag Chat OMG…"
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:bg-white"
        />
        <button
          onClick={() => senden(text)}
          disabled={!text.trim() || tippt}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-600 text-white transition disabled:opacity-40"
          aria-label="Senden"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
