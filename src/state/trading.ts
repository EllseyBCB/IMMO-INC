import { create } from 'zustand'

// Daytrading-Simulator: eigenes Übungskonto (nicht das echte Spielgeld).
const KEY = 'immo-inc-trading-v1'
export const START_GUTHABEN = 10000

export interface TradePosition {
  coinId: string
  menge: number
  einstand: number // Ø-Einstandspreis (EUR)
}

interface Persist {
  guthaben: number
  positionen: TradePosition[]
}

function load(): Persist {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Persist
  } catch {
    /* ignore */
  }
  return { guthaben: START_GUTHABEN, positionen: [] }
}

function save(p: Persist) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

interface TradingState {
  guthaben: number
  positionen: TradePosition[]
  kaufen: (coinId: string, kurs: number, eur: number) => void
  verkaufen: (coinId: string, kurs: number, menge: number) => void
  reset: () => void
}

export const useTrading = create<TradingState>((set, get) => ({
  ...load(),
  kaufen: (coinId, kurs, eur) => {
    const s = get()
    const betrag = Math.min(eur, s.guthaben)
    if (betrag <= 0 || kurs <= 0) return
    const menge = betrag / kurs
    const idx = s.positionen.findIndex((p) => p.coinId === coinId)
    const positionen = [...s.positionen]
    if (idx >= 0) {
      const alt = positionen[idx]
      const neueMenge = alt.menge + menge
      positionen[idx] = { ...alt, menge: neueMenge, einstand: (alt.menge * alt.einstand + menge * kurs) / neueMenge }
    } else {
      positionen.push({ coinId, menge, einstand: kurs })
    }
    const next = { guthaben: s.guthaben - betrag, positionen }
    set(next)
    save(next)
  },
  verkaufen: (coinId, kurs, menge) => {
    const s = get()
    const idx = s.positionen.findIndex((p) => p.coinId === coinId)
    if (idx < 0) return
    const pos = s.positionen[idx]
    const m = Math.min(menge, pos.menge)
    if (m <= 0) return
    const erloes = m * kurs
    const positionen = [...s.positionen]
    if (pos.menge - m < 1e-9) positionen.splice(idx, 1)
    else positionen[idx] = { ...pos, menge: pos.menge - m }
    const next = { guthaben: s.guthaben + erloes, positionen }
    set(next)
    save(next)
  },
  reset: () => {
    const next = { guthaben: START_GUTHABEN, positionen: [] }
    set(next)
    save(next)
  },
}))
