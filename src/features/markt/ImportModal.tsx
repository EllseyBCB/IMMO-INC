import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Property, Zustand } from '../../data/types'
import { parseInserate, zuProperty } from '../../data/importParse'
import { useCustomListings } from '../../state/customListings'
import { Button, Field, Modal } from '../../components/ui'
import { euro } from '../../lib/format'

const ZUSTAENDE: Zustand[] = [
  'sanierungsbedürftig',
  'renovierungsbedürftig',
  'gepflegt',
  'modernisiert',
  'neuwertig',
  'erstbezug',
]

const BEISPIEL =
  'Tipp: Du kannst auch eine ganze Suchergebnis-Seite reinkopieren — die KI erkennt alle Inserate.\n\nBeispiel: „Helle 3-Zimmer-Wohnung in Köln-Ehrenfeld, 92 m², Baujahr 1994. Kaufpreis 415.000 €, Hausgeld 260 €. Modernisiert, Einbauküche, Balkon. Energieklasse C."'

export default function ImportModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { hinzufuegen, hinzufuegenViele } = useCustomListings()
  const [step, setStep] = useState<'text' | 'form' | 'liste'>('text')
  const [text, setText] = useState('')
  const [bilder, setBilder] = useState('')
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [entwurf, setEntwurf] = useState<Property | null>(null)
  const [liste, setListe] = useState<Property[]>([])
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set())

  async function analysieren() {
    if (!text.trim()) return
    setLaedt(true)
    setFehler(null)
    const bilderUrls = bilder.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    const res = await parseInserate(text, bilderUrls)
    setLaedt(false)
    if (!res.objekte.length) {
      setFehler(`${res.fehler ?? 'Unbekannter Fehler'} — du kannst die Daten auch manuell erfassen.`)
      return
    }
    if (res.objekte.length === 1) {
      setEntwurf(res.objekte[0])
      setStep('form')
    } else {
      setListe(res.objekte)
      setAusgewaehlt(new Set(res.objekte.map((o) => o.id)))
      setStep('liste')
    }
  }

  function manuell() {
    const bilderUrls = bilder.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    setEntwurf(
      zuProperty(
        { objektart: 'Wohnung', titel: 'Neues Objekt', stadt: '', kaufpreis: 250000, wohnflaeche: 70, zimmer: 3, baujahr: 1990 },
        bilderUrls,
      ),
    )
    setStep('form')
  }

  function speichernEinzeln() {
    if (!entwurf) return
    hinzufuegen(entwurf)
    onClose()
    navigate(`/objekt/${entwurf.id}`)
  }

  function speichernViele() {
    const gewaehlt = liste.filter((o) => ausgewaehlt.has(o.id))
    if (!gewaehlt.length) return
    hinzufuegenViele(gewaehlt)
    onClose()
    navigate('/')
  }

  function toggle(id: string) {
    setAusgewaehlt((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function set<K extends keyof Property>(key: K, value: Property[K]) {
    setEntwurf((e) => (e ? { ...e, [key]: value } : e))
  }

  return (
    <Modal open onClose={onClose} title="🏠 Echte Inserate importieren">
      {step === 'text' && (
        <div className="space-y-3">
          <p className="text-sm text-ink-500">
            Kopier den Text eines oder mehrerer echter Inserate (ImmoScout, Immowelt, ohnemakler …) hier rein — die KI
            macht daraus spielbare Objekte. Bleibt lokal in deinem Browser.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={BEISPIEL}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <Field label="Bild-URLs (optional, nur bei Einzel-Import)" hint="Ohne Angabe nutze ich passende Beispielfotos.">
            <textarea
              value={bilder}
              onChange={(e) => setBilder(e.target.value)}
              rows={2}
              placeholder="https://…/foto1.jpg"
              className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-brand-400"
            />
          </Field>
          {fehler && <div className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-700">{fehler}</div>}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={manuell}>
              Manuell erfassen
            </Button>
            <Button className="flex-1" disabled={!text.trim() || laedt} onClick={analysieren}>
              {laedt ? 'Analysiere…' : '✨ Analysieren'}
            </Button>
          </div>
        </div>
      )}

      {step === 'liste' && (
        <div className="space-y-3">
          <p className="text-sm text-ink-500">
            <strong>{liste.length} Inserate</strong> erkannt. Wähle aus, was auf deinen Markt soll.
          </p>
          <div className="max-h-[46vh] space-y-2 overflow-y-auto">
            {liste.map((o) => {
              const aktiv = ausgewaehlt.has(o.id)
              return (
                <button
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                    aktiv ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-xs ${
                      aktiv ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {aktiv ? '✓' : ''}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">{o.titel}</span>
                    <span className="block text-xs text-ink-500">
                      {o.stadt}
                      {o.stadtteil ? `, ${o.stadtteil}` : ''} · {o.wohnflaeche} m² · {o.zimmer} Zi.
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-ink-900">{euro(o.kaufpreis)}</span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('text')}>
              ← Zurück
            </Button>
            <Button className="flex-1" disabled={ausgewaehlt.size === 0} onClick={speichernViele}>
              {ausgewaehlt.size} auf den Markt
            </Button>
          </div>
        </div>
      )}

      {step === 'form' && entwurf && (
        <div className="space-y-3">
          <p className="text-sm text-ink-500">Prüfe & korrigiere die Daten, dann ab auf den Markt.</p>
          <div className="overflow-hidden rounded-xl">
            <img src={entwurf.bilder[0]} alt="" className="h-32 w-full object-cover" />
          </div>
          <Field label="Titel">
            <input value={entwurf.titel} onChange={(e) => set('titel', e.target.value)} className="feld" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Stadt">
              <input value={entwurf.stadt} onChange={(e) => set('stadt', e.target.value)} className="feld" />
            </Field>
            <Field label="Stadtteil">
              <input value={entwurf.stadtteil} onChange={(e) => set('stadtteil', e.target.value)} className="feld" />
            </Field>
            <Field label="Kaufpreis (€)">
              <input type="number" value={entwurf.kaufpreis} onChange={(e) => set('kaufpreis', Number(e.target.value))} className="feld" />
            </Field>
            <Field label="Marktwert (€)">
              <input type="number" value={entwurf.marktwert} onChange={(e) => set('marktwert', Number(e.target.value))} className="feld" />
            </Field>
            <Field label="Wohnfläche (m²)">
              <input type="number" value={entwurf.wohnflaeche} onChange={(e) => set('wohnflaeche', Number(e.target.value))} className="feld" />
            </Field>
            <Field label="Zimmer">
              <input type="number" step="0.5" value={entwurf.zimmer} onChange={(e) => set('zimmer', Number(e.target.value))} className="feld" />
            </Field>
            <Field label="Baujahr">
              <input type="number" value={entwurf.baujahr} onChange={(e) => set('baujahr', Number(e.target.value))} className="feld" />
            </Field>
            <Field label="Kaltmiete (€/M)">
              <input type="number" value={entwurf.kaltmieteMarkt} onChange={(e) => set('kaltmieteMarkt', Number(e.target.value))} className="feld" />
            </Field>
          </div>
          <Field label="Zustand">
            <select value={entwurf.zustand} onChange={(e) => set('zustand', e.target.value as Zustand)} className="feld">
              {ZUSTAENDE.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('text')}>
              ← Zurück
            </Button>
            <Button className="flex-1" onClick={speichernEinzeln}>
              Zum Markt hinzufügen
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
