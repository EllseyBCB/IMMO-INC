import { useState } from 'react'
import type { OwnedProperty } from '../../state/game'
import { useGame } from '../../state/game'
import { spekulationssteuer, verkaufsnebenkosten } from '../../lib/finanzen'
import { Button, Modal, Slider, Stat } from '../../components/ui'
import { euro } from '../../lib/format'

export default function VerkaufModal({ o, onClose }: { o: OwnedProperty; onClose: () => void }) {
  const { verkaufen, monthIndex } = useGame()
  const [preis, setPreis] = useState(o.aktuellerWert)
  const [ergebnis, setErgebnis] = useState<{ erzielt: number; netto: number } | null>(null)

  const investiert = o.kaufpreis + o.nebenkosten + (o.renovierung?.kosten ?? 0)
  const haltedauer = monthIndex - o.gekauftMonth
  const vnk = verkaufsnebenkosten(preis)
  const bruttoGewinn = preis - investiert
  const steuer = spekulationssteuer(bruttoGewinn, haltedauer)
  const nettoErwartet = preis - vnk - o.restschuld - steuer

  // Preis über Marktwert → Vermarktungsrisiko (Abschlag-Wahrscheinlichkeit)
  const ueberMarkt = preis / o.aktuellerWert
  const risiko = ueberMarkt > 1.05 ? 'hoch' : ueberMarkt > 1.0 ? 'mittel' : 'gering'

  function abschliessen() {
    // Marktrealität: bei ambitioniertem Preis kann ein Abschlag nötig werden (Glück/Pech).
    const gier = Math.max(0, ueberMarkt - 1)
    const abschlagRisiko = Math.min(0.9, gier * 8) // je gieriger, desto wahrscheinlicher ein Abschlag
    let faktor = 1
    if (Math.random() < abschlagRisiko) {
      faktor = 0.92 + Math.random() * 0.05 // 8–3 % Abschlag
    } else {
      faktor = 0.99 + Math.random() * 0.03 // ±kleiner Zufall
    }
    const erzielt = Math.round(preis * faktor)
    const netto = verkaufen(o.uid, erzielt)
    setErgebnis({ erzielt, netto })
  }

  if (ergebnis) {
    const gewinn = ergebnis.erzielt - investiert
    return (
      <Modal open onClose={onClose} title="Verkauf abgeschlossen">
        <div className="py-2 text-center">
          <div className="text-5xl">{gewinn >= 0 ? '🎉' : '📉'}</div>
          <h3 className="mt-3 text-lg font-bold text-ink-900">
            Verkauft für {euro(ergebnis.erzielt)}
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            {gewinn >= 0 ? 'Gewinn' : 'Verlust'} vor Steuer:{' '}
            <span className={gewinn >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
              {euro(gewinn)}
            </span>
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-ink-500">Netto in die Kasse</span>
              <span className="font-bold tabular-nums text-emerald-600">{euro(ergebnis.netto)}</span>
            </div>
          </div>
          <Button className="mt-4 w-full" onClick={onClose}>
            Weiter
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title="💰 Objekt verkaufen (Flip)">
      <p className="text-sm text-ink-500">
        Geschätzter Marktwert: <span className="font-semibold text-ink-700">{euro(o.aktuellerWert)}</span>. Setz deinen
        Angebotspreis — hoch pokern kann sich lohnen, birgt aber Vermarktungsrisiko.
      </p>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-sm">
          <span className="font-medium text-ink-700">Angebotspreis</span>
          <span className="font-bold tabular-nums text-ink-900">{euro(preis)}</span>
        </div>
        <Slider
          value={preis}
          min={Math.round(o.aktuellerWert * 0.85)}
          max={Math.round(o.aktuellerWert * 1.15)}
          step={1000}
          onChange={setPreis}
        />
        <div className="mt-1 text-right text-xs">
          Risiko:{' '}
          <span
            className={
              risiko === 'hoch' ? 'font-semibold text-rose-600' : risiko === 'mittel' ? 'font-semibold text-amber-600' : 'font-semibold text-emerald-600'
            }
          >
            {risiko}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
        <Stat label="Investiert" value={euro(investiert)} />
        <Stat label="Restschuld" value={euro(o.restschuld)} tone="down" />
        <Stat label="Verkaufskosten" value={euro(vnk)} tone="down" />
        <Stat
          label={haltedauer >= 120 ? 'Steuer (>10J frei)' : `Spek.-Steuer (${Math.floor(haltedauer / 12)}J)`}
          value={euro(steuer)}
          tone="down"
        />
      </div>

      <div className="mt-3 rounded-xl bg-emerald-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-emerald-800">Erwarteter Netto-Erlös</span>
          <span className="text-lg font-black tabular-nums text-emerald-700">{euro(nettoErwartet)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Abbrechen
        </Button>
        <Button variant="success" className="flex-1" onClick={abschliessen}>
          Zum Verkauf anbieten
        </Button>
      </div>
    </Modal>
  )
}
