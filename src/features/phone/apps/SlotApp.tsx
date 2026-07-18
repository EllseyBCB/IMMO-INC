import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../../state/game'
import { euro } from '../../../lib/format'
import type { PhoneNav } from '../nav'

// Book-of-…-Slot: 5 Walzen × 3 Reihen, 10 Gewinnlinien, Buch = Wild & Scatter,
// 3+ Bücher lösen 10 Freispiele mit expandierendem Sondersymbol aus.
// Bewusst schlechte Quote — auf Dauer verliert man, wie im echten Casino.

const BOOK = '📖'
interface Sym {
  k: string
  w: number
  pay: Record<number, number> // Anzahl gleicher -> x Linieneinsatz
}
const SYMBOLS: Sym[] = [
  { k: '🧭', w: 5, pay: { 3: 10, 4: 100, 5: 500 } },
  { k: '🗿', w: 6, pay: { 3: 8, 4: 40, 5: 200 } },
  { k: '🪲', w: 8, pay: { 3: 5, 4: 30, 5: 150 } },
  { k: '🏺', w: 9, pay: { 3: 5, 4: 25, 5: 100 } },
  { k: '💎', w: 11, pay: { 3: 2, 4: 10, 5: 75 } },
  { k: '⭐', w: 12, pay: { 3: 2, 4: 10, 5: 75 } },
]
const BOOK_PAY: Record<number, number> = { 3: 2, 4: 20, 5: 200 } // x Gesamteinsatz (Scatter)
const ALLE = [...SYMBOLS, { k: BOOK, w: 3, pay: {} }]
const GESAMT_W = ALLE.reduce((s, x) => s + x.w, 0)
const PAYMAP: Record<string, Record<number, number>> = Object.fromEntries(SYMBOLS.map((s) => [s.k, s.pay]))

// 10 Gewinnlinien (Reihen-Index je Walze)
const LINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
]
const EINSAETZE = [10, 50, 100, 500]

function zieh(): string {
  let r = Math.random() * GESAMT_W
  for (const s of ALLE) {
    r -= s.w
    if (r <= 0) return s.k
  }
  return ALLE[ALLE.length - 1].k
}
function ziehGrid(): string[][] {
  return Array.from({ length: 5 }, () => [zieh(), zieh(), zieh()])
}

interface LineWin {
  line: number
  sym: string
  count: number
  gewinn: number
}
function lineWins(grid: string[][], lineBet: number): { gewinn: number; wins: LineWin[]; cells: Set<string> } {
  const wins: LineWin[] = []
  const cells = new Set<string>()
  let gewinn = 0
  LINES.forEach((line, li) => {
    let sym: string | null = null
    let count = 0
    for (let reel = 0; reel < 5; reel++) {
      const s = grid[reel][line[reel]]
      if (s === BOOK) {
        count++
        continue
      }
      if (sym === null) {
        sym = s
        count++
      } else if (s === sym) {
        count++
      } else break
    }
    if (sym && count >= 3 && PAYMAP[sym]?.[count]) {
      const g = Math.round(PAYMAP[sym][count] * lineBet)
      gewinn += g
      wins.push({ line: li, sym, count, gewinn: g })
      for (let reel = 0; reel < count; reel++) cells.add(`${reel}-${line[reel]}`)
    }
  })
  return { gewinn, wins, cells }
}
function scatter(grid: string[][]): number {
  return grid.reduce((s, reel) => s + reel.filter((x) => x === BOOK).length, 0)
}
function expandWin(grid: string[][], sym: string, lineBet: number): number {
  const reels = grid.filter((reel) => reel.some((s) => s === sym || s === BOOK)).length
  if (reels < 3) return 0
  return Math.round((PAYMAP[sym]?.[reels] ?? 0) * lineBet * LINES.length)
}

interface Step {
  grid: string[][]
  gewinn: number
  cells: Set<string>
  frei: boolean
  banner?: string
}
function berechne(einsatz: number): { steps: Step[]; total: number } {
  const lineBet = einsatz / LINES.length
  const base = ziehGrid()
  const bl = lineWins(base, lineBet)
  const sc = scatter(base)
  let gewinn = bl.gewinn
  if (sc >= 3) gewinn += Math.round((BOOK_PAY[sc] ?? BOOK_PAY[5]) * einsatz)
  const steps: Step[] = [{ grid: base, gewinn, cells: bl.cells, frei: false }]
  let total = gewinn

  if (sc >= 3) {
    const expand = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].k
    for (let i = 0; i < 10; i++) {
      const g = ziehGrid()
      const ew = expandWin(g, expand, lineBet)
      const lw = lineWins(g, lineBet)
      const win = Math.max(ew, lw.gewinn)
      const cells = ew > lw.gewinn ? new Set(g.flatMap((reel, r) => (reel.some((s) => s === expand || s === BOOK) ? [0, 1, 2].map((row) => `${r}-${row}`) : []))) : lw.cells
      steps.push({ grid: g, gewinn: win, cells, frei: true, banner: `Freispiel ${i + 1}/10 · ${expand}` })
      total += win
    }
  }
  return { steps, total }
}

export default function SlotApp({ onClose }: { onClose: () => void; nav: PhoneNav }) {
  const cash = useGame((s) => s.cash)
  const gluecksspiel = useGame((s) => s.gluecksspiel)
  const [grid, setGrid] = useState<string[][]>(ziehGrid())
  const [einsatz, setEinsatz] = useState(50)
  const [spinning, setSpinning] = useState(false)
  const [cells, setCells] = useState<Set<string>>(new Set())
  const [banner, setBanner] = useState<string | null>(null)
  const [gewinnAnzeige, setGewinnAnzeige] = useState<number | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  function spin() {
    if (spinning || einsatz > cash) return
    setSpinning(true)
    setCells(new Set())
    setBanner(null)
    setGewinnAnzeige(null)
    const { steps, total } = berechne(einsatz)

    // Walzen-Blur
    let ticks = 0
    const blur = window.setInterval(() => {
      setGrid(ziehGrid())
      if (++ticks > 10) {
        window.clearInterval(blur)
        spieleSteps(steps, total)
      }
    }, 60)
  }

  function spieleSteps(steps: Step[], total: number) {
    let laufend = 0
    const zeige = (i: number) => {
      const step = steps[i]
      setGrid(step.grid)
      setCells(step.cells)
      laufend += step.gewinn
      setGewinnAnzeige(laufend)
      setBanner(step.banner ?? (i === 0 && steps.length > 1 ? '📖 3 Bücher — 10 FREISPIELE!' : null))
      if (i + 1 < steps.length) {
        const t = window.setTimeout(() => zeige(i + 1), step.frei ? 650 : 900)
        timers.current.push(t)
      } else {
        gluecksspiel(einsatz, total)
        setSpinning(false)
      }
    }
    zeige(0)
  }

  const lineBet = einsatz / LINES.length

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-amber-950 via-yellow-900 to-amber-950 text-amber-50">
      <div className="flex items-center gap-2 px-3 py-2 pt-3">
        <button onClick={onClose} className="text-lg text-amber-200" aria-label="Schließen">
          ✕
        </button>
        <span className="text-sm font-black tracking-wide">📖 Book of IMMO</span>
        <span className="ml-auto rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold tabular-nums">{euro(cash)}</span>
      </div>

      <div className="flex flex-1 flex-col justify-center px-2">
        {/* Banner */}
        <div className="mb-2 h-6 text-center text-sm font-black text-amber-300">{banner}</div>

        {/* 5×3 Walzen */}
        <div className="mx-auto grid grid-cols-5 gap-1 rounded-2xl bg-black/50 p-2 ring-2 ring-amber-500/40">
          {[0, 1, 2, 3, 4].map((reel) =>
            [0, 1, 2].map((row) => {
              const hot = cells.has(`${reel}-${row}`)
              return (
                <div
                  key={`${reel}-${row}`}
                  className={`grid aspect-square place-items-center rounded-lg text-3xl transition ${
                    hot ? 'bg-amber-300 ring-2 ring-amber-100' : 'bg-gradient-to-b from-amber-100/95 to-amber-200/90'
                  } ${spinning ? 'blur-[1px]' : ''}`}
                >
                  {grid[reel]?.[row] ?? '⭐'}
                </div>
              )
            }),
          )}
        </div>

        {/* Gewinnanzeige */}
        <div className="mt-2 h-7 text-center">
          {gewinnAnzeige !== null &&
            (gewinnAnzeige > 0 ? (
              <span className="text-lg font-black text-emerald-300">🎉 Gewinn {euro(gewinnAnzeige)}</span>
            ) : (
              <span className="text-sm font-bold text-amber-300/60">Kein Gewinn</span>
            ))}
        </div>

        {/* Einsatz */}
        <div className="mt-1 flex justify-center gap-2">
          {EINSAETZE.map((e) => (
            <button
              key={e}
              onClick={() => setEinsatz(e)}
              disabled={spinning}
              className={`rounded-xl px-3 py-1.5 text-sm font-bold ${einsatz === e ? 'bg-amber-400 text-amber-950' : 'bg-black/30 text-amber-100'}`}
            >
              {euro(e)}
            </button>
          ))}
        </div>
        <div className="mt-1 text-center text-[10px] text-amber-200/50">
          {LINES.length} Linien · {euro(Math.round(lineBet))}/Linie · Buch = Wild &amp; Scatter
        </div>

        <button
          onClick={spin}
          disabled={spinning || einsatz > cash}
          className="mx-auto mt-3 w-full max-w-[260px] rounded-2xl bg-gradient-to-b from-rose-500 to-rose-700 py-3.5 text-base font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-50"
        >
          {spinning ? 'Dreht…' : einsatz > cash ? 'Zu wenig Geld' : `DREHEN · ${euro(einsatz)}`}
        </button>
        <p className="mt-2 text-center text-[10px] text-amber-200/40">Nur zum Spaß — der Hausvorteil sorgt dafür, dass man auf Dauer verliert.</p>
      </div>
    </div>
  )
}
