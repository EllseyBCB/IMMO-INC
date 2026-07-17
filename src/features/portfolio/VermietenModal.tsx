import { useState } from 'react'
import type { OwnedProperty } from '../../state/game'
import { useGame } from '../../state/game'
import { Button, Modal, Slider, Stat } from '../../components/ui'
import { euro, pct } from '../../lib/format'

export default function VermietenModal({ o, onClose }: { o: OwnedProperty; onClose: () => void }) {
  const vermieten = useGame((s) => s.vermieten)
  const markt = Math.round(o.property.kaltmieteMarkt || o.kaltmiete || o.property.wohnflaeche * 10)
  const min = Math.round(markt * 0.5)
  const max = Math.round(markt * 1.6)
  const [miete, setMiete] = useState(o.nutzung === 'vermietet' ? o.kaltmiete : markt)

  const rendite = o.kaufpreis > 0 ? ((miete * 12) / o.kaufpreis) * 100 : 0
  const nettoProM = miete - (o.restschuld > 0 ? o.finanzierung.monatsrate : 0)
  const ueberMarkt = miete / markt

  const risiko = ueberMarkt > 1.15 ? 'hoch' : ueberMarkt > 1.02 ? 'mittel' : 'gering'
  const risikoFarbe = risiko === 'hoch' ? 'text-rose-600' : risiko === 'mittel' ? 'text-amber-600' : 'text-emerald-600'

  return (
    <Modal open onClose={onClose} title="🔑 Vermieten — Miete festlegen">
      <p className="text-sm text-ink-500">
        Leg die monatliche Kaltmiete für <span className="font-semibold text-ink-700">{o.property.titel}</span> fest.
        Marktüblich sind hier ca. <span className="font-semibold text-ink-700">{euro(markt)}</span>/Monat.
      </p>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-700">Deine Kaltmiete</span>
          <span className="text-lg font-black tabular-nums text-ink-900">{euro(miete)}<span className="text-xs font-medium text-ink-500">/M</span></span>
        </div>
        <Slider value={miete} min={min} max={max} step={10} onChange={setMiete} />
        <div className="mt-1 flex justify-between text-xs text-ink-500">
          <span>{euro(min)}</span>
          <span>Markt: {euro(markt)}</span>
          <span>{euro(max)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-emerald-50/60 p-4">
        <Stat label="Miete / Monat" value={euro(miete)} tone="up" />
        <Stat label="Miete / Jahr" value={euro(miete * 12)} tone="up" />
        <Stat label="Brutto-Rendite" value={pct(rendite)} />
        <Stat label="Netto n. Rate / M" value={euro(nettoProM)} tone={nettoProM >= 0 ? 'up' : 'down'} />
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-ink-600">
        Vermietbarkeit / Mieter-Risiko:{' '}
        <span className={`font-bold ${risikoFarbe}`}>{risiko}</span>.{' '}
        {ueberMarkt > 1.02
          ? 'Über Marktmiete bringt mehr Geld, aber es dauert länger einen (guten) Mieter zu finden.'
          : 'Marktnah oder darunter — findet schnell zuverlässige Mieter.'}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          variant="success"
          className="flex-1"
          onClick={() => {
            vermieten(o.uid, miete)
            onClose()
          }}
        >
          {o.nutzung === 'vermietet' ? 'Miete aktualisieren' : `Vermieten für ${euro(miete)}/M`}
        </Button>
      </div>
    </Modal>
  )
}
