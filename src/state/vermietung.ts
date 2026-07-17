import { create } from 'zustand'
import { generiereBewerber, verhandle, type Mieter } from '../data/mieter'

const KEY = 'immo-inc-vermietung-v1'

export interface ChatMsg {
  from: 'spieler' | 'mieter'
  text: string
}

interface VermietungState {
  kandidaten: Record<string, Mieter[]> // ownedUid -> Bewerber
  chats: Record<string, ChatMsg[]> // mieterId -> Verlauf
  sucheMieter: (uid: string, markt: number) => void
  fordern: (uid: string, mieterId: string, forderung: number) => void
  ablehnen: (uid: string, mieterId: string) => void
  aufraeumen: (uid: string) => void
}

function load(): Pick<VermietungState, 'kandidaten' | 'chats'> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { kandidaten: {}, chats: {} }
}

function save(s: Pick<VermietungState, 'kandidaten' | 'chats'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ kandidaten: s.kandidaten, chats: s.chats }))
  } catch {
    /* ignore */
  }
}

export const useVermietung = create<VermietungState>((set, get) => ({
  ...load(),

  sucheMieter: (uid, markt) => {
    const bewerber = generiereBewerber(markt)
    const chats = { ...get().chats }
    for (const m of bewerber) {
      chats[m.id] = [
        {
          from: 'mieter',
          text: `Hallo! Ich interessiere mich für die Wohnung. Ich bin ${m.beruf}. ${m.profil} Ich würde ${m.wunschMiete.toLocaleString('de-DE')} € Kaltmiete zahlen.`,
        },
      ]
    }
    const kandidaten = { ...get().kandidaten, [uid]: bewerber }
    set({ kandidaten, chats })
    save(get())
  },

  fordern: (uid, mieterId, forderung) => {
    const s = get()
    const liste = s.kandidaten[uid] ?? []
    const m = liste.find((x) => x.id === mieterId)
    if (!m) return
    const r = verhandle(m, forderung)
    const kandidaten = {
      ...s.kandidaten,
      [uid]: liste.map((x) => (x.id === mieterId ? r.mieter : x)),
    }
    const chats = {
      ...s.chats,
      [mieterId]: [
        ...(s.chats[mieterId] ?? []),
        { from: 'spieler' as const, text: r.spielerNachricht },
        { from: 'mieter' as const, text: r.mieterNachricht },
      ],
    }
    set({ kandidaten, chats })
    save(get())
  },

  ablehnen: (uid, mieterId) => {
    const s = get()
    const liste = s.kandidaten[uid] ?? []
    const kandidaten = {
      ...s.kandidaten,
      [uid]: liste.map((x) => (x.id === mieterId ? { ...x, status: 'abgelehnt' as const } : x)),
    }
    set({ kandidaten })
    save(get())
  },

  aufraeumen: (uid) => {
    const s = get()
    const kandidaten = { ...s.kandidaten }
    const chats = { ...s.chats }
    for (const m of kandidaten[uid] ?? []) delete chats[m.id]
    delete kandidaten[uid]
    set({ kandidaten, chats })
    save(get())
  },
}))
