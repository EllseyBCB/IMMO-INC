import { create } from 'zustand'
import type { Property, Qualitaet, RenovationScope, Bautempo } from '../data/types'
import { annuitaet, kaufnebenkosten, spekulationssteuer, verkaufsnebenkosten } from '../lib/finanzen'
import { berechneRenovierung } from '../data/renovation'
import type { Risiko } from '../data/mieter'

// Echtzeit-Modell (Clash-Royale-Stil): Zeit läuft real, nicht per Klick.
export const MS_PRO_MONAT = 4 * 60 * 60 * 1000 // 1 Spiel-Monat = 4 Echt-Stunden
const MAX_ELAPSED_MONATE = 12 // Offline-Fortschritt gedeckelt (kein Uralt-Sprung)

export interface Finanzierung {
  eigenkapitalEinsatz: number
  darlehen: number
  sollzins: number
  laufzeitJahre: number
  monatsrate: number
}

export interface RenovationState {
  scopes: RenovationScope[]
  qualitaet: Qualitaet
  tempo: Bautempo
  kosten: number
  wertsteigerung: number
  startMonth: number
  fertigMonth: number
  /** Echtzeit-Zeitstempel (ms), wann die Renovierung fertig ist. */
  fertigTs: number
  prompt: string
  status: 'in_arbeit' | 'fertig'
  bautraeger?: string
}

export type Nutzung = 'leer' | 'vermietet' | 'zumVerkauf'

export interface OwnedProperty {
  uid: string
  property: Property
  kaufpreis: number
  nebenkosten: number
  gekauftMonth: number
  finanzierung: Finanzierung
  restschuld: number
  renovierung: RenovationState | null
  /** Aktueller geschätzter Verkehrswert (Marktwert + Renovierungs-Uplift). */
  aktuellerWert: number
  nutzung: Nutzung
  kaltmiete: number
  mieterName?: string
  mieterRisiko?: Risiko
}

export interface LogEintrag {
  month: number
  text: string
  betrag?: number
  art: 'kauf' | 'verkauf' | 'renovierung' | 'miete' | 'rate' | 'kosten' | 'info'
}

export interface Lebenssituation {
  name: string
  nettoEinkommen: number
  fixkosten: number
}

export interface GameState {
  gestartet: boolean
  spielerName: string
  lebenssituation: Lebenssituation
  cash: number
  monthIndex: number
  startEigenkapital: number
  lastTick: number // Echtzeit-Stempel des letzten Ticks (ms)
  owned: OwnedProperty[]
  verkauft: string[] // property ids die vom Markt verschwinden
  log: LogEintrag[]

  neuesSpiel: (l: Lebenssituation, startkapital: number) => void
  reset: () => void
  kaufen: (property: Property, finanzierung: Finanzierung, mitMakler: boolean) => void
  renovieren: (uid: string, scopes: RenovationScope[], qualitaet: Qualitaet, tempo: Bautempo) => void
  renovierenAushandeln: (
    uid: string,
    scopes: RenovationScope[],
    qualitaet: Qualitaet,
    tempo: Bautempo,
    kosten: number,
    bauzeit: number,
    bautraeger?: string,
  ) => void
  renovierungBeschleunigen: (uid: string) => void
  setNutzung: (uid: string, nutzung: Nutzung) => void
  vermieten: (uid: string, kaltmiete: number, mieter?: { name: string; risiko: Risiko }) => void
  verkaufen: (uid: string, preis: number) => number
  /** Wendet die real vergangene Zeit auf Kasse, Kredite, Zeit & Renovierungen an. */
  tick: () => void
  laden: (s: Partial<GameState>) => void
}

const STORAGE_KEY = 'immo-inc-save-v1'

function persist(state: GameState) {
  try {
    const snapshot = {
      gestartet: state.gestartet,
      spielerName: state.spielerName,
      lebenssituation: state.lebenssituation,
      cash: state.cash,
      monthIndex: state.monthIndex,
      startEigenkapital: state.startEigenkapital,
      lastTick: state.lastTick,
      owned: state.owned,
      verkauft: state.verkauft,
      log: state.log,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    /* localStorage nicht verfügbar — kein Blocker */
  }
}

export function ladeSpielstand(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<GameState>
  } catch {
    return null
  }
}

export function loescheSpielstand() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

const leereLebenssituation: Lebenssituation = { name: '', nettoEinkommen: 3200, fixkosten: 1600 }

export const useGame = create<GameState>((set, get) => ({
  gestartet: false,
  spielerName: '',
  lebenssituation: leereLebenssituation,
  cash: 0,
  monthIndex: 0,
  startEigenkapital: 0,
  lastTick: 0,
  owned: [],
  verkauft: [],
  log: [],

  neuesSpiel: (l, startkapital) => {
    const state: Partial<GameState> = {
      gestartet: true,
      spielerName: l.name,
      lebenssituation: l,
      cash: startkapital,
      startEigenkapital: startkapital,
      monthIndex: 0,
      lastTick: Date.now(),
      owned: [],
      verkauft: [],
      log: [
        {
          month: 0,
          text: `Willkommen, ${l.name || 'Investor:in'}! Startkapital bereit.`,
          betrag: startkapital,
          art: 'info',
        },
      ],
    }
    set(state)
    persist(get())
  },

  reset: () => {
    loescheSpielstand()
    set({
      gestartet: false,
      spielerName: '',
      lebenssituation: leereLebenssituation,
      cash: 0,
      monthIndex: 0,
      startEigenkapital: 0,
      lastTick: 0,
      owned: [],
      verkauft: [],
      log: [],
    })
  },

  kaufen: (property, finanzierung, mitMakler) => {
    const s = get()
    const nk = kaufnebenkosten(property.kaufpreis, property.bundesland, mitMakler)
    const eigenanteil = finanzierung.eigenkapitalEinsatz
    if (eigenanteil > s.cash) return

    const owned: OwnedProperty = {
      uid: crypto.randomUUID(),
      property,
      kaufpreis: property.kaufpreis,
      nebenkosten: Math.round(nk.gesamt),
      gekauftMonth: s.monthIndex,
      finanzierung,
      restschuld: finanzierung.darlehen,
      renovierung: null,
      aktuellerWert: property.marktwert,
      nutzung: 'leer',
      kaltmiete: property.kaltmieteMarkt,
    }

    set({
      cash: s.cash - eigenanteil,
      owned: [...s.owned, owned],
      verkauft: [...s.verkauft, property.id],
      log: [
        {
          month: s.monthIndex,
          text: `Gekauft: ${property.titel} (${property.stadt})`,
          betrag: -eigenanteil,
          art: 'kauf',
        },
        ...s.log,
      ],
    })
    persist(get())
  },

  renovieren: (uid, scopes, qualitaet, tempo) => {
    const s = get()
    const idx = s.owned.findIndex((o) => o.uid === uid)
    if (idx < 0) return
    const o = s.owned[idx]
    const r = berechneRenovierung(
      scopes,
      qualitaet,
      tempo,
      o.property.wohnflaeche,
      o.property.marktwert,
      o.property.sanierungspotenzial,
    )
    if (r.kosten > s.cash) return

    const renovierung: RenovationState = {
      scopes,
      qualitaet,
      tempo,
      kosten: r.kosten,
      wertsteigerung: r.wertsteigerung,
      startMonth: s.monthIndex,
      fertigMonth: s.monthIndex + r.bauzeit,
      fertigTs: Date.now() + r.bauzeit * MS_PRO_MONAT,
      prompt: r.prompt,
      status: 'in_arbeit',
    }
    const owned = [...s.owned]
    owned[idx] = { ...o, renovierung }

    set({
      cash: s.cash - r.kosten,
      owned,
      log: [
        {
          month: s.monthIndex,
          text: `Renovierung beauftragt: ${o.property.titel} — fertig in ${r.bauzeit} Mon.`,
          betrag: -r.kosten,
          art: 'renovierung',
        },
        ...s.log,
      ],
    })
    persist(get())
  },

  setNutzung: (uid, nutzung) => {
    const s = get()
    const owned = s.owned.map((o) => (o.uid === uid ? { ...o, nutzung } : o))
    set({ owned })
    persist(get())
  },

  vermieten: (uid, kaltmiete, mieter) => {
    const s = get()
    const betrag = Math.max(0, Math.round(kaltmiete))
    const o = s.owned.find((x) => x.uid === uid)
    const owned = s.owned.map((x) =>
      x.uid === uid
        ? {
            ...x,
            nutzung: 'vermietet' as const,
            kaltmiete: betrag,
            mieterName: mieter?.name ?? x.mieterName,
            mieterRisiko: mieter?.risiko ?? x.mieterRisiko,
          }
        : x,
    )
    set({
      owned,
      log: o
        ? [
            {
              month: Math.floor(s.monthIndex),
              text: `Vermietet: ${o.property.titel} für ${betrag.toLocaleString('de-DE')} €/M${mieter ? ` an ${mieter.name}` : ''}`,
              art: 'miete' as const,
            },
            ...s.log,
          ].slice(0, 200)
        : s.log,
    })
    persist(get())
  },

  verkaufen: (uid, preis) => {
    const s = get()
    const o = s.owned.find((x) => x.uid === uid)
    if (!o) return 0
    const vnk = verkaufsnebenkosten(preis)
    const investiert = o.kaufpreis + o.nebenkosten + (o.renovierung?.kosten ?? 0)
    const bruttoGewinn = preis - investiert
    const haltedauer = s.monthIndex - o.gekauftMonth
    const steuer = spekulationssteuer(bruttoGewinn, haltedauer)
    const erloesNachSchulden = preis - vnk - o.restschuld - steuer
    const nettoCash = Math.round(erloesNachSchulden)

    set({
      cash: s.cash + nettoCash,
      owned: s.owned.filter((x) => x.uid !== uid),
      log: [
        {
          month: s.monthIndex,
          text: `Verkauft: ${o.property.titel} — ${bruttoGewinn >= 0 ? 'Gewinn' : 'Verlust'} vor Steuer ${Math.round(bruttoGewinn)} €${steuer > 0 ? `, Spekulationssteuer ${Math.round(steuer)} €` : ''}`,
          betrag: nettoCash,
          art: 'verkauf',
        },
        ...s.log,
      ],
    })
    persist(get())
    return nettoCash
  },

  renovierenAushandeln: (uid, scopes, qualitaet, tempo, kosten, bauzeit, bautraeger) => {
    const s = get()
    const idx = s.owned.findIndex((o) => o.uid === uid)
    if (idx < 0) return
    const o = s.owned[idx]
    const r = berechneRenovierung(
      scopes,
      qualitaet,
      tempo,
      o.property.wohnflaeche,
      o.property.marktwert,
      o.property.sanierungspotenzial,
    )
    const preis = Math.max(0, Math.round(kosten))
    if (preis > s.cash) return
    const dauerMonate = Math.max(1, Math.round(bauzeit))

    const renovierung: RenovationState = {
      scopes,
      qualitaet,
      tempo,
      kosten: preis,
      wertsteigerung: r.wertsteigerung,
      startMonth: s.monthIndex,
      fertigMonth: s.monthIndex + dauerMonate,
      fertigTs: Date.now() + dauerMonate * MS_PRO_MONAT,
      prompt: r.prompt,
      status: 'in_arbeit',
      bautraeger,
    }
    const owned = [...s.owned]
    owned[idx] = { ...o, renovierung }

    set({
      cash: s.cash - preis,
      owned,
      log: [
        {
          month: Math.floor(s.monthIndex),
          text: `Renovierung beauftragt: ${o.property.titel}${bautraeger ? ` an ${bautraeger}` : ''} — ${preis.toLocaleString('de-DE')} €, fertig in ${dauerMonate} Mon.`,
          betrag: -preis,
          art: 'renovierung' as const,
        },
        ...s.log,
      ].slice(0, 200),
    })
    persist(get())
  },

  renovierungBeschleunigen: (uid) => {
    const s = get()
    const idx = s.owned.findIndex((o) => o.uid === uid)
    if (idx < 0) return
    const o = s.owned[idx]
    if (!o.renovierung || o.renovierung.status !== 'in_arbeit') return
    const kosten = skipKosten(o)
    if (kosten > s.cash) return

    const owned = [...s.owned]
    const aktuellerWert = Math.round(o.property.marktwert + o.renovierung.wertsteigerung)
    owned[idx] = { ...o, renovierung: { ...o.renovierung, status: 'fertig', fertigTs: Date.now() }, aktuellerWert }

    const neu: LogEintrag[] = [
      {
        month: Math.floor(s.monthIndex),
        text: `Renovierung sofort fertiggestellt: ${o.property.titel} (Express-Aufpreis)`,
        betrag: -kosten,
        art: 'renovierung',
      },
      {
        month: Math.floor(s.monthIndex),
        text: `Renovierung fertig: ${o.property.titel}. Neuer Wert ~${aktuellerWert.toLocaleString('de-DE')} €`,
        art: 'renovierung',
      },
    ]

    set({ cash: s.cash - kosten, owned, log: [...neu, ...s.log].slice(0, 200) })
    persist(get())
  },

  tick: () => {
    const s = get()
    if (!s.gestartet) return
    const now = Date.now()
    const last = s.lastTick || now
    let elapsed = (now - last) / MS_PRO_MONAT
    if (elapsed <= 0) return
    elapsed = Math.min(elapsed, MAX_ELAPSED_MONATE)

    let cash = s.cash
    const neueLogs: LogEintrag[] = []
    const monthNach = s.monthIndex + elapsed

    const owned = s.owned.map((o) => {
      const updated = { ...o }

      // Kreditrate anteilig für die verstrichene Zeit
      if (o.restschuld > 0 && o.finanzierung.monatsrate > 0) {
        const zins = o.restschuld * (o.finanzierung.sollzins / 12)
        const tilgung = Math.max(0, o.finanzierung.monatsrate - zins)
        updated.restschuld = Math.max(0, o.restschuld - tilgung * elapsed)
        cash -= o.finanzierung.monatsrate * elapsed
      }

      // laufende Kosten bzw. Mieteinnahmen
      if (o.nutzung === 'vermietet') cash += o.kaltmiete * elapsed
      else cash -= o.property.hausgeldOderNebenkosten * elapsed

      // Renovierung per Echtzeit-Timer fertigstellen
      if (o.renovierung && o.renovierung.status === 'in_arbeit' && now >= o.renovierung.fertigTs) {
        updated.renovierung = { ...o.renovierung, status: 'fertig' }
        updated.aktuellerWert = Math.round(o.property.marktwert + o.renovierung.wertsteigerung)
        neueLogs.push({
          month: Math.floor(monthNach),
          text: `Renovierung fertig: ${o.property.titel}. Neuer Wert ~${updated.aktuellerWert.toLocaleString('de-DE')} €`,
          art: 'renovierung',
        })
      }

      return updated
    })

    // private Lebenshaltung
    cash += (s.lebenssituation.nettoEinkommen - s.lebenssituation.fixkosten) * elapsed

    set({
      monthIndex: monthNach,
      cash: Math.round(cash),
      lastTick: now,
      owned,
      log: neueLogs.length ? [...neueLogs, ...s.log].slice(0, 200) : s.log,
    })
    persist(get())
  },

  laden: (partial) => {
    set({ ...partial, lastTick: partial.lastTick || Date.now() })
  },
}))

/** Verbleibende Renovierungszeit in ms (0 wenn keine läuft). */
export function renoRestMs(o: OwnedProperty): number {
  if (!o.renovierung || o.renovierung.status !== 'in_arbeit') return 0
  return Math.max(0, o.renovierung.fertigTs - Date.now())
}

/** Kosten, um die laufende Renovierung sofort fertigzustellen (Express-Aufpreis). */
export function skipKosten(o: OwnedProperty): number {
  const restMonate = renoRestMs(o) / MS_PRO_MONAT
  return Math.round(restMonate * o.property.kaufpreis * 0.003)
}

// --- abgeleitete Kennzahlen ------------------------------------------------

export function portfolioWert(owned: OwnedProperty[]): number {
  return owned.reduce((sum, o) => sum + o.aktuellerWert, 0)
}

export function schulden(owned: OwnedProperty[]): number {
  return owned.reduce((sum, o) => sum + o.restschuld, 0)
}

export function monatlicheRaten(owned: OwnedProperty[]): number {
  return owned.reduce((sum, o) => sum + (o.restschuld > 0 ? o.finanzierung.monatsrate : 0), 0)
}

export function monatlicheMiete(owned: OwnedProperty[]): number {
  return owned.reduce((sum, o) => sum + (o.nutzung === 'vermietet' ? o.kaltmiete : 0), 0)
}

export function nettoVermoegen(cash: number, owned: OwnedProperty[]): number {
  return cash + portfolioWert(owned) - schulden(owned)
}

export function berechneFinanzierung(
  kaufpreis: number,
  bundesland: string,
  mitMakler: boolean,
  eigenkapitalEinsatz: number,
  sollzins: number,
  laufzeitJahre: number,
): Finanzierung {
  const nk = kaufnebenkosten(kaufpreis, bundesland, mitMakler)
  const gesamtkosten = kaufpreis + nk.gesamt
  const darlehen = Math.max(0, Math.round(gesamtkosten - eigenkapitalEinsatz))
  const monatsrate = annuitaet(darlehen, sollzins, laufzeitJahre)
  return {
    eigenkapitalEinsatz: Math.round(eigenkapitalEinsatz),
    darlehen,
    sollzins,
    laufzeitJahre,
    monatsrate: Math.round(monatsrate),
  }
}
