// Navigation für das Phone-OS: ein einfacher App-Stack (wie ein iPhone).

export type AppId =
  | 'immobilien'
  | 'objekt'
  | 'portfolio'
  | 'bank'
  | 'konten'
  | 'boerse'
  | 'shop'
  | 'bautraeger'
  | 'renovieren'
  | 'finanzen'
  | 'daytrading'
  | 'slot'
  | 'nachrichten'
  | 'giggle'
  | 'chatomg'
  | 'einstellungen'

export interface PhoneNav {
  /** Öffnet eine App (optional mit Props, z. B. Suchbegriff). */
  open: (app: AppId, props?: Record<string, unknown>) => void
  /** Öffnet die Objekt-Detailseite. */
  openObjekt: (id: string) => void
  /** Öffnet Giggle mit einer vorbelegten Suche (für Recherche-Gating). */
  giggle: (query: string) => void
  /** Einen Schritt zurück. */
  back: () => void
  /** Zurück zum Home-Screen. */
  home: () => void
}

export interface AppMeta {
  id: AppId
  label: string
  emoji: string
  farbe: string
  /** true = App bringt eigene Kopfzeile mit (kein generischer AppBar). */
  native?: boolean
}

export const APPS: AppMeta[] = [
  { id: 'immobilien', label: 'ImmoProud', emoji: '🏙️', farbe: 'from-orange-400 to-red-500', native: true },
  { id: 'portfolio', label: 'Portfolio', emoji: '🗂️', farbe: 'from-amber-400 to-orange-500' },
  { id: 'bank', label: 'Bank', emoji: '🏦', farbe: 'from-emerald-400 to-teal-600' },
  { id: 'konten', label: 'Starkasse', emoji: '🏛️', farbe: 'from-red-500 to-red-700', native: true },
  { id: 'boerse', label: 'Börse', emoji: '📈', farbe: 'from-indigo-500 to-blue-600', native: true },
  { id: 'shop', label: 'Shop', emoji: '🛍️', farbe: 'from-violet-500 to-fuchsia-600', native: true },
  { id: 'bautraeger', label: 'Bauträger', emoji: '🏗️', farbe: 'from-orange-400 to-orange-600', native: true },
  { id: 'renovieren', label: 'Renovieren', emoji: '🔨', farbe: 'from-orange-500 to-amber-600', native: true },
  { id: 'daytrading', label: 'Daytrading', emoji: '💹', farbe: 'from-slate-700 to-slate-900', native: true },
  { id: 'slot', label: 'Casino', emoji: '🎰', farbe: 'from-amber-500 to-yellow-700', native: true },
  { id: 'finanzen', label: 'Finanzen', emoji: '📊', farbe: 'from-slate-500 to-slate-700' },
  { id: 'einstellungen', label: 'Einstellungen', emoji: '⚙️', farbe: 'from-slate-400 to-slate-600' },
  { id: 'nachrichten', label: 'Nachrichten', emoji: '💬', farbe: 'from-green-400 to-green-600', native: true },
  { id: 'giggle', label: 'Giggle', emoji: '🔎', farbe: 'from-rose-400 via-amber-400 to-emerald-500', native: true },
  { id: 'chatomg', label: 'Chat OMG', emoji: '🤖', farbe: 'from-teal-500 to-emerald-600', native: true },
  { id: 'objekt', label: 'Objekt', emoji: '🏠', farbe: 'from-slate-400 to-slate-600' },
]

/** Reihenfolge im Dock (unten). */
export const DOCK: AppId[] = ['nachrichten', 'giggle', 'chatomg', 'immobilien']

export function appMeta(id: AppId): AppMeta {
  return APPS.find((a) => a.id === id) ?? APPS[0]
}
