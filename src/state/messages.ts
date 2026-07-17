import { create } from 'zustand'
import type { ChatMessage } from '../lib/ai'
import { getContact } from '../features/handy/contacts'

const KEY = 'immo-inc-messages-v1'

type Threads = Record<string, ChatMessage[]>

interface MessagesState {
  threads: Threads
  ensureBegruessung: (contactId: string) => void
  addPlayer: (contactId: string, text: string) => void
  addContact: (contactId: string, text: string) => void
  alleLeeren: () => void
}

function load(): Threads {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Threads) : {}
  } catch {
    return {}
  }
}

function save(threads: Threads) {
  try {
    localStorage.setItem(KEY, JSON.stringify(threads))
  } catch {
    /* ignore */
  }
}

export const useMessages = create<MessagesState>((set, get) => ({
  threads: load(),

  ensureBegruessung: (contactId) => {
    const { threads } = get()
    if (threads[contactId]?.length) return
    const c = getContact(contactId)
    if (!c) return
    const next = {
      ...threads,
      [contactId]: [{ from: 'contact' as const, text: c.begruessung, ts: Date.now() }],
    }
    set({ threads: next })
    save(next)
  },

  addPlayer: (contactId, text) => {
    const { threads } = get()
    const next = {
      ...threads,
      [contactId]: [...(threads[contactId] ?? []), { from: 'player' as const, text, ts: Date.now() }],
    }
    set({ threads: next })
    save(next)
  },

  addContact: (contactId, text) => {
    const { threads } = get()
    const next = {
      ...threads,
      [contactId]: [...(threads[contactId] ?? []), { from: 'contact' as const, text, ts: Date.now() }],
    }
    set({ threads: next })
    save(next)
  },

  alleLeeren: () => {
    set({ threads: {} })
    save({})
  },
}))
