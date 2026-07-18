import { useState } from 'react'
import type { OwnedProperty } from '../../state/game'
import { monatlicheMiete, monatlicheRaten, portfolioWert, renoRestMs, schulden, skipKosten, useGame } from '../../state/game'
import { Badge, Button } from '../../components/ui'
import { dauer, euro, gameDate } from '../../lib/format'
import { zustandLabel, zustandTone } from '../markt/propertyUtil'
import VerkaufModal from './VerkaufModal'
import type { PhoneNav } from '../phone/nav'

export default function Portfolio({ nav }: { nav: PhoneNav }) {
  const owned = useGame((s) => s.owned)
  const [verkaufObjekt, setVerkaufObjekt] = useState<OwnedProperty | null>(null)

  const wert = portfolioWert(owned)
  const debt = schulden(owned)
  const raten = monatlicheRaten(owned)
  const miete = monatlicheMiete(owned)

  if (owned.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-card">
        <div className="text-4xl">🗂️</div>
        <h2 className="mt-3 text-lg font-bold text-ink-900">Noch keine Immobilien</h2>
        <p className="mt-1 text-sm text-ink-500">Kauf dein erstes Objekt in ImmoProud und starte dein Imperium.</p>
        <div className="mt-4">
          <Button onClick={() => nav.open('immobilien')}>Zu ImmoProud</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Übersicht */}
      <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/[0.04]">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-ink-500">Portfoliowert · {owned.length} Objekte</span>
        </div>
        <div className="mt-0.5 text-3xl font-black tabular-nums text-ink-900">{euro(wert)}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="Restschulden" value={euro(debt)} rot />
          <MiniStat label="Miete − Rate / M" value={euro(miete - raten)} gruen={miete - raten >= 0} rot={miete - raten < 0} />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-brand-50/70 px-3 py-2 text-[11px] text-brand-700">
        <span>📱</span>
        <span>
          <strong>Vermieten</strong> läuft über <button onClick={() => nav.open('immobilien')} className="font-bold underline">ImmoProud</button>,{' '}
          <strong>Renovieren</strong> über <button onClick={() => nav.open('bautraeger')} className="font-bold underline">Bauträger</button>.
        </span>
      </div>

      {owned.map((o) => (
        <ObjektKarte key={o.uid} o={o} onVerkaufen={() => setVerkaufObjekt(o)} />
      ))}

      {verkaufObjekt && <VerkaufModal o={verkaufObjekt} onClose={() => setVerkaufObjekt(null)} />}
    </div>
  )
}

function MiniStat({ label, value, gruen, rot }: { label: string; value: string; gruen?: boolean; rot?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className={`text-sm font-black tabular-nums ${rot ? 'text-rose-600' : gruen ? 'text-emerald-600' : 'text-ink-900'}`}>{value}</div>
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
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/[0.04]">
      {/* Bild */}
      <div className="relative">
        <img src={p.bilder[0]} alt={p.titel} className="h-40 w-full object-cover" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {o.nutzung === 'vermietet' && <Badge tone="green">Vermietet</Badge>}
          {inArbeit && <Badge tone="amber">Baustelle</Badge>}
          {reno?.status === 'fertig' && <Badge tone="blue">Renoviert</Badge>}
        </div>
        <div className="absolute right-2 top-2">
          <Badge tone={zustandTone(p.zustand)}>{zustandLabel(p.zustand)}</Badge>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-bold leading-snug text-ink-900">{p.titel}</h3>
        <p className="text-xs text-ink-500">
          {p.stadtteil ? `${p.stadtteil}, ` : ''}{p.stadt} · gekauft {gameDate(o.gekauftMonth)}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="Akt. Wert" value={euro(o.aktuellerWert)} />
          <MiniStat label="Restschuld" value={euro(o.restschuld)} rot />
          <MiniStat label="Rate / M" value={euro(o.finanzierung.monatsrate)} />
          <MiniStat label="Buchgewinn" value={euro(gewinnGeschaetzt)} gruen={gewinnGeschaetzt >= 0} rot={gewinnGeschaetzt < 0} />
        </div>

        {inArbeit && reno && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-800">
                🏗️ Baustelle — fertig in <span className="tabular-nums">{dauer(renoRestMs(o))}</span>
              </span>
              <span className="shrink-0 text-[11px] font-medium text-amber-700">+{euro(reno.wertsteigerung)}</span>
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
            <span className="min-w-0 truncate text-sm font-semibold text-emerald-800">
              🔑 {o.mieterName ?? 'Vermietet'}
              {o.mieterRisiko ? <span className="ml-1 text-[11px] font-medium text-emerald-600">· {o.mieterRisiko}</span> : null}
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-700">
              {euro(o.kaltmiete)}<span className="text-[11px] font-medium text-emerald-600">/M</span>
            </span>
          </div>
        )}

        <Button variant="success" className="mt-3 w-full" onClick={onVerkaufen} disabled={inArbeit}>
          💰 Verkaufen
        </Button>
        <p className="mt-1.5 text-center text-[11px] text-ink-400">Gebundenes Eigenkapital: {euro(eigenkapitalGebunden)}</p>
      </div>
    </div>
  )
}
