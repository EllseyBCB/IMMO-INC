import { useState } from 'react'
import { useGame } from '../../../state/game'
import { Button, Modal } from '../../../components/ui'

export default function EinstellungenApp() {
  const { spielerName, reset } = useGame()
  const [resetOffen, setResetOffen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
        <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Profil</div>
        <div className="mt-1 text-lg font-black text-ink-900">{spielerName || 'Investor:in'}</div>
        <div className="text-sm text-ink-500">IMMO INC — dein Immobilien-Imperium</div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
        <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Über</div>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Alles läuft über dein Handy: Immobilien suchen, finanzieren, renovieren, vermieten, an der Börse handeln,
          sparen und im Internet recherchieren. Die Zeit läuft in Echtzeit — 4 Stunden sind ein Spiel-Monat.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
        <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Spielstand</div>
        <p className="mt-1 text-sm text-ink-500">Der Fortschritt wird automatisch auf diesem Gerät gespeichert.</p>
        <Button variant="danger" className="mt-3 w-full" onClick={() => setResetOffen(true)}>
          Neues Spiel starten
        </Button>
      </div>

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
