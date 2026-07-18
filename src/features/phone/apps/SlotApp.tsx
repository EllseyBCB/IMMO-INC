import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../../state/game'
import { euro } from '../../../lib/format'
import type { PhoneNav } from '../nav'

// Ägypten-Slot im „Book of …"-Stil. Bewusst schlechte Quote (RTP ~83 %) —
// auf Dauer verliert man, wie an einer echten Slotmaschine.
interface Sym {
  e: string
  name: string
  w: number // Gewichtung (Häufigkeit)
  m3: number // Auszahlung x Einsatz bei 3 gleichen
  m2: number // Auszahlung x Einsatz bei 2 gleichen
}

const SYMBOLS: Sym[] = [
  { e: '📕', name: 'Buch', w: 2, m3: 120, m2: 12 },
  { e: '🧭', name: 'Forscher', w: 4, m3: 50, m2: 5 },
  { e: '🐍', name: 'Kobra', w: 7, m3: 22, m2: 2 },
  { e: '🏺', name: 'Statue', w: 11, m3: 12, m2: 1 },
  { e: '🪲', name: 'Skarabäus', w: 16, m3: 7, m2: 0.5 },
  { e: '💰', name: 'Gold', w: 20, m3: 4, m2: 0.4 },
]
const GESAMT_W = SYMBOLS.reduce((s, x) => s + x.w, 0)
const EINSAETZE = [10, 50, 100, 500]

function zufallsSymbol(): Sym {
  let r = Math.random() * GESAMT_W
  for (const s of SYMBOLS) {
    r -= s.w
    if (r <= 0) return s
  }
  return SYMBOLS[SYMBOLS.length - 1]
}

function gewinnBerechnen(reels: Sym[], einsatz: number): number {
  const [a, b, c] = reels
  if (a.e === b.e && b.e === c.e) return Math.round(einsatz * a.m3)
  // genau zwei gleiche
  const paar = a.e === b.e ? a : b.e === c.e ? b : a.e === c.e ? a : null
  if (paar) return Math.round(einsatz * paar.m2)
  return 0
}

export default function SlotApp({ onClose }: { onClose: () => void; nav: PhoneNav }) {
  const cash = useGame((s) => s.cash)
  const gluecksspiel = useGame((s) => s.gluecksspiel)
  const [reels, setReels] = useState<Sym[]>([SYMBOLS[0], SYMBOLS[2], SYMBOLS[4]])
  const [einsatz, setEinsatz] = useState(50)
  const [spinning, setSpinning] = useState(false)
  const [ergebnis, setErgebnis] = useState<number | null>(null)
  const [verlauf, setVerlauf] = useState<{ gewinn: number; einsatz: number }[]>([])
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, [])

  function spin() {
    if (spinning || einsatz > cash) return
    setSpinning(true)
    setErgebnis(null)
    let ticks = 0
    if (timer.current) window.clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      setReels([zufallsSymbol(), zufallsSymbol(), zufallsSymbol()])
      ticks++
      if (ticks > 12) {
        window.clearInterval(timer.current!)
        const final = [zufallsSymbol(), zufallsSymbol(), zufallsSymbol()]
        const gewinn = gewinnBerechnen(final, einsatz)
        setReels(final)
        gluecksspiel(einsatz, gewinn)
        setErgebnis(gewinn)
        setVerlauf((v) => [{ gewinn, einsatz }, ...v].slice(0, 8))
        setSpinning(false)
      }
    }, 70)
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-amber-950 to-yellow-900 text-amber-50">
      <div className="flex items-center gap-2 px-3 py-2 pt-3">
        <button onClick={onClose} className="text-lg text-amber-200" aria-label="Schließen">
          ✕
        </button>
        <span className="text-sm font-black tracking-wide">🎰 Book of IMMO</span>
        <span className="ml-auto rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold tabular-nums">{euro(cash)}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {/* Walzen */}
        <div className="flex gap-2 rounded-2xl bg-black/40 p-3 shadow-inner ring-2 ring-amber-500/40">
          {reels.map((s, i) => (
            <div
              key={i}
              className={`grid h-24 w-20 place-items-center rounded-xl bg-gradient-to-b from-amber-100 to-amber-300 text-5xl shadow ${spinning ? 'animate-pulse' : ''}`}
            >
              {s.e}
            </div>
          ))}
        </div>

        {/* Ergebnis */}
        <div className="mt-4 h-8 text-center">
          {ergebnis !== null &&
            (ergebnis > 0 ? (
              <div className="text-lg font-black text-emerald-300">🎉 Gewinn {euro(ergebnis)}!</div>
            ) : (
              <div className="text-sm font-bold text-amber-300/70">Leider nichts — nochmal?</div>
            ))}
        </div>

        {/* Einsatz */}
        <div className="mt-2 flex gap-2">
          {EINSAETZE.map((e) => (
            <button
              key={e}
              onClick={() => setEinsatz(e)}
              disabled={spinning}
              className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${
                einsatz === e ? 'bg-amber-400 text-amber-950' : 'bg-black/30 text-amber-100'
              }`}
            >
              {euro(e)}
            </button>
          ))}
        </div>

        <button
          onClick={spin}
          disabled={spinning || einsatz > cash}
          className="mt-4 w-full max-w-[240px] rounded-2xl bg-gradient-to-b from-rose-500 to-rose-700 py-3.5 text-base font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-50"
        >
          {spinning ? 'Dreht…' : einsatz > cash ? 'Zu wenig Geld' : `DREHEN · ${euro(einsatz)}`}
        </button>

        <p className="mt-3 max-w-[280px] text-center text-[10px] leading-snug text-amber-200/50">
          Nur zum Spaß. Die Quote ist bewusst schlecht (Hausvorteil ~17 %) — auf Dauer verliert man, wie im echten Casino.
        </p>
      </div>

      {/* Verlauf */}
      {verlauf.length > 0 && (
        <div className="border-t border-white/10 px-4 py-2">
          <div className="flex gap-1.5 overflow-x-auto">
            {verlauf.map((v, i) => (
              <span
                key={i}
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  v.gewinn > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-black/30 text-amber-200/60'
                }`}
              >
                {v.gewinn > 0 ? `+${euro(v.gewinn)}` : `−${euro(v.einsatz)}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
