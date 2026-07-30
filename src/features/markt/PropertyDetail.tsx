import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Property } from '../../data/types'
import { ladeMarkt } from '../../data/openimmo'
import { useCustomListings } from '../../state/customListings'
import { berechneFinanzierung, monatlicheRaten, useGame } from '../../state/game'
import { bonitaet, finanzierungsAngebot, kaufnebenkosten } from '../../lib/finanzen'
import { Badge, Button, Card, Modal, Slider, Stat } from '../../components/ui'
import { euro, area, pct } from '../../lib/format'
import { mietrendite, zustandLabel, zustandTone } from './propertyUtil'
import type { PhoneNav } from '../phone/nav'

export default function PropertyDetail({ objektId, nav }: { objektId: string; nav: PhoneNav }) {
  const id = objektId
  const { cash, owned, lebenssituation, kaufen, verkauft, recherche } = useGame()
  const [alle, setAlle] = useState<Property[] | null>(null)
  const [bild, setBild] = useState(0)
  const [kaufOffen, setKaufOffen] = useState(false)

  useEffect(() => {
    ladeMarkt().then(setAlle)
  }, [])

  const custom = useCustomListings((s) => s.objekte)
  const p = useMemo(
    () => custom.find((x) => x.id === id) ?? alle?.find((x) => x.id === id),
    [alle, custom, id],
  )
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
        <button onClick={() => nav.open('immobilien')} className="mt-3 inline-block text-brand-600">
          ← Zurück zum Markt
        </button>
      </div>
    )
  }

  const nk = kaufnebenkosten(p.kaufpreis, p.bundesland, true)
  const rendite = mietrendite(p.kaltmieteMarkt, p.kaufpreis)
  const analysiert = recherche.includes('analyse:' + p.id)
  const diff = (p.marktwert - p.kaufpreis) / p.kaufpreis
  const einschaetzung = diff > 0.05 ? 'Unter Marktwert — guter Deal 👍' : diff < -0.05 ? 'Über Marktwert — Vorsicht ⚠️' : 'Fair bepreist'

  return (
    <div>
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

            <div className="mt-4 break-words text-3xl font-black tabular-nums text-ink-900">{euro(p.kaufpreis)}</div>
            <p className="text-xs text-ink-500">
              + Kaufnebenkosten ~{euro(nk.gesamt)} ({pct(nk.quote * 100)})
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <Stat label="Wohnfläche" value={area(p.wohnflaeche)} />
              <Stat label="Zimmer" value={p.zimmer.toLocaleString('de-DE')} />
              <Stat label="Baujahr" value={String(p.baujahr)} />
              <Stat label="Miete (Markt)" value={`${euro(p.kaltmieteMarkt)}/M`} />
              {p.grundstueck ? <Stat label="Grundstück" value={area(p.grundstueck)} /> : null}
            </div>

            {/* Deal-Analyse — erst nach Recherche im Internet sichtbar */}
            {analysiert ? (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Deal-Analyse</div>
                <div className="mt-0.5 text-sm font-bold text-emerald-800">{einschaetzung}</div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Stat label="Brutto-Rendite" value={pct(rendite)} tone="up" />
                  <Stat label="Marktwert" value={euro(p.marktwert)} />
                </div>
              </div>
            ) : (
              <button
                onClick={() => nav.giggle('ImmoScout ' + p.titel)}
                className="mt-4 w-full rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/60 p-3 text-center transition hover:bg-brand-50"
              >
                <div className="text-sm font-bold text-brand-700">🔍 Deal noch nicht recherchiert</div>
                <div className="mt-0.5 text-xs text-ink-500">
                  Rendite & Marktwert erst bei Giggle recherchieren (ImmoScout24)
                </div>
              </button>
            )}

            <div className="mt-5">
              {schonGekauft ? (
                <Button variant="outline" className="w-full" onClick={() => nav.open('portfolio')}>
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
          nettoEinkommen={lebenssituation.nettoEinkommen}
          onClose={() => setKaufOffen(false)}
          onConfirm={(fin, mitMakler) => {
            kaufen(p, fin, mitMakler)
            setKaufOffen(false)
            nav.open('portfolio')
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
  nettoEinkommen,
  onClose,
  onConfirm,
}: {
  p: Property
  cash: number
  bonScore: ReturnType<typeof bonitaet>
  nettoEinkommen: number
  onClose: () => void
  onConfirm: (fin: ReturnType<typeof berechneFinanzierung>, mitMakler: boolean) => void
}) {
  const nk = kaufnebenkosten(p.kaufpreis, p.bundesland, true)
  const gesamtkosten = p.kaufpreis + nk.gesamt
  const minEigen = Math.min(cash, Math.round(nk.gesamt)) // mind. Nebenkosten aus EK
  const [eigen, setEigen] = useState(Math.min(cash, Math.round(nk.gesamt + p.kaufpreis * 0.1)))
  const [laufzeit, setLaufzeit] = useState(25)
  const [zinsAufschlag, setZinsAufschlag] = useState(0)

  const angebot = finanzierungsAngebot({
    bon: bonScore,
    nettoEinkommen,
    kaufpreis: p.kaufpreis,
    nebenkosten: nk.gesamt,
    eigenkapitalEinsatz: eigen,
    zinsAufschlag,
    laufzeitJahre: laufzeit,
  })

  const fin = berechneFinanzierung(p.kaufpreis, p.bundesland, true, eigen, angebot.angebotenerZins, laufzeit)

  const zuWenigCash = eigen > cash
  const barkauf = angebot.darlehen <= 0
  const kannKaufen = angebot.genehmigt && !zuWenigCash && eigen >= minEigen

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
          {cash >= gesamtkosten && !barkauf && (
            <button
              onClick={() => setEigen(gesamtkosten)}
              className="mt-2 w-full rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              💶 Komplett bezahlen (Barkauf, kein Kredit)
            </button>
          )}
        </div>

        {barkauf ? (
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-800">✓ Barkauf — kein Kredit</span>
              <span className="text-xs font-semibold text-emerald-700">0 € Rate</span>
            </div>
            <p className="mt-1 text-xs text-emerald-700/80">
              Du bezahlst das Objekt komplett aus Eigenkapital. Keine Bank, kein Zins, keine Monatsrate — dafür ist dein
              Kapital gebunden.
            </p>
          </div>
        ) : (
          <>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-ink-700">Laufzeit</span>
            <span className="font-bold tabular-nums text-ink-900">{laufzeit} Jahre</span>
          </div>
          <Slider value={laufzeit} min={10} max={35} step={1} onChange={setLaufzeit} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-700">Zins-Angebot an die Bank</span>
            <span className="font-bold tabular-nums text-ink-900">
              {pct(angebot.angebotenerZins * 100, 2)}
              {zinsAufschlag > 0 && (
                <span className="ml-1 text-xs font-semibold text-emerald-600">
                  (fair {pct(angebot.fairZins * 100, 2)} + {pct(zinsAufschlag * 100, 2)})
                </span>
              )}
            </span>
          </div>
          <Slider
            value={zinsAufschlag}
            min={0}
            max={angebot.maxZinsAufschlag}
            step={0.0025}
            onChange={setZinsAufschlag}
          />
          <div className="mt-1 text-xs text-ink-500">
            Mehr Zins bieten → die Bank finanziert eher. Mehr Eigenkapital → niedrigerer fairer Zins.
          </div>
        </div>

        {/* Finanzierungschance */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">Finanzierungschance</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                angebot.genehmigt ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {angebot.genehmigt ? '✓ Genehmigt' : 'Noch nicht genehmigt'}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                angebot.genehmigt ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.round(angebot.chance * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-brand-50/60 p-4">
          <Stat label="Zinssatz" value={pct(angebot.angebotenerZins * 100, 2)} />
          <Stat label="Monatsrate" value={`${euro(fin.monatsrate)}`} tone="down" />
          <Stat label="Darlehen" value={euro(angebot.darlehen)} />
          <Stat label="Kreditrahmen" value={euro(angebot.rahmen)} />
        </div>
          </>
        )}

        {zuWenigCash && <Hinweis tone="rose">Dein Eigenkapital-Einsatz übersteigt deine Liquidität.</Hinweis>}
        {!angebot.genehmigt && !zuWenigCash && (
          <Hinweis tone="amber">
            Die Bank finanziert das noch nicht. <strong>Erhöhe den Zins</strong> (du machst dich als Kreditnehmer
            attraktiver) oder <strong>bring mehr Eigenkapital</strong> mit — beides hebt deine Finanzierungschance.
          </Hinweis>
        )}
        {angebot.genehmigt && eigen < minEigen && (
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
