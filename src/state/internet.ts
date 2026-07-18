import { create } from 'zustand'
import type { ChatMessage } from '../lib/ai'

const KEY = 'immo-inc-internet-v1'

interface Persist {
  omg: ChatMessage[]
  suchen: string[]
}

function load(): Persist {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Persist
  } catch {
    /* ignore */
  }
  return { omg: [], suchen: [] }
}

function save(p: Persist) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

interface InternetState {
  omg: ChatMessage[]
  suchen: string[]
  omgAdd: (from: 'player' | 'contact', text: string) => void
  omgReset: () => void
  addSuche: (q: string) => void
}

export const useInternet = create<InternetState>((set, get) => ({
  ...load(),
  omgAdd: (from, text) => {
    const omg = [...get().omg, { from, text, ts: Date.now() }]
    set({ omg })
    save({ omg, suchen: get().suchen })
  },
  omgReset: () => {
    set({ omg: [] })
    save({ omg: [], suchen: get().suchen })
  },
  addSuche: (q) => {
    const suchen = [q, ...get().suchen.filter((s) => s !== q)].slice(0, 12)
    set({ suchen })
    save({ omg: get().omg, suchen })
  },
}))
