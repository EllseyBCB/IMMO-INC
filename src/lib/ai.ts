import { CONTACTS, lokaleAntwort, type Contact } from '../features/handy/contacts'

// URL der Supabase Edge Function (Projekt "Elis Projekt"). Der OpenAI-Key liegt
// serverseitig als Secret — hier steht KEIN Key.
export const AI_EMAIL_URL = 'https://mpvosmtsbvwasvnzjuwd.supabase.co/functions/v1/ai-email'

export interface ChatMessage {
  from: 'player' | 'contact'
  text: string
  ts: number
}

export interface GameContext {
  spielerName: string
  monat: string
  liquiditaet: number
  objekte: number
  portfolioWert: number
}

export interface AntwortResultat {
  text: string
  quelle: 'ki' | 'lokal'
}

/**
 * Holt eine Antwort eines Kontakts. Versucht die KI-Edge-Function; fällt bei
 * fehlendem Key, Fehler oder Netzwerkproblem auf die lokale Engine zurück.
 */
export async function frageKontakt(
  contact: Contact,
  history: ChatMessage[],
  message: string,
  context: GameContext,
): Promise<AntwortResultat> {
  const fallback = (): AntwortResultat => ({
    text: lokaleAntwort(contact.id, message, {
      liquiditaet: context.liquiditaet,
      objekte: context.objekte,
    }),
    quelle: 'lokal',
  })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(AI_EMAIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contact: { name: contact.name, role: contact.role, persona: contact.persona },
        history: history.map((h) => ({ from: h.from, text: h.text })),
        message,
        context,
      }),
    })
    clearTimeout(timeout)
    if (!res.ok) return fallback()
    const data = await res.json()
    if (data && typeof data.reply === 'string' && data.reply.trim()) {
      return { text: data.reply.trim(), quelle: 'ki' }
    }
    return fallback()
  } catch {
    return fallback()
  }
}

export { CONTACTS }
