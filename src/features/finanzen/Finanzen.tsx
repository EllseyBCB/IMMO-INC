import { useState } from 'react'
import {
  monatlicheMiete,
  monatlicheRaten,
  nettoVermoegen,
  portfolioWert,
  schulden,
  useGame,
} from '../../state/game'
import { Button, Card, Modal, Stat } from '../../components/ui'
import { euro, gameDate } from '../../lib/format'
import { lebensstandard, sonderausgabenMonat } from '../../data/lifestyle'

const ART_STYLE: Record<string, { icon: string; tone: string }> = {
  kauf: { icon: '🏠', tone: 'text-ink-700' },
  verkauf: { icon: '💰', tone: 'text-emerald-600' },
  renovierung: { icon: '🏗️', tone: 'text-amber-600' },
  miete: { icon: '🔑', tone: 'text-emerald-600' },
  rate: { icon: '🏦', tone: 'text-rose-600' },
  kosten: { icon: '📉', tone: 'text-rose-600' },
  gehalt: { icon: '💶', tone: 'text-emerald-600' },
  info: { icon: 'ℹ️', tone: 'text-ink-500' },
}

export default function Finanzen() {
  const { cash, owned, log, monthIndex, startEigenkapital, lebenssituation, gekaufteLuxus, reset } = useGame()
  const [resetOffen, setResetOffen] = useState(false)

  const wert = portfolioWert(owned)
  const debt = schulden(owned)
  const vermoegen = nettoVermoegen(cash, owned)
  const raten = monatlicheRaten(owned)
  const miete = monatlicheMiete(owned)
  const hausgeld = owned
    .filter((o) => o.nutzung !== 'vermietet')
    .reduce((s, o) => s + o.property.hausgeldOderNebenkosten, 0)
  const privat = lebenssituation.nettoEinkommen - lebenssituation.fixkosten
  const sonder = sonderausgabenMonat(vermoegen, gekaufteLuxus)
  const ls = lebensstandard(vermoegen, gekaufteLuxus)
  const cashflow = privat + miete - raten - hausgeld - sonder
  const wachstum = startEigenkapital > 0 ? ((vermoegen - startEigenkapital) / startEigenkapital) * 100 : 0

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink-900">Finanzen</h1>
          <p className="text-sm text-ink-500">Stand {gameDate(monthIndex)}</p>
        </div>
        <Button variant="ghost" onClick={() => setResetOffen(true)}>
          ⚙️ Neu starten
        </Button>
      </div>

      {/* Vermögen Hero */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ink-900 to-slate-700 p-6 text-white">
          <div className="text-xs uppercase tracking-wide text-white/60">Netto-Vermögen</div>
          <div className="mt-1 text-4xl font-black tabular-nums">{euro(vermoegen)}</div>
          <div className="mt-1 text-sm text-white/70">
            {wachstum >= 0 ? '▲' : '▼'} {Math.abs(wachstum).toFixed(1)} % seit Start ({euro(startEigenkapital)})
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="p-4">
            <Stat label="Liquidität" value={euro(cash)} tone={cash < 0 ? 'down' : 'ink'} />
          </div>
          <div className="p-4">
            <Stat label="Immobilienwert" value={euro(wert)} />
          </div>
          <div className="p-4">
            <Stat label="Schulden" value={euro(debt)} tone="down" />
          </div>
        </div>
      </Card>

      {/* Cashflow */}
      <Card className="mt-4 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Monatlicher Cashflow</h2>
        <div className="mt-3 space-y-2 text-sm">
          <CashflowZeile label="Privat: Einkommen − Fixkosten" value={privat} />
          <CashflowZeile label="Mieteinnahmen" value={miete} />
          <CashflowZeile label="Kreditraten" value={-raten} />
          <CashflowZeile label="Hausgeld / Nebenkosten (leerstehend)" value={-hausgeld} />
          <CashflowZeile label={`Sonderausgaben (${ls.stufe.name})`} value={-sonder} />
          <div className="my-2 border-t border-slate-100" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink-900">Summe / Monat</span>
            <span className={`text-lg font-black tabular-nums ${cashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {cashflow >= 0 ? '+' : ''}
              {euro(cashflow)}
            </span>
          </div>
        </div>
      </Card>

      {/* Verlauf */}
      <Card className="mt-4 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Verlauf</h2>
        {log.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">Noch keine Aktivität.</p>
        ) : (
          <div className="mt-3 space-y-1">
            {log.map((e, i) => {
              const st = ART_STYLE[e.art] ?? ART_STYLE.info
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <span className="text-base">{st.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm text-ink-800">{e.text}</div>
                    <div className="text-[11px] text-ink-400">{gameDate(e.month)}</div>
                  </div>
                  {e.betrag !== undefined && (
                    <span className={`text-sm font-bold tabular-nums ${e.betrag >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {e.betrag >= 0 ? '+' : ''}
                      {euro(e.betrag)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Modal open={resetOffen} onClose={() => setResetOffen(false)} title="Neues Spiel starten?">
        <p className="text-sm text-ink-500">
          Dein aktueller Fortschritt (Kapital, Portfolio, Verlauf) wird gelöscht. Das lässt sich nicht rückgängig machen.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setResetOffen(false)}>
            Abbrechen
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              reset()
              setResetOffen(false)
            }}
          >
            Ja, neu starten
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function CashflowZeile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-600">{label}</span>
      <span className={`tabular-nums font-semibold ${value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {value > 0 ? '+' : ''}
        {euro(value)}
      </span>
    </div>
  )
}
