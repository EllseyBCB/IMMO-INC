import { useState } from 'react'
import { monatlicheRaten, schulden, useGame } from '../../state/game'
import { annuitaet, bonitaet } from '../../lib/finanzen'
import { Card, Slider, Stat } from '../../components/ui'
import { euro, pct } from '../../lib/format'
import type { PhoneNav } from '../phone/nav'

export default function Bank({ nav }: { nav: PhoneNav }) {
  const { cash, owned, lebenssituation } = useGame()
  const bon = bonitaet({
    nettoEinkommen: lebenssituation.nettoEinkommen,
    fixkosten: lebenssituation.fixkosten,
    eigenkapital: cash,
    bestehendeRaten: monatlicheRaten(owned),
  })

  const [summe, setSumme] = useState(250000)
  const [laufzeit, setLaufzeit] = useState(25)
  const rate = annuitaet(summe, bon.empfohlenerZins, laufzeit)
  const gesamt = rate * laufzeit * 12
  const zinskosten = gesamt - summe

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-white shadow-soft">🏦</div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink-900">Deine Bank</h1>
          <p className="text-sm text-ink-500">Bonität, Konditionen und laufende Finanzierungen</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Bonität */}
        <Card className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Bonität</h2>
          <div className="mt-3 flex items-end gap-4">
            <div className="relative grid h-24 w-24 place-items-center">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeDasharray={`${bon.score} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-xl font-black text-ink-900">{bon.score}</div>
                <div className="text-[10px] text-ink-500">Score</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold capitalize text-ink-900">{bon.label}</div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Stat label="Sollzins" value={pct(bon.empfohlenerZins * 100, 2)} />
                <Stat label="Max. Darlehen" value={euro(bon.maxDarlehen)} />
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Bessere Bonität = niedrigerer Zins und höherer Rahmen. Sie steigt mit Einkommen und Eigenkapital, sinkt mit
            bestehenden Raten.
          </p>
          <div className="mt-3 rounded-xl bg-brand-50/60 p-3 text-xs text-ink-600">
            <div className="font-bold text-brand-700">So bekommst du eher eine Zusage</div>
            <ul className="mt-1 space-y-1">
              <li>💶 <strong>Mehr Eigenkapital</strong> senkt den Beleihungsauslauf → niedrigerer fairer Zins &amp; leichtere Genehmigung.</li>
              <li>📈 <strong>Höheres Zins-Angebot</strong> im Kauf-Fenster → die Bank finanziert eher (kostet aber mehr Monatsrate).</li>
            </ul>
          </div>
        </Card>

        {/* Kreditrechner */}
        <Card className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Kreditrechner</h2>
          <div className="mt-3 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-ink-700">Darlehenssumme</span>
                <span className="font-bold tabular-nums text-ink-900">{euro(summe)}</span>
              </div>
              <Slider value={summe} min={50000} max={800000} step={10000} onChange={setSumme} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-ink-700">Laufzeit</span>
                <span className="font-bold tabular-nums text-ink-900">{laufzeit} Jahre</span>
              </div>
              <Slider value={laufzeit} min={10} max={35} step={1} onChange={setLaufzeit} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
            <Stat label="Monatsrate" value={euro(rate)} tone="down" />
            <Stat label="Zinskosten gesamt" value={euro(zinskosten)} />
            <Stat label="Gesamtsumme" value={euro(gesamt)} />
          </div>
          {summe > bon.maxDarlehen && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              Über deinem aktuellen Rahmen ({euro(bon.maxDarlehen)}).
            </p>
          )}
        </Card>
      </div>

      {/* Laufende Darlehen */}
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Laufende Finanzierungen</h2>
          <span className="text-sm font-bold text-ink-900">Summe: {euro(schulden(owned))}</span>
        </div>
        {owned.filter((o) => o.restschuld > 0).length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            Keine laufenden Darlehen. Finanzierungen schließt du direkt beim Kauf ab —{' '}
            <button onClick={() => nav.open('immobilien')} className="font-semibold text-brand-600">
              zum Markt
            </button>
            .
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {owned
              .filter((o) => o.restschuld > 0)
              .map((o) => (
                <div key={o.uid} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{o.property.titel}</div>
                    <div className="text-xs text-ink-500">
                      {pct(o.finanzierung.sollzins * 100, 2)} · {o.finanzierung.laufzeitJahre} J
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-ink-900">{euro(o.restschuld)}</div>
                    <div className="text-xs text-ink-500">{euro(o.finanzierung.monatsrate)}/M</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  )
}
