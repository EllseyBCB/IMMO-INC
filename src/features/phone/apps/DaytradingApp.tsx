import { useEffect, useRef, useState } from 'react'
import { useTrading, START_GUTHABEN } from '../../../state/trading'
import { euro } from '../../../lib/format'
import type { PhoneNav } from '../nav'

interface Coin {
  id: string
  name: string
  kuerzel: string
  emoji: string
  basis: number // Fallback-Kurs, falls Live-Daten nicht erreichbar
}

const COINS: Coin[] = [
  { id: 'bitcoin', name: 'Bitcoin', kuerzel: 'BTC', emoji: '₿', basis: 92000 },
  { id: 'ethereum', name: 'Ethereum', kuerzel: 'ETH', emoji: '🔷', basis: 3200 },
  { id: 'solana', name: 'Solana', kuerzel: 'SOL', emoji: '◎', basis: 190 },
  { id: 'dogecoin', name: 'Dogecoin', kuerzel: 'DOGE', emoji: '🐕', basis: 0.32 },
]

interface Kurs {
  eur: number
  change: number
}

function kursText(v: number): string {
  if (v >= 100) return v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'
  if (v >= 1) return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  return v.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + ' €'
}

export default function DaytradingApp({ onClose }: { onClose: () => void; nav: PhoneNav }) {
  const { guthaben, positionen, kaufen, verkaufen, reset } = useTrading()
  const [kurse, setKurse] = useState<Record<string, Kurs>>({})
  const [live, setLive] = useState<boolean | null>(null)
  const [sel, setSel] = useState<string>('bitcoin')
  const [chart, setChart] = useState<number[]>([])
  const [betrag, setBetrag] = useState('')
  const [info, setInfo] = useState(false)
  const alive = useRef(true)

  // Live-Kurse pollen (CoinGecko, kostenlos & CORS-fähig)
  useEffect(() => {
    alive.current = true
    async function ladePreise() {
      try {
        const ids = COINS.map((c) => c.id).join(',')
        const r = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`,
        )
        if (!r.ok) throw new Error('http')
        const d = await r.json()
        if (!alive.current) return
        const next: Record<string, Kurs> = {}
        for (const c of COINS) {
          const row = d[c.id]
          if (row) next[c.id] = { eur: row.eur, change: row.eur_24h_change ?? 0 }
        }
        setKurse(next)
        setLive(true)
      } catch {
        if (!alive.current) return
        setLive(false)
        setKurse((prev) => {
          if (Object.keys(prev).length) return prev
          const fb: Record<string, Kurs> = {}
          for (const c of COINS) fb[c.id] = { eur: c.basis, change: 0 }
          return fb
        })
      }
    }
    ladePreise()
    const iv = window.setInterval(ladePreise, 15000)
    return () => {
      alive.current = false
      window.clearInterval(iv)
    }
  }, [])

  // Chart des gewählten Coins
  useEffect(() => {
    let ok = true
    fetch(`https://api.coingecko.com/api/v3/coins/${sel}/market_chart?vs_currency=eur&days=1`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (ok && Array.isArray(d.prices)) setChart(d.prices.map((p: [number, number]) => p[1]))
      })
      .catch(() => ok && setChart([]))
    return () => {
      ok = false
    }
  }, [sel])

  const coin = COINS.find((c) => c.id === sel)!
  const kurs = kurse[sel]?.eur ?? coin.basis
  const change = kurse[sel]?.change ?? 0
  const pos = positionen.find((p) => p.coinId === sel)
  const posWert = pos ? pos.menge * kurs : 0
  const posPl = pos ? posWert - pos.menge * pos.einstand : 0
  const gesamt = guthaben + positionen.reduce((s, p) => s + p.menge * (kurse[p.coinId]?.eur ?? COINS.find((c) => c.id === p.coinId)?.basis ?? 0), 0)
  const eur = Math.max(0, Math.round(Number(betrag.replace(',', '.')) || 0))

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="flex items-center gap-2 px-3 py-2 pt-3">
        <button onClick={onClose} className="text-lg text-slate-400" aria-label="Schließen">
          ✕
        </button>
        <span className="text-sm font-bold">💹 Daytrading</span>
        <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${live ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
          {live === null ? '…' : live ? '● LIVE' : 'offline'}
        </span>
        <button onClick={() => setInfo((v) => !v)} className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-white/10 text-xs font-bold" aria-label="Erklärung">
          ?
        </button>
        <button onClick={reset} className="text-[11px] text-slate-400">
          Reset
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-3">
        {/* Erklärung */}
        {info && (
          <div className="mt-3 rounded-2xl bg-indigo-950/60 p-4 text-sm leading-relaxed text-slate-200 ring-1 ring-indigo-400/30">
            <div className="mb-1 font-black text-indigo-300">So funktioniert Daytrading 💹</div>
            <p>
              Du handelst hier mit <b>echten Live-Kursen</b> von Kryptowährungen — aber mit einem <b>Übungskonto</b> (Startkapital
              {' '}{euro(START_GUTHABEN)}). Dein echtes Spielgeld bleibt unangetastet.
            </p>
            <ul className="mt-2 space-y-1.5">
              <li>📈 <b>Kaufen:</b> Du wettest, dass der Kurs <b>steigt</b>. Wähl eine Coin, gib einen Betrag ein und kauf sie zum aktuellen Kurs.</li>
              <li>📉 <b>Verkaufen:</b> Steigt der Kurs, verkaufst du <b>teurer</b> als du gekauft hast → <b>Gewinn</b>. Fällt er, machst du Verlust.</li>
              <li>⏱️ <b>Daytrading</b> heißt: schnelle Käufe & Verkäufe, um kleine Kursbewegungen mitzunehmen. Die Kurse aktualisieren sich alle paar Sekunden.</li>
              <li>🎯 Ziel: günstig kaufen, teuer verkaufen. Krypto schwankt stark — hohe Chance, hohes Risiko.</li>
              <li>🔄 <b>Reset</b> setzt das Übungskonto wieder auf {euro(START_GUTHABEN)}.</li>
            </ul>
            <button onClick={() => setInfo(false)} className="mt-3 w-full rounded-xl bg-indigo-600 py-2 text-sm font-bold text-white">
              Verstanden
            </button>
          </div>
        )}

        {/* Konto */}
        <div className="mt-3 rounded-2xl bg-slate-900 p-3 ring-1 ring-white/5">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Übungskonto · Gesamt</div>
          <div className="text-2xl font-black tabular-nums">{euro(gesamt)}</div>
          <div className="text-[11px] text-slate-400">
            Frei {euro(guthaben)} · von {euro(START_GUTHABEN)} Startkapital · Übungsgeld
          </div>
        </div>

        {/* Coin-Auswahl */}
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {COINS.map((c) => {
            const chg = kurse[c.id]?.change ?? 0
            return (
              <button
                key={c.id}
                onClick={() => setSel(c.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-left ${sel === c.id ? 'bg-slate-800 ring-1 ring-indigo-400' : 'bg-slate-900'}`}
              >
                <div className="text-sm font-bold">{c.emoji} {c.kuerzel}</div>
                <div className={`text-[10px] font-bold ${chg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {chg >= 0 ? '+' : ''}{chg.toFixed(1)} %
                </div>
              </button>
            )
          })}
        </div>

        {/* Kurs + Chart */}
        <div className="mt-3 rounded-2xl bg-slate-900 p-3 ring-1 ring-white/5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-black tabular-nums">{kursText(kurs)}</div>
              <div className={`text-sm font-bold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {change >= 0 ? '▲' : '▼'} {change.toFixed(2)} % · 24 h
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-500">{coin.name}</div>
          </div>
          <Chart werte={chart} positiv={change >= 0} />
        </div>

        {/* Position */}
        {pos && (
          <div className="mt-3 rounded-2xl bg-slate-900 p-3 ring-1 ring-white/5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Deine Position</div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span>{pos.menge.toLocaleString('de-DE', { maximumFractionDigits: 6 })} {coin.kuerzel}</span>
              <span className="font-bold tabular-nums">{euro(posWert)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Gewinn / Verlust</span>
              <span className={`font-bold ${posPl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {posPl >= 0 ? '+' : ''}{euro(posPl)}
              </span>
            </div>
          </div>
        )}

        {/* Handeln */}
        <div className="mt-3 rounded-2xl bg-slate-900 p-3 ring-1 ring-white/5">
          <input
            type="number"
            inputMode="numeric"
            value={betrag}
            onChange={(e) => setBetrag(e.target.value)}
            placeholder="Betrag in €"
            className="w-full rounded-xl bg-slate-800 px-3 py-2 text-right text-sm tabular-nums text-white outline-none"
          />
          <div className="mt-2 flex gap-2">
            {[100, 500, 1000].map((v) => (
              <button key={v} onClick={() => setBetrag(String(v))} className="flex-1 rounded-lg bg-slate-800 py-1.5 text-xs font-semibold text-slate-300">
                {euro(v)}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => { kaufen(sel, kurs, eur); setBetrag('') }}
              disabled={eur <= 0 || eur > guthaben}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              Kaufen
            </button>
            <button
              onClick={() => { if (pos && eur > 0) verkaufen(sel, kurs, eur / kurs); setBetrag('') }}
              disabled={!pos || eur <= 0}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              Verkaufen
            </button>
          </div>
          {pos && (
            <button
              onClick={() => verkaufen(sel, kurs, pos.menge)}
              className="mt-2 w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-300"
            >
              Alles verkaufen ({euro(posWert)})
            </button>
          )}
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-500">
          Echte Live-Kurse (CoinGecko), aber mit Übungsgeld — dein Spielkapital bleibt unberührt.
        </p>
      </div>
    </div>
  )
}

function Chart({ werte, positiv }: { werte: number[]; positiv: boolean }) {
  if (werte.length < 2) return <div className="mt-3 h-20" />
  const w = 100
  const h = 60
  const min = Math.min(...werte)
  const max = Math.max(...werte)
  const span = max - min || 1
  const pts = werte.map((v, i) => `${(i / (werte.length - 1)) * w},${h - ((v - min) / span) * h}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-20 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke={positiv ? '#34d399' : '#fb7185'} strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
