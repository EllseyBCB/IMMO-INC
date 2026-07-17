import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { OwnedProperty } from '../../state/game'
import { monatlicheMiete, monatlicheRaten, portfolioWert, renoRestMs, schulden, skipKosten, useGame } from '../../state/game'
import { Badge, Button, Card, Stat } from '../../components/ui'
import { dauer, euro, gameDate } from '../../lib/format'
import { zustandLabel, zustandTone } from '../markt/propertyUtil'
import BautraegerModal from './BautraegerModal'
import VerkaufModal from './VerkaufModal'
import VermietenModal from './VermietenModal'

export default function Portfolio() {
  const owned = useGame((s) => s.owned)
  const [renoUid, setRenoUid] = useState<string | null>(null)
  // Verkauf hält eine Momentaufnahme: nach dem Verkauf verschwindet das Objekt
  // aus `owned`, das Ergebnis-Fenster soll aber sichtbar bleiben.
  const [verkaufObjekt, setVerkaufObjekt] = useState<OwnedProperty | null>(null)
  const [vermietObjekt, setVermietObjekt] = useState<OwnedProperty | null>(null)

  const wert = portfolioWert(owned)
  const debt = schulden(owned)
  const raten = monatlicheRaten(owned)
  const miete = monatlicheMiete(owned)

  const renoObjekt = owned.find((o) => o.uid === renoUid) ?? null

  return (
    <div>
      {owned.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card">
          <div className="text-4xl">🗂️</div>
          <h2 className="mt-3 text-lg font-bold text-ink-900">Noch keine Immobilien</h2>
          <p className="mt-1 text-sm text-ink-500">Kauf dein erstes Objekt auf dem Markt und starte dein Imperium.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Zum Markt</Button>
          </Link>
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

          <div className="mt-5 space-y-4">
            {owned.map((o) => (
              <ObjektKarte
                key={o.uid}
                o={o}
                onRenovieren={() => setRenoUid(o.uid)}
                onVerkaufen={() => setVerkaufObjekt(o)}
                onVermieten={() => setVermietObjekt(o)}
              />
            ))}
          </div>
        </>
      )}

      {/* Modals immer an gleicher Baum-Position — bleiben über den 1→0-Übergang stabil */}
      {renoObjekt && <BautraegerModal o={renoObjekt} onClose={() => setRenoUid(null)} />}
      {verkaufObjekt && <VerkaufModal o={verkaufObjekt} onClose={() => setVerkaufObjekt(null)} />}
      {vermietObjekt && <VermietenModal o={vermietObjekt} onClose={() => setVermietObjekt(null)} />}
    </div>
  )
}

function ObjektKarte({
  o,
  onRenovieren,
  onVerkaufen,
  onVermieten,
}: {
  o: OwnedProperty
  onRenovieren: () => void
  onVerkaufen: () => void
  onVermieten: () => void
}) {
  const { cash, renovierungBeschleunigen, setNutzung } = useGame()
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
            <Stat
              label="Buchgewinn"
              value={euro(gewinnGeschaetzt)}
              tone={gewinnGeschaetzt >= 0 ? 'up' : 'down'}
            />
          </div>

          {inArbeit && reno && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800">
                  🏗️ Baustelle — fertig in <span className="tabular-nums">{dauer(renoRestMs(o))}</span>
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
              <span className="text-sm font-semibold text-emerald-800">🔑 Vermietet</span>
              <span className="text-sm font-bold tabular-nums text-emerald-700">
                {euro(o.kaltmiete)}<span className="text-xs font-medium text-emerald-600">/Monat Miete</span>
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={onRenovieren} disabled={inArbeit}>
              🏗️ Bauträger
            </Button>
            {o.nutzung === 'vermietet' ? (
              <>
                <Button variant="outline" onClick={onVermieten} disabled={inArbeit}>
                  ✏️ Miete ändern
                </Button>
                <Button variant="ghost" onClick={() => setNutzung(o.uid, 'leer')} disabled={inArbeit}>
                  ⏸️ Beenden
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onVermieten} disabled={inArbeit}>
                🔑 Vermieten
              </Button>
            )}
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
