import { useState } from 'react'
import {
  FESTGELD_STAFFEL,
  TAGESGELD_ZINS,
  gesamtVermoegen,
  portfolioWert,
  schulden,
  sparGuthaben,
  useGame,
  type OwnedProperty,
} from '../../state/game'
import { lebensstandard, sonderausgabenMonat } from '../../data/lifestyle'
import { depotWert } from '../../data/assets'
import { euro, euroShort, gameDate, gameDatum, pct } from '../../lib/format'

const ART: Record<string, string> = {
  kauf: '🏠',
  verkauf: '💰',
  renovierung: '🏗️',
  miete: '🔑',
  rate: '🏦',
  kosten: '📉',
  gehalt: '💶',
  invest: '📈',
  zinsen: '🪙',
  info: 'ℹ️',
}

/** Deterministische Pseudo-IBAN (DE… ) aus einem Seed. */
function iban(seed: string): string {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  const a = (h % 89 + 10).toString()
  const rest = (h.toString() + Math.imul(h, 7).toString() + Math.imul(h, 13).toString()).replace(/\D/g, '').padEnd(18, '0').slice(0, 18)
  return `DE${a} ${rest.slice(0, 4)} ${rest.slice(4, 8)} ${rest.slice(8, 12)} ${rest.slice(12, 16)} ${rest.slice(16, 18)}`
}

export default function BankingApp({ onClose }: { onClose: () => void }) {
  const game = useGame()
  const [view, setView] = useState<'uebersicht' | 'privat' | 'kredite' | 'sparen'>('uebersicht')

  const { cash, owned, monthIndex, depot, tagesgeld, festgeld } = game
  const debt = schulden(owned)
  const wert = portfolioWert(owned)
  const investWert = depotWert(depot, monthIndex)
  const spar = sparGuthaben(tagesgeld, festgeld)
  const vermoegen = gesamtVermoegen(cash, owned, depot, monthIndex, spar)
  const kredite = owned.filter((o) => o.restschuld > 0)

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Bank-Kopf */}
      <div className="flex items-center gap-2 bg-red-600 px-3 py-2 pt-3 text-white">
        {view !== 'uebersicht' ? (
          <button onClick={() => setView('uebersicht')} className="rounded-lg px-1.5 py-0.5 text-lg" aria-label="Zurück">
            ‹
          </button>
        ) : (
          <button onClick={onClose} className="rounded-lg px-1.5 py-0.5 text-lg" aria-label="Schließen">
            ✕
          </button>
        )}
        <span className="grid h-6 w-6 place-items-center rounded-md bg-white text-xs font-black text-red-600">S</span>
        <span className="text-sm font-bold">Starkasse</span>
        <span className="ml-auto text-[10px] text-white/80">{gameDatum(monthIndex)}</span>
      </div>

      {view === 'uebersicht' && (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
          <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
            <div className="text-[11px] uppercase tracking-wide text-ink-500">Finanzübersicht · Gesamtvermögen</div>
            <div className={`mt-0.5 text-3xl font-black tabular-nums ${vermoegen >= 0 ? 'text-ink-900' : 'text-rose-600'}`}>
              {euro(vermoegen)}
            </div>
          </div>

          <div>
            <div className="mb-1 px-1 text-xs font-bold uppercase tracking-wide text-ink-500">Meine Konten</div>
            <div className="space-y-2">
              <KontoZeile
                emoji="👤"
                farbe="bg-red-500"
                titel="Privatkonto"
                unter="Girokonto"
                iban={iban('privat')}
                saldo={cash}
                onClick={() => setView('privat')}
              />
              <KontoZeile
                emoji="🪙"
                farbe="bg-amber-500"
                titel="Sparen"
                unter="Tagesgeld & Festgeld"
                iban={iban('sparen')}
                saldo={spar}
                onClick={() => setView('sparen')}
              />
              <KontoZeile
                emoji="🏠"
                farbe="bg-rose-500"
                titel="Immobilienkredite"
                unter={`${kredite.length} Darlehen`}
                iban={iban('kredite')}
                saldo={-debt}
                onClick={() => setView('kredite')}
              />
              <KontoZeile emoji="🏘️" farbe="bg-emerald-500" titel="Immobilienvermögen" unter={`${owned.length} Objekte`} iban={iban('vermoegen')} saldo={wert} />
              {(investWert > 0 || depot.length > 0) && (
                <KontoZeile emoji="📈" farbe="bg-indigo-500" titel="Wertpapierdepot" unter={`${depot.length} Position${depot.length === 1 ? '' : 'en'}`} iban={iban('depot')} saldo={investWert} />
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'privat' && <PrivatKonto />}
      {view === 'kredite' && <KrediteKonto kredite={kredite} debt={debt} wert={wert} />}
      {view === 'sparen' && <SparKonto />}
    </div>
  )
}

function KontoZeile({
  emoji,
  farbe,
  titel,
  unter,
  iban,
  saldo,
  onClick,
}: {
  emoji: string
  farbe: string
  titel: string
  unter: string
  iban: string
  saldo: number
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft ring-1 ring-black/5 ${onClick ? 'transition hover:bg-slate-50' : ''}`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${farbe} text-lg text-white`}>{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink-900">{titel}</span>
        <span className="block truncate text-[10px] text-ink-400">{unter} · {iban}</span>
      </span>
      <span className={`shrink-0 text-sm font-black tabular-nums ${saldo < 0 ? 'text-rose-600' : 'text-ink-900'}`}>
        {euroShort(saldo)}
      </span>
      {onClick && <span className="text-ink-300">›</span>}
    </button>
  )
}

interface Posten {
  label: string
  sub: string
  v: number
}

function PrivatKonto() {
  const { cash, owned, log, lebenssituation, gekaufteLuxus, depot, monthIndex, tagesgeld, festgeld } = useGame()
  const netto = lebenssituation.nettoEinkommen
  const fix = lebenssituation.fixkosten
  const vermoegen = gesamtVermoegen(cash, owned, depot, monthIndex, sparGuthaben(tagesgeld, festgeld))
  const sonder = sonderausgabenMonat(vermoegen, gekaufteLuxus)
  const ls = lebensstandard(vermoegen, gekaufteLuxus)

  const vermietet = owned.filter((o) => o.nutzung === 'vermietet' && o.kaltmiete > 0)
  const mitKredit = owned.filter((o) => o.restschuld > 0 && o.finanzierung.monatsrate > 0)
  const mitHausgeld = owned.filter((o) => o.nutzung !== 'vermietet' && o.property.hausgeldOderNebenkosten > 0)

  const einnahmen: Posten[] = [
    { label: 'Gehaltseingang', sub: 'Arbeitgeber · monatlich', v: netto },
    ...vermietet.map((o) => ({
      label: `Miete · ${o.property.titel}`,
      sub: o.mieterName ? `${o.mieterName} · Kaltmiete` : 'Mieteingang',
      v: o.kaltmiete,
    })),
  ]

  const ausgaben: Posten[] = [
    { label: 'Lebenshaltung', sub: 'Dauerauftrag · privat', v: fix },
    ...mitKredit.map((o) => ({
      label: `Kreditrate · ${o.property.titel}`,
      sub: 'IMMO INC Bank · Annuität',
      v: o.finanzierung.monatsrate,
    })),
    ...mitHausgeld.map((o) => ({
      label: `Hausgeld · ${o.property.titel}`,
      sub: 'Hausverwaltung',
      v: o.property.hausgeldOderNebenkosten,
    })),
    ...(sonder > 0 ? [{ label: 'Sonderausgaben', sub: `${ls.stufe.name} · Lebensstandard`, v: sonder }] : []),
  ]

  const einSumme = einnahmen.reduce((s, e) => s + e.v, 0)
  const ausSumme = ausgaben.reduce((s, e) => s + e.v, 0)
  const saldo = einSumme - ausSumme

  return (
    <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
      <div className="rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-4 text-white shadow-md">
        <div className="text-[11px] uppercase tracking-wide text-white/70">Privatkonto · Kontostand</div>
        <div className="mt-0.5 text-3xl font-black tabular-nums">{euro(cash)}</div>
        <div className="mt-2 text-[11px] text-white/70">{iban('privat')}</div>
      </div>

      {/* Monatliche Einnahmen — vollständig aufgeschlüsselt */}
      <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-500">Einnahmen / Monat</span>
          <span className="text-sm font-black tabular-nums text-emerald-600">+ {euro(einSumme)}</span>
        </div>
        <div className="mt-2 divide-y divide-slate-50">
          {einnahmen.map((p, i) => (
            <PostenZeile key={i} p={p} positiv />
          ))}
        </div>
      </div>

      {/* Monatliche Ausgaben — vollständig aufgeschlüsselt */}
      <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-500">Ausgaben / Monat</span>
          <span className="text-sm font-black tabular-nums text-rose-600">− {euro(ausSumme)}</span>
        </div>
        <div className="mt-2 divide-y divide-slate-50">
          {ausgaben.map((p, i) => (
            <PostenZeile key={i} p={p} />
          ))}
        </div>
      </div>

      {/* Monats-Saldo */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
        <span className="text-sm font-bold text-ink-900">Saldo / Monat</span>
        <SaldoText v={saldo} bold />
      </div>

      <Umsaetze log={log} />
    </div>
  )
}

function PostenZeile({ p, positiv }: { p: Posten; positiv?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="min-w-0">
        <span className="block truncate text-sm text-ink-800">{p.label}</span>
        <span className="block truncate text-[10px] text-ink-400">{p.sub}</span>
      </span>
      <span className={`shrink-0 text-sm font-semibold tabular-nums ${positiv ? 'text-emerald-600' : 'text-rose-600'}`}>
        {positiv ? '+' : '−'} {euro(p.v)}
      </span>
    </div>
  )
}

function KrediteKonto({ kredite, debt, wert }: { kredite: OwnedProperty[]; debt: number; wert: number }) {
  return (
    <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
      <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-4 text-white shadow-md">
        <div className="text-[11px] uppercase tracking-wide text-white/70">Immobilienkredite · Restschuld gesamt</div>
        <div className="mt-0.5 text-3xl font-black tabular-nums">{euro(debt)}</div>
        <div className="mt-2 text-[11px] text-white/70">
          Gesamtbeleihung {wert > 0 ? pct((debt / wert) * 100, 0) : '—'}
        </div>
      </div>

      {kredite.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft ring-1 ring-black/5">
          Keine laufenden Immobilienkredite. Du bist schuldenfrei. 🎉
        </div>
      ) : (
        kredite.map((o) => {
          const beleihung = o.property.kaufpreis > 0 ? (o.restschuld / o.property.kaufpreis) * 100 : 0
          return (
            <div key={o.uid} className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-ink-900">{o.property.titel}</div>
                  <div className="truncate text-[10px] text-ink-400">Darlehenskonto · {iban(o.uid)}</div>
                </div>
                <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">Darlehen</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Feld label="Restschuld" wert={euro(o.restschuld)} rot />
                <Feld label="Monatsrate" wert={`${euro(o.finanzierung.monatsrate)}`} rot />
                <Feld label="Sollzins" wert={pct(o.finanzierung.sollzins * 100, 2)} />
                <Feld label="Laufzeit" wert={`${o.finanzierung.laufzeitJahre} J`} />
                <Feld label="urspr. Darlehen" wert={euro(o.finanzierung.darlehen)} />
                <Feld label="Beleihung" wert={pct(beleihung, 0)} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function Umsaetze({ log }: { log: { month: number; text: string; betrag?: number; art: string }[] }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
      <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Umsätze</div>
      {log.length === 0 ? (
        <p className="mt-2 text-sm text-ink-500">Noch keine Umsätze.</p>
      ) : (
        <div className="mt-1">
          {log.slice(0, 40).map((e, i) => (
            <div key={i} className="flex items-start gap-2 border-b border-slate-50 py-2 last:border-0">
              <span className="text-base">{ART[e.art] ?? 'ℹ️'}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-ink-800">{e.text}</div>
                <div className="text-[10px] text-ink-400">{gameDate(e.month)}</div>
              </div>
              {e.betrag !== undefined && <SaldoText v={e.betrag} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SaldoText({ v, bold }: { v: number; bold?: boolean }) {
  return (
    <span className={`tabular-nums ${bold ? 'text-base font-black' : 'text-sm font-semibold'} ${v >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
      {v > 0 ? '+' : ''}
      {euro(v)}
    </span>
  )
}

function Feld({ label, wert, rot }: { label: string; wert: string; rot?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${rot ? 'text-rose-600' : 'text-ink-900'}`}>{wert}</div>
    </div>
  )
}

function SparKonto() {
  const { cash, tagesgeld, festgeld, monthIndex } = useGame()
  const tagesgeldEinzahlen = useGame((s) => s.tagesgeldEinzahlen)
  const tagesgeldAbheben = useGame((s) => s.tagesgeldAbheben)
  const festgeldAnlegen = useGame((s) => s.festgeldAnlegen)

  const [tgBetrag, setTgBetrag] = useState('')
  const [fgBetrag, setFgBetrag] = useState('')
  const [fgLaufzeit, setFgLaufzeit] = useState(FESTGELD_STAFFEL[1].monate)

  const tg = Math.max(0, Math.round(Number(tgBetrag.replace(',', '.')) || 0))
  const fg = Math.max(0, Math.round(Number(fgBetrag.replace(',', '.')) || 0))
  const fgStaffel = FESTGELD_STAFFEL.find((f) => f.monate === fgLaufzeit)!

  return (
    <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
      {/* Tagesgeld */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-md">
        <div className="text-[11px] uppercase tracking-wide text-white/80">Tagesgeld · Guthaben</div>
        <div className="mt-0.5 text-3xl font-black tabular-nums">{euro(tagesgeld)}</div>
        <div className="mt-1 text-[11px] text-white/80">{(TAGESGELD_ZINS * 100).toFixed(1)} % p. a. · täglich verfügbar</div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
        <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Umbuchen (Girokonto ↔ Tagesgeld)</div>
        <div className="relative mt-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={tgBetrag}
            onChange={(e) => setTgBetrag(e.target.value)}
            placeholder="Betrag in Euro"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-8 text-right text-sm tabular-nums outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">€</span>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => {
              tagesgeldEinzahlen(tg)
              setTgBetrag('')
            }}
            disabled={tg <= 0 || tg > cash}
            className="flex-1 rounded-xl bg-amber-500 py-2 text-sm font-bold text-white transition hover:bg-amber-600 disabled:bg-slate-200 disabled:text-ink-400"
          >
            Einzahlen
          </button>
          <button
            onClick={() => {
              tagesgeldAbheben(tg)
              setTgBetrag('')
            }}
            disabled={tg <= 0 || tg > tagesgeld}
            className="flex-1 rounded-xl bg-white py-2 text-sm font-bold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50 disabled:text-ink-300 disabled:ring-slate-200"
          >
            Abheben
          </button>
        </div>
        <div className="mt-1.5 text-[11px] text-ink-400">Frei auf dem Girokonto: {euro(cash)}</div>
      </div>

      {/* Festgeld */}
      <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
        <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Festgeld anlegen (fester Zins)</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FESTGELD_STAFFEL.map((f) => (
            <button
              key={f.monate}
              onClick={() => setFgLaufzeit(f.monate)}
              className={`rounded-xl border p-2 text-center transition ${
                fgLaufzeit === f.monate ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-100' : 'border-slate-200'
              }`}
            >
              <div className="text-sm font-black text-ink-900">{f.monate} Mon.</div>
              <div className="text-[11px] font-bold text-amber-600">{(f.zins * 100).toFixed(1)} %</div>
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={fgBetrag}
            onChange={(e) => setFgBetrag(e.target.value)}
            placeholder="Betrag in Euro"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-8 text-right text-sm tabular-nums outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">€</span>
        </div>
        <div className="mt-1.5 text-[11px] text-ink-400">
          Auszahlung bei Fälligkeit ≈ {euro(Math.round(fg * (1 + fgStaffel.zins * (fgLaufzeit / 12))))} · Kapital {fgLaufzeit} Monate gebunden
        </div>
        <button
          onClick={() => {
            festgeldAnlegen(fg, fgLaufzeit)
            setFgBetrag('')
          }}
          disabled={fg <= 0 || fg > cash}
          className="mt-2 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:bg-slate-200 disabled:text-ink-400"
        >
          {fg > cash ? 'Nicht genug Liquidität' : `${euro(fg)} anlegen`}
        </button>
      </div>

      {/* Laufende Festgelder */}
      {festgeld.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Laufende Festgelder</div>
          <div className="mt-2 space-y-2">
            {festgeld.map((f) => {
              const rest = Math.max(0, f.faelligMonth - monthIndex)
              const ziel = Math.round(f.betrag * (1 + f.zinsSatz * (f.laufzeitMonate / 12)))
              return (
                <div key={f.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink-900">{euro(f.betrag)} · {(f.zinsSatz * 100).toFixed(1)} %</div>
                    <div className="text-[10px] text-ink-400">
                      noch {rest < 1 ? 'unter 1' : Math.ceil(rest)} Mon. · Auszahlung {euro(ziel)}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">gebunden</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-amber-50/70 p-3 text-center text-[11px] leading-snug text-amber-700/80">
        Sicher & planbar — im Gegensatz zur Börse. Geparktes Geld arbeitet, statt von den Sonderausgaben aufgezehrt zu werden.
      </div>
    </div>
  )
}
