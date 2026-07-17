import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import type { Property } from '../../data/types'
import { ladeMarkt } from '../../data/openimmo'
import { berechneFinanzierung, monatlicheRaten, useGame } from '../../state/game'
import { bonitaet, kaufnebenkosten } from '../../lib/finanzen'
import { Badge, Button, Card, Modal, Slider, Stat } from '../../components/ui'
import { euro, area, pct } from '../../lib/format'
import { mietrendite, zustandLabel, zustandTone } from './propertyUtil'

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cash, owned, lebenssituation, kaufen, verkauft } = useGame()
  const [alle, setAlle] = useState<Property[] | null>(null)
  const [bild, setBild] = useState(0)
  const [kaufOffen, setKaufOffen] = useState(false)

  useEffect(() => {
    ladeMarkt().then(setAlle)
  }, [])

  const p = useMemo(() => alle?.find((x) => x.id === id), [alle, id])
  const schonGekauft = id ? verkauft.includes(id) : false

  const bon = useMemo(
    () =>
      bonitaet({
        nettoEinkommen: lebenssituation.nettoEinkommen,
        fixkosten: lebenssituation.fixkosten,
        eigenkapital: cash,
        bestehendeRaten: monatlicheRaten(owned),
      }),
    [lebenssituation, cash, owned],
  )

  if (!alle) {
    return <div className="animate-pulse rounded-2xl bg-white p-10 shadow-card">Lädt…</div>
  }
  if (!p) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-card">
        <p className="text-ink-500">Objekt nicht gefunden.</p>
        <Link to="/" className="mt-3 inline-block text-brand-600">
          ← Zurück zum Markt
        </Link>
      </div>
    )
  }

  const nk = kaufnebenkosten(p.kaufpreis, p.bundesland, true)
  const rendite = mietrendite(p.kaltmieteMarkt, p.kaufpreis)

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-3 text-sm font-semibold text-ink-500 hover:text-ink-700">
        ← Zurück
      </button>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Galerie */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-card">
            <img src={p.bilder[bild]} alt={p.titel} className="aspect-[16/10] w-full object-cover" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {p.bilder.map((b, i) => (
              <button
                key={i}
                onClick={() => setBild(i)}
                className={`overflow-hidden rounded-xl ring-2 transition ${
                  i === bild ? 'ring-brand-500' : 'ring-transparent hover:ring-slate-200'
                }`}
              >
                <img src={b} alt="" className="aspect-[4/3] w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Badge tone={zustandTone(p.zustand)}>{zustandLabel(p.zustand)}</Badge>
              <Badge tone="slate">{p.objektart}</Badge>
              <Badge tone="green">EK {p.energieklasse}</Badge>
            </div>
            <h1 className="mt-3 text-xl font-black leading-tight text-ink-900">{p.titel}</h1>
            <p className="text-sm text-ink-500">
              {p.stadtteil ? `${p.stadtteil}, ` : ''}
              {p.plz} {p.stadt} · {p.bundesland}
            </p>

            <div className="mt-4 text-3xl font-black text-ink-900">{euro(p.kaufpreis)}</div>
            <p className="text-xs text-ink-500">
              + Kaufnebenkosten ~{euro(nk.gesamt)} ({pct(nk.quote * 100)})
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <Stat label="Wohnfläche" value={area(p.wohnflaeche)} />
              <Stat label="Zimmer" value={p.zimmer.toLocaleString('de-DE')} />
              <Stat label="Baujahr" value={String(p.baujahr)} />
              <Stat label="Miete (Markt)" value={`${euro(p.kaltmieteMarkt)}/M`} />
              {p.grundstueck ? <Stat label="Grundstück" value={area(p.grundstueck)} /> : null}
              <Stat label="Brutto-Rendite" value={pct(rendite)} tone="up" />
            </div>

            <div className="mt-5">
              {schonGekauft ? (
                <Button variant="outline" className="w-full" onClick={() => navigate('/portfolio')}>
                  ✓ Bereits in deinem Portfolio
                </Button>
              ) : (
                <Button className="w-full" onClick={() => setKaufOffen(true)}>
                  Kaufen & finanzieren
                </Button>
              )}
              <div className="mt-2 text-center text-xs text-ink-500">
                Deine Bonität: <span className="font-semibold text-ink-700">{bon.label}</span> (Score {bon.score}/100)
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Beschreibung */}
      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Beschreibung</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{p.beschreibung}</p>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Ausstattung</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {p.ausstattung.map((a) => (
              <li key={a} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-ink-700">
                {a}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {kaufOffen && (
        <KaufModal
          p={p}
          cash={cash}
          bonScore={bon}
          onClose={() => setKaufOffen(false)}
          onConfirm={(fin, mitMakler) => {
            kaufen(p, fin, mitMakler)
            setKaufOffen(false)
            navigate('/portfolio')
          }}
        />
      )}
    </div>
  )
}

function KaufModal({
  p,
  cash,
  bonScore,
  onClose,
  onConfirm,
}: {
  p: Property
  cash: number
  bonScore: ReturnType<typeof bonitaet>
  onClose: () => void
  onConfirm: (fin: ReturnType<typeof berechneFinanzierung>, mitMakler: boolean) => void
}) {
  const nk = kaufnebenkosten(p.kaufpreis, p.bundesland, true)
  const gesamtkosten = p.kaufpreis + nk.gesamt
  const minEigen = Math.min(cash, Math.round(nk.gesamt)) // mind. Nebenkosten aus EK
  const [eigen, setEigen] = useState(Math.min(cash, Math.round(nk.gesamt + p.kaufpreis * 0.1)))
  const [laufzeit, setLaufzeit] = useState(25)

  const fin = berechneFinanzierung(p.kaufpreis, p.bundesland, true, eigen, bonScore.empfohlenerZins, laufzeit)

  const zuWenigCash = eigen > cash
  const darlehenZuHoch = fin.darlehen > bonScore.maxDarlehen
  const kannKaufen = !zuWenigCash && !darlehenZuHoch && eigen >= minEigen

  return (
    <Modal open onClose={onClose} title="Finanzierung & Kauf">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <Zeile label="Kaufpreis" value={euro(p.kaufpreis)} />
          <Zeile label="Grunderwerbsteuer" value={euro(nk.grunderwerbsteuer)} />
          <Zeile label="Notar & Grundbuch" value={euro(nk.notar + nk.grundbuch)} />
          <Zeile label="Maklercourtage" value={euro(nk.makler)} />
          <div className="my-2 border-t border-slate-200" />
          <Zeile label="Gesamtkosten" value={euro(gesamtkosten)} bold />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-ink-700">Eigenkapital-Einsatz</span>
            <span className="font-bold tabular-nums text-ink-900">{euro(eigen)}</span>
          </div>
          <Slider value={eigen} min={0} max={Math.min(cash, gesamtkosten)} step={1000} onChange={setEigen} />
          <div className="mt-1 flex justify-between text-xs text-ink-500">
            <span>verfügbar: {euro(cash)}</span>
            <span>Rest als Darlehen: {euro(fin.darlehen)}</span>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-ink-700">Laufzeit</span>
            <span className="font-bold tabular-nums text-ink-900">{laufzeit} Jahre</span>
          </div>
          <Slider value={laufzeit} min={10} max={35} step={1} onChange={setLaufzeit} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-brand-50/60 p-4">
          <Stat label="Sollzins (Bonität)" value={pct(bonScore.empfohlenerZins * 100, 2)} />
          <Stat label="Monatsrate" value={`${euro(fin.monatsrate)}`} tone="down" />
          <Stat label="Darlehen" value={euro(fin.darlehen)} />
          <Stat label="Max. Darlehen" value={euro(bonScore.maxDarlehen)} />
        </div>

        {zuWenigCash && <Hinweis tone="rose">Dein Eigenkapital-Einsatz übersteigt deine Liquidität.</Hinweis>}
        {darlehenZuHoch && (
          <Hinweis tone="rose">
            Das Darlehen übersteigt deinen Bonitätsrahmen ({euro(bonScore.maxDarlehen)}). Erhöhe den Eigenkapital-Einsatz
            oder wähle ein günstigeres Objekt.
          </Hinweis>
        )}
        {!darlehenZuHoch && eigen < minEigen && (
          <Hinweis tone="amber">Banken finanzieren i. d. R. keine Kaufnebenkosten — bring mindestens {euro(minEigen)} EK mit.</Hinweis>
        )}

        <Button className="w-full" disabled={!kannKaufen} onClick={() => onConfirm(fin, true)}>
          Verbindlich kaufen für {euro(eigen)} EK
        </Button>
        <p className="text-center text-xs text-ink-500">
          Nach dem Kauf findest du das Objekt im Portfolio — dort renovieren, flippen oder vermieten.
        </p>
      </div>
    </Modal>
  )
}

function Zeile({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className={bold ? 'font-semibold text-ink-900' : 'text-ink-500'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'font-bold text-ink-900' : 'text-ink-700'}`}>{value}</span>
    </div>
  )
}

function Hinweis({ children, tone }: { children: ReactNode; tone: 'rose' | 'amber' }) {
  const tones = { rose: 'bg-rose-50 text-rose-700', amber: 'bg-amber-50 text-amber-700' }
  return <div className={`rounded-xl p-3 text-xs font-medium ${tones[tone]}`}>{children}</div>
}
