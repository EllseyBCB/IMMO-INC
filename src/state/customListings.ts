import { create } from 'zustand'
import type { Property } from '../data/types'

const KEY = 'immo-inc-custom-listings-v1'

interface CustomState {
  objekte: Property[]
  hinzufuegen: (p: Property) => void
  entfernen: (id: string) => void
}

function load(): Property[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Property[]) : []
  } catch {
    return []
  }
}

function save(objekte: Property[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(objekte))
  } catch {
    /* ignore */
  }
}

export const useCustomListings = create<CustomState>((set, get) => ({
  objekte: load(),
  hinzufuegen: (p) => {
    // gleiche id -> ersetzen, sonst voranstellen
    const rest = get().objekte.filter((o) => o.id !== p.id)
    const next = [p, ...rest]
    set({ objekte: next })
    save(next)
  },
  entfernen: (id) => {
    const next = get().objekte.filter((o) => o.id !== id)
    set({ objekte: next })
    save(next)
  },
}))
