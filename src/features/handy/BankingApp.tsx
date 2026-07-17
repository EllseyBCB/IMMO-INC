import {
  monatlicheMiete,
  monatlicheRaten,
  nettoVermoegen,
  portfolioWert,
  schulden,
  useGame,
} from '../../state/game'
import { euro, euroShort, gameDate, pct } from '../../lib/format'

const ART: Record<string, string> = {
  kauf: '🏠',
  verkauf: '💰',
  renovierung: '🏗️',
  miete: '🔑',
  rate: '🏦',
  kosten: '📉',
  info: 'ℹ️',
}

export default function BankingApp({ onClose }: { onClose: () => void }) {
  const { cash, owned, log, monthIndex, startEigenkapital, lebenssituation } = useGame()

  const vermoegen = nettoVermoegen(cash, owned)
  const wert = portfolioWert(owned)
  const debt = schulden(owned)
  const raten = monatlicheRaten(owned)
  const miete = monatlicheMiete(owned)
  const hausgeld = owned
    .filter((o) => o.nutzung !== 'vermietet')
    .reduce((s, o) => s + o.property.hausgeldOderNebenkosten, 0)
  const privat = lebenssituation.nettoEinkommen - lebenssituation.fixkosten
  const cashflow = privat + miete - raten - hausgeld
  const wachstum = startEigenkapital > 0 ? ((vermoegen - startEigenkapital) / startEigenkapital) * 100 : 0
  const kredite = owned.filter((o) => o.restschuld > 0)

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white/85 px-2 py-2 pt-3 backdrop-blur">
        <button onClick={onClose} className="rounded-lg px-2 py-1 text-lg text-brand-600" aria-label="Zurück">
          ‹
        </button>
        <span className="text-sm font-bold text-ink-900">Banking</span>
        <span className="ml-auto pr-2 text-[10px] text-ink-400">{gameDate(monthIndex)}</span>
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
        {/* Kontostand */}
        <div className="rounded-2xl bg-gradient-to-br from-ink-900 to-slate-700 p-4 text-white shadow-md">
          <div className="text-[11px] uppercase tracking-wide text-white/60">Girokonto · Liquidität</div>
          <div className="mt-0.5 text-3xl font-black tabular-nums">{euro(cash)}</div>
          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-3 text-xs">
            <div>
              <div className="text-white/60">Netto-Vermögen</div>
              <div className="font-bold tabular-nums">{euroShort(vermoegen)}</div>
            </div>
            <div className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${wachstum >= 0 ? 'bg-emerald-500/25 text-emerald-200' : 'bg-rose-500/25 text-rose-200'}`}>
              {wachstum >= 0 ? '▲' : '▼'} {Math.abs(wachstum).toFixed(1)} %
            </div>
          </div>
        </div>

        {/* Kacheln */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5">
            <div className="text-[11px] uppercase tracking-wide text-ink-500">Immobilienwert</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums text-ink-900">{euroShort(wert)}</div>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5">
            <div className="text-[11px] uppercase tracking-wide text-ink-500">Schulden</div>
            <div className="mt-0.5 text-lg font-bold tabular-nums text-rose-600">{euroShort(debt)}</div>
          </div>
        </div>

        {/* Cashflow */}
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Cashflow / Monat</div>
          <div className="mt-2 space-y-1.5 text-sm">
            <Zeile label="Einkommen − Fixkosten" v={privat} />
            <Zeile label="Mieteinnahmen" v={miete} />
            <Zeile label="Kreditraten" v={-raten} />
            <Zeile label="Hausgeld (leer)" v={-hausgeld} />
            <div className="my-1 border-t border-slate-100" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-900">Summe</span>
              <span className={`text-base font-black tabular-nums ${cashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {cashflow >= 0 ? '+' : ''}
                {euro(cashflow)}
              </span>
            </div>
          </div>
        </div>

        {/* Kredite */}
        {kredite.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
            <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Laufende Kredite</div>
            <div className="mt-2 divide-y divide-slate-100">
              {kredite.map((o) => (
                <div key={o.uid} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink-900">{o.property.titel}</div>
                    <div className="text-[11px] text-ink-500">{pct(o.finanzierung.sollzins * 100, 2)} · {euro(o.finanzierung.monatsrate)}/M</div>
                  </div>
                  <div className="shrink-0 text-sm font-bold tabular-nums text-rose-600">{euro(o.restschuld)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Umsätze */}
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Umsätze</div>
          {log.length === 0 ? (
            <p className="mt-2 text-sm text-ink-500">Noch keine Umsätze.</p>
          ) : (
            <div className="mt-1">
              {log.slice(0, 30).map((e, i) => (
                <div key={i} className="flex items-start gap-2 border-b border-slate-50 py-2 last:border-0">
                  <span className="text-base">{ART[e.art] ?? 'ℹ️'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-ink-800">{e.text}</div>
                    <div className="text-[10px] text-ink-400">{gameDate(e.month)}</div>
                  </div>
                  {e.betrag !== undefined && (
                    <span className={`shrink-0 text-xs font-bold tabular-nums ${e.betrag >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {e.betrag >= 0 ? '+' : ''}
                      {euro(e.betrag)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Zeile({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-600">{label}</span>
      <span className={`tabular-nums font-semibold ${v >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {v > 0 ? '+' : ''}
        {euro(v)}
      </span>
    </div>
  )
}
