import { create } from 'zustand'
import type { Property, Qualitaet, RenovationScope } from '../data/types'
import {
  annuitaet,
  kaufnebenkosten,
  restschuld as restschuldCalc,
  spekulationssteuer,
  verkaufsnebenkosten,
} from '../lib/finanzen'
import { berechneRenovierung } from '../data/renovation'

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
  kosten: number
  wertsteigerung: number
  startMonth: number
  fertigMonth: number
  prompt: string
  status: 'in_arbeit' | 'fertig'
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
  owned: OwnedProperty[]
  verkauft: string[] // property ids die vom Markt verschwinden
  log: LogEintrag[]

  neuesSpiel: (l: Lebenssituation, startkapital: number) => void
  reset: () => void
  kaufen: (property: Property, finanzierung: Finanzierung, mitMakler: boolean) => void
  renovieren: (uid: string, scopes: RenovationScope[], qualitaet: Qualitaet) => void
  setNutzung: (uid: string, nutzung: Nutzung) => void
  verkaufen: (uid: string, preis: number) => number
  naechsterMonat: () => void
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

  renovieren: (uid, scopes, qualitaet) => {
    const s = get()
    const idx = s.owned.findIndex((o) => o.uid === uid)
    if (idx < 0) return
    const o = s.owned[idx]
    const r = berechneRenovierung(
      scopes,
      qualitaet,
      o.property.wohnflaeche,
      o.property.marktwert,
      o.property.sanierungspotenzial,
    )
    if (r.kosten > s.cash) return

    const renovierung: RenovationState = {
      scopes,
      qualitaet,
      kosten: r.kosten,
      wertsteigerung: r.wertsteigerung,
      startMonth: s.monthIndex,
      fertigMonth: s.monthIndex + r.bauzeit,
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

  naechsterMonat: () => {
    const s = get()
    const month = s.monthIndex + 1
    let cash = s.cash
    const neueLogs: LogEintrag[] = []

    const owned = s.owned.map((o) => {
      let updated = { ...o }

      // Kreditrate abbuchen
      if (o.restschuld > 0 && o.finanzierung.monatsrate > 0) {
        const neueRest = restschuldCalc(o.restschuld, o.finanzierung.sollzins, o.finanzierung.monatsrate, 1)
        const gezahlt = Math.min(o.finanzierung.monatsrate, o.restschuld + o.restschuld * (o.finanzierung.sollzins / 12))
        cash -= gezahlt
        updated.restschuld = neueRest
      }

      // laufende Kosten (Hausgeld/Nebenkosten) wenn nicht vermietet trägt Eigentümer
      if (o.nutzung !== 'vermietet') {
        cash -= o.property.hausgeldOderNebenkosten
      }

      // Mieteinnahmen
      if (o.nutzung === 'vermietet') {
        cash += o.kaltmiete
      }

      // Renovierung fertigstellen
      if (o.renovierung && o.renovierung.status === 'in_arbeit' && month >= o.renovierung.fertigMonth) {
        updated.renovierung = { ...o.renovierung, status: 'fertig' }
        updated.aktuellerWert = Math.round(o.property.marktwert + o.renovierung.wertsteigerung)
        neueLogs.push({
          month,
          text: `Renovierung fertig: ${o.property.titel}. Neuer Wert ~${updated.aktuellerWert.toLocaleString('de-DE')} €`,
          art: 'renovierung',
        })
      }

      return updated
    })

    // private Lebenshaltung: Einkommen minus Fixkosten fließt in die Kasse
    const privatSaldo = s.lebenssituation.nettoEinkommen - s.lebenssituation.fixkosten
    cash += privatSaldo

    set({
      monthIndex: month,
      cash: Math.round(cash),
      owned,
      log: [...neueLogs, ...s.log].slice(0, 200),
    })
    persist(get())
  },

  laden: (partial) => {
    set(partial)
  },
}))

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
