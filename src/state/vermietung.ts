import { create } from 'zustand'
import { generiereBewerber, verhandle, type Mieter } from '../data/mieter'

const KEY = 'immo-inc-vermietung-v1'

// Alle ~15 Sekunden trifft eine neue Anfrage ein (bis max. 4).
const ANFRAGE_INTERVALL_MS = 15000
const MAX_ANFRAGEN = 4

export interface ChatMsg {
  from: 'spieler' | 'mieter'
  text: string
}

interface Persist {
  kandidaten: Record<string, Mieter[]>
  chats: Record<string, ChatMsg[]>
  inseriert: Record<string, number> // uid -> Zeitstempel des Inserats (ms)
}

interface VermietungState extends Persist {
  /** Schaltet ein Inserat für ein Objekt (Anfragen treffen mit der Zeit ein). */
  inserieren: (uid: string, markt: number) => void
  /** Prüft, ob mit der Zeit neue Anfragen eingetroffen sind. */
  anfragenPruefen: (uid: string, markt: number) => void
  fordern: (uid: string, mieterId: string, forderung: number) => void
  ablehnen: (uid: string, mieterId: string) => void
  aufraeumen: (uid: string) => void
  istInseriert: (uid: string) => boolean
}

function load(): Persist {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      return { kandidaten: p.kandidaten ?? {}, chats: p.chats ?? {}, inseriert: p.inseriert ?? {} }
    }
  } catch {
    /* ignore */
  }
  return { kandidaten: {}, chats: {}, inseriert: {} }
}

function save(s: Persist) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ kandidaten: s.kandidaten, chats: s.chats, inseriert: s.inseriert }))
  } catch {
    /* ignore */
  }
}

function neuerBewerber(markt: number): Mieter {
  const b = generiereBewerber(markt)[0]
  return { ...b, id: crypto.randomUUID() }
}

function introChat(m: Mieter): ChatMsg {
  return {
    from: 'mieter',
    text: `Hallo! Ich interessiere mich für die Wohnung. Ich bin ${m.beruf}. ${m.profil} Ich würde ${m.wunschMiete.toLocaleString('de-DE')} € Kaltmiete zahlen.`,
  }
}

export const useVermietung = create<VermietungState>((set, get) => ({
  ...load(),

  istInseriert: (uid) => get().inseriert[uid] !== undefined,

  inserieren: (uid, markt) => {
    const s = get()
    if (s.inseriert[uid] !== undefined) return
    const erster = neuerBewerber(markt)
    set({
      inseriert: { ...s.inseriert, [uid]: Date.now() },
      kandidaten: { ...s.kandidaten, [uid]: [erster] },
      chats: { ...s.chats, [erster.id]: [introChat(erster)] },
    })
    save(get())
  },

  anfragenPruefen: (uid, markt) => {
    const s = get()
    const seit = s.inseriert[uid]
    if (seit === undefined) return
    const vorhanden = s.kandidaten[uid] ?? []
    const ziel = Math.min(MAX_ANFRAGEN, 1 + Math.floor((Date.now() - seit) / ANFRAGE_INTERVALL_MS))
    if (vorhanden.length >= ziel) return
    const neu = [...vorhanden]
    const chats = { ...s.chats }
    while (neu.length < ziel) {
      const b = neuerBewerber(markt)
      neu.push(b)
      chats[b.id] = [introChat(b)]
    }
    set({ kandidaten: { ...s.kandidaten, [uid]: neu }, chats })
    save(get())
  },

  fordern: (uid, mieterId, forderung) => {
    const s = get()
    const liste = s.kandidaten[uid] ?? []
    const m = liste.find((x) => x.id === mieterId)
    if (!m) return
    const r = verhandle(m, forderung)
    const kandidaten = { ...s.kandidaten, [uid]: liste.map((x) => (x.id === mieterId ? r.mieter : x)) }
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
    const inseriert = { ...s.inseriert }
    for (const m of kandidaten[uid] ?? []) delete chats[m.id]
    delete kandidaten[uid]
    delete inseriert[uid]
    set({ kandidaten, chats, inseriert })
    save(get())
  },
}))
