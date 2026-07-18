import { useState } from 'react'
import type { OwnedProperty } from '../../state/game'
import { monatlicheMiete, monatlicheRaten, portfolioWert, renoRestMs, schulden, skipKosten, useGame } from '../../state/game'
import { Badge, Button, Card, Stat } from '../../components/ui'
import { dauer, euro, gameDate } from '../../lib/format'
import { zustandLabel, zustandTone } from '../markt/propertyUtil'
import VerkaufModal from './VerkaufModal'
import type { PhoneNav } from '../phone/nav'

export default function Portfolio({ nav }: { nav: PhoneNav }) {
  const owned = useGame((s) => s.owned)
  // Verkauf hält eine Momentaufnahme: nach dem Verkauf verschwindet das Objekt
  // aus `owned`, das Ergebnis-Fenster soll aber sichtbar bleiben.
  const [verkaufObjekt, setVerkaufObjekt] = useState<OwnedProperty | null>(null)

  const wert = portfolioWert(owned)
  const debt = schulden(owned)
  const raten = monatlicheRaten(owned)
  const miete = monatlicheMiete(owned)

  return (
    <div>
      {owned.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card">
          <div className="text-4xl">🗂️</div>
          <h2 className="mt-3 text-lg font-bold text-ink-900">Noch keine Immobilien</h2>
          <p className="mt-1 text-sm text-ink-500">Kauf dein erstes Objekt auf dem Markt und starte dein Imperium.</p>
          <div className="mt-4">
            <Button onClick={() => nav.open('immobilien')}>Zum Markt</Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-black tracking-tight text-ink-900">Mein Portfolio</h1>
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/[0.04] sm:grid-cols-4">
            <Stat label="Objekte" value={String(owned.length)} />
            <Stat label="Portfoliowert" value={euro(wert)} />
            <Stat label="Restschulden" value={euro(debt)} tone="down" />
            <Stat label="Miete − Rate / M" value={euro(miete - raten)} tone={miete - raten >= 0 ? 'up' : 'down'} />
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-50/70 px-4 py-2 text-xs text-brand-700">
            <span>📱</span>
            <span>
              <strong>Vermieten &amp; Renovieren</strong> läuft über die Apps <button onClick={() => nav.open('vermietung')} className="font-bold underline">Vermietung</button> und <button onClick={() => nav.open('bautraeger')} className="font-bold underline">Bauträger</button> —
              dort verhandelst du mit Mietern und Bauträgern.
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {owned.map((o) => (
              <ObjektKarte key={o.uid} o={o} onVerkaufen={() => setVerkaufObjekt(o)} />
            ))}
          </div>
        </>
      )}

      {verkaufObjekt && <VerkaufModal o={verkaufObjekt} onClose={() => setVerkaufObjekt(null)} />}
    </div>
  )
}

function ObjektKarte({ o, onVerkaufen }: { o: OwnedProperty; onVerkaufen: () => void }) {
  const { cash, renovierungBeschleunigen } = useGame()
  const p = o.property
  const reno = o.renovierung
  const inArbeit = reno?.status === 'in_arbeit'
  const skip = inArbeit ? skipKosten(o) : 0
  const eigenkapitalGebunden = o.kaufpreis + o.nebenkosten + (reno?.kosten ?? 0) - o.finanzierung.darlehen
  const gewinnGeschaetzt = o.aktuellerWert - (o.kaufpreis + o.nebenkosten + (reno?.kosten ?? 0))

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-56 sm:shrink-0">
          <img src={p.bilder[0]} alt={p.titel} className="h-40 w-full object-cover sm:h-full" />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {o.nutzung === 'vermietet' && <Badge tone="green">Vermietet</Badge>}
            {inArbeit && <Badge tone="amber">Baustelle</Badge>}
            {reno?.status === 'fertig' && <Badge tone="blue">Renoviert</Badge>}
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-ink-900">{p.titel}</h3>
              <p className="text-xs text-ink-500">
                {p.stadtteil}, {p.stadt} · gekauft {gameDate(o.gekauftMonth)}
              </p>
            </div>
            <Badge tone={zustandTone(p.zustand)}>{zustandLabel(p.zustand)}</Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Akt. Wert" value={euro(o.aktuellerWert)} />
            <Stat label="Restschuld" value={euro(o.restschuld)} tone="down" />
            <Stat label="Rate / M" value={euro(o.finanzierung.monatsrate)} />
            <Stat label="Buchgewinn" value={euro(gewinnGeschaetzt)} tone={gewinnGeschaetzt >= 0 ? 'up' : 'down'} />
          </div>

          {inArbeit && reno && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800">
                  🏗️ Baustelle{reno.bautraeger ? ` (${reno.bautraeger})` : ''} — fertig in{' '}
                  <span className="tabular-nums">{dauer(renoRestMs(o))}</span>
                </span>
                <span className="text-[11px] font-medium text-amber-700">+{euro(reno.wertsteigerung)} Wert</span>
              </div>
              <button
                onClick={() => renovierungBeschleunigen(o.uid)}
                disabled={skip > cash}
                className="mt-2 w-full rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-40"
              >
                ⚡ Sofort fertigstellen{skip > 0 ? ` · ${euro(skip)}` : ''}
              </button>
            </div>
          )}

          {o.nutzung === 'vermietet' && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
              <span className="text-sm font-semibold text-emerald-800">
                🔑 {o.mieterName ?? 'Vermietet'}
                {o.mieterRisiko ? <span className="ml-1 text-[11px] font-medium text-emerald-600">· Risiko {o.mieterRisiko}</span> : null}
              </span>
              <span className="text-sm font-bold tabular-nums text-emerald-700">
                {euro(o.kaltmiete)}<span className="text-xs font-medium text-emerald-600">/Monat</span>
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="success" onClick={onVerkaufen} disabled={inArbeit}>
              💰 Verkaufen
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-ink-400">Gebundenes Eigenkapital: {euro(eigenkapitalGebunden)}</p>
        </div>
      </div>
    </Card>
  )
}
