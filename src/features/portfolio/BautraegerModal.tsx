import { useState } from 'react'
import type { OwnedProperty } from '../../state/game'
import { useGame } from '../../state/game'
import type { Qualitaet, RenovationScope } from '../../data/types'
import { QUALITAET_FAKTOR, RENOVATION_KATALOG, berechneRenovierung } from '../../data/renovation'
import { Button, Modal, Stat } from '../../components/ui'
import { euro } from '../../lib/format'

export default function BautraegerModal({ o, onClose }: { o: OwnedProperty; onClose: () => void }) {
  const { cash, renovieren } = useGame()
  const [scopes, setScopes] = useState<RenovationScope[]>([])
  const [qualitaet, setQualitaet] = useState<Qualitaet>('gehoben')

  const r = berechneRenovierung(
    scopes,
    qualitaet,
    o.property.wohnflaeche,
    o.property.marktwert,
    o.property.sanierungspotenzial,
  )
  const zuTeuer = r.kosten > cash
  const nichtsGewaehlt = scopes.length === 0
  const roi = r.kosten > 0 ? ((r.wertsteigerung - r.kosten) / r.kosten) * 100 : 0

  function toggle(scope: RenovationScope) {
    setScopes((s) => (s.includes(scope) ? s.filter((x) => x !== scope) : [...s, scope]))
  }

  return (
    <Modal open onClose={onClose} title="🏗️ Bauträger — Renovierung planen">
      <p className="text-sm text-ink-500">
        Wähle Gewerke für <span className="font-semibold text-ink-700">{o.property.titel}</span> ({o.property.wohnflaeche} m²).
        Mehr Umfang &amp; Qualität = höhere Kosten, aber auch mehr Wertsteigerung.
      </p>

      <div className="mt-4 space-y-2">
        {RENOVATION_KATALOG.map((item) => {
          const aktiv = scopes.includes(item.scope)
          const einzel = berechneRenovierung(
            [item.scope],
            qualitaet,
            o.property.wohnflaeche,
            o.property.marktwert,
            o.property.sanierungspotenzial,
          )
          return (
            <button
              key={item.scope}
              onClick={() => toggle(item.scope)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                aktiv ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink-900">{item.label}</span>
                <span className="block text-xs text-ink-500">{item.beschreibung}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-bold text-ink-900">{euro(einzel.kosten)}</span>
                <span
                  className={`grid h-5 w-5 place-items-center rounded-md text-xs ${
                    aktiv ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {aktiv ? '✓' : '+'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <div className="mb-1 text-sm font-medium text-ink-700">Ausführungsqualität</div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(QUALITAET_FAKTOR) as Qualitaet[]).map((q) => (
            <button
              key={q}
              onClick={() => setQualitaet(q)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                qualitaet === q ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-700'
              }`}
            >
              {QUALITAET_FAKTOR[q].label}
            </button>
          ))}
        </div>
      </div>

      {!nichtsGewaehlt && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
          <Stat label="Kosten" value={euro(r.kosten)} tone="down" />
          <Stat label="Wertsteigerung" value={euro(r.wertsteigerung)} tone="up" />
          <Stat label="Bauzeit" value={`${r.bauzeit} Monate`} />
          <Stat label="Marge nach Kosten" value={`${roi >= 0 ? '+' : ''}${roi.toFixed(0)} %`} tone={roi >= 0 ? 'up' : 'down'} />
        </div>
      )}

      {!nichtsGewaehlt && (
        <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
            <span>✨ KI-Renovierungsvorschau</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold">bald im Handy</span>
          </div>
          <p className="mt-1 text-xs italic text-violet-700/80">
            „{o.property.objektart}, {r.prompt}, bright clean interior, photorealistic"
          </p>
          <p className="mt-1 text-[11px] text-violet-600/70">
            Dieser Prompt erzeugt später per KI ein Vorher/Nachher-Bild deiner Renovierung.
          </p>
        </div>
      )}

      {zuTeuer && (
        <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
          Nicht genug Liquidität ({euro(cash)} verfügbar). Reduziere den Umfang oder die Qualität.
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          className="flex-1"
          disabled={nichtsGewaehlt || zuTeuer}
          onClick={() => {
            renovieren(o.uid, scopes, qualitaet)
            onClose()
          }}
        >
          Beauftragen {r.kosten > 0 ? `· ${euro(r.kosten)}` : ''}
        </Button>
      </div>
    </Modal>
  )
}
