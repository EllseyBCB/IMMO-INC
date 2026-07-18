import type { Monatsbericht } from '../../state/game'
import { euro, gameDatum } from '../../lib/format'

/** Detail-Ansicht einer Monats-Auswertung (Auto-Pop-up & Finanzen-Verlauf). */
export function Monatsberichtdetail({ bericht, onClose }: { bericht: Monatsbericht; onClose?: () => void }) {
  const e = bericht.einnahmen
  const a = bericht.ausgaben
  const einNahmenSumme = e.gehalt + e.miete + e.dividende + e.zinsen + e.festgeld
  const ausgabenSumme = a.raten + a.hausgeld + a.lebenshaltung + a.sonder
  const z = bericht.zusammensetzung
  const datum = gameDatum(bericht.month)

  return (
    <div>
      <div className="mb-1 text-center text-3xl">📊</div>
      <h3 className="text-center text-lg font-black text-ink-900">Monats-Auswertung</h3>
      <p className="text-center text-xs text-ink-500">{datum}</p>

      {/* Einnahmen */}
      <div className="mt-4 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-emerald-700">
          <span>Einnahmen</span>
          <span className="tabular-nums">+{euro(einNahmenSumme)}</span>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          <Zeile label="💼 Gehalt" wert={e.gehalt} />
          <Zeile label="🔑 Mieteinnahmen" wert={e.miete} />
          <Zeile label="📈 Dividenden" wert={e.dividende} />
          <Zeile label="🪙 Zinsen Tagesgeld" wert={e.zinsen} />
          <Zeile label="🏦 Festgeld fällig" wert={e.festgeld} />
        </div>
      </div>

      {/* Ausgaben */}
      <div className="mt-2 rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-100">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-rose-700">
          <span>Ausgaben</span>
          <span className="tabular-nums">−{euro(ausgabenSumme)}</span>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          <Zeile label="🏦 Kreditraten" wert={-a.raten} />
          <Zeile label="🏠 Hausgeld / Nebenkosten" wert={-a.hausgeld} />
          <Zeile label="🧾 Lebenshaltung" wert={-a.lebenshaltung} />
          <Zeile label="💎 Sonderausgaben" wert={-a.sonder} />
        </div>
      </div>

      {/* Saldo + Portfolio */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-wide text-ink-400">Monats-Saldo</div>
          <div className={`text-base font-black tabular-nums ${bericht.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {bericht.saldo >= 0 ? '+' : '−'}{euro(Math.abs(bericht.saldo))}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-[10px] uppercase tracking-wide text-ink-400">Immobilienwert Δ</div>
          <div className={`text-base font-black tabular-nums ${bericht.portfolioDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {bericht.portfolioDelta >= 0 ? '+' : '−'}{euro(Math.abs(bericht.portfolioDelta))}
          </div>
        </div>
      </div>

      {/* Gewinn seit Start */}
      <div className="mt-2 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 text-white">
        <div className="text-[11px] uppercase tracking-wide text-white/80">💰 Gewinn seit Start</div>
        <div className="text-2xl font-black tabular-nums">
          {bericht.gewinnGesamt >= 0 ? '+' : '−'}{euro(Math.abs(bericht.gewinnGesamt))}
        </div>
        <div className="mt-0.5 text-[11px] text-white/80">Gesamtvermögen: {euro(bericht.vermoegenNachher)}</div>
      </div>

      {/* Zusammensetzung */}
      <div className="mt-2 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Woraus dein Vorteil besteht</div>
        <div className="mt-2 space-y-1 text-sm">
          <Zeile label="💵 Liquidität" wert={z.liquiditaet} neutral />
          <Zeile label="🏙️ Immobilien (netto)" wert={z.immobilien} neutral />
          <Zeile label="📈 Wertpapierdepot" wert={z.depot} neutral />
          <Zeile label="🏦 Sparen" wert={z.sparen} neutral />
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          Verstanden
        </button>
      )}
    </div>
  )
}

function Zeile({ label, wert, neutral }: { label: string; wert: number; neutral?: boolean }) {
  if (wert === 0) return null
  const farbe = neutral ? 'text-ink-900' : wert >= 0 ? 'text-emerald-700' : 'text-rose-700'
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-600">{label}</span>
      <span className={`font-semibold tabular-nums ${farbe}`}>
        {!neutral && wert >= 0 ? '+' : !neutral ? '−' : ''}{euro(Math.abs(wert))}
      </span>
    </div>
  )
}
