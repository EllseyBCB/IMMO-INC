import { useState } from 'react'
import {
  useGame,
  KARRIERE_START_NETTO,
  KARRIERE_START_FIX,
  KARRIERE_STARTKAPITAL,
  GEHALT_INTERVALL,
  KARRIERE_RAENGE,
  type Spielmodus,
} from '../../state/game'
import { Button, Card, Field, Slider } from '../../components/ui'
import { euro } from '../../lib/format'

interface Preset {
  key: string
  titel: string
  emoji: string
  beschreibung: string
  netto: number
  fixkosten: number
  startkapital: number
}

const PRESETS: Preset[] = [
  {
    key: 'einsteiger',
    titel: 'Berufseinsteiger:in',
    emoji: '🎓',
    beschreibung: 'Wenig Erspartes, aber solides Einkommen und Zeit.',
    netto: 2600,
    fixkosten: 1400,
    startkapital: 35000,
  },
  {
    key: 'angestellt',
    titel: 'Etablierte:r Angestellte:r',
    emoji: '💼',
    beschreibung: 'Gutes Gehalt, ein paar Jahre gespart.',
    netto: 3800,
    fixkosten: 1900,
    startkapital: 90000,
  },
  {
    key: 'gutverdiener',
    titel: 'Gutverdiener:in / Paar',
    emoji: '🚀',
    beschreibung: 'Hohes Haushaltseinkommen, ordentliches Polster.',
    netto: 6500,
    fixkosten: 3000,
    startkapital: 180000,
  },
  {
    key: 'erbe',
    titel: 'Erbschaft erhalten',
    emoji: '🏛️',
    beschreibung: 'Durchschnittseinkommen, aber viel Kapital auf einmal.',
    netto: 3200,
    fixkosten: 1700,
    startkapital: 320000,
  },
]

type Einnahmen = { gehalt: number; partner: number; sonstige: number }
type Ausgaben = {
  wohnen: number
  lebensmittel: number
  versicherung: number
  mobilitaet: number
  abos: number
}

const EINNAHME_FELDER: { key: keyof Einnahmen; label: string }[] = [
  { key: 'gehalt', label: 'Gehalt / Lohn (netto)' },
  { key: 'partner', label: 'Einkommen Partner:in' },
  { key: 'sonstige', label: 'Nebeneinkünfte / Sonstiges' },
]

const AUSGABE_FELDER: { key: keyof Ausgaben; label: string }[] = [
  { key: 'wohnen', label: 'Miete / Wohnen' },
  { key: 'lebensmittel', label: 'Lebensmittel & Haushalt' },
  { key: 'versicherung', label: 'Versicherungen' },
  { key: 'mobilitaet', label: 'Mobilität / Auto' },
  { key: 'abos', label: 'Abos, Freizeit & Sonstiges' },
]

/** Plausible Aufteilung der Fixkosten auf Kategorien (summiert exakt auf `fix`). */
function verteileAusgaben(fix: number): Ausgaben {
  const wohnen = Math.round(fix * 0.45)
  const lebensmittel = Math.round(fix * 0.22)
  const versicherung = Math.round(fix * 0.12)
  const mobilitaet = Math.round(fix * 0.13)
  const abos = fix - wohnen - lebensmittel - versicherung - mobilitaet
  return { wohnen, lebensmittel, versicherung, mobilitaet, abos }
}

const summe = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)

export default function Onboarding() {
  const neuesSpiel = useGame((s) => s.neuesSpiel)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [spielModus, setSpielModus] = useState<Spielmodus>('karriere')
  const [preset, setPreset] = useState<Preset>(PRESETS[1])
  const [modus, setModus] = useState<'schnell' | 'genau'>('schnell')

  const [netto, setNetto] = useState(PRESETS[1].netto)
  const [fixkosten, setFixkosten] = useState(PRESETS[1].fixkosten)
  const [startkapital, setStartkapital] = useState(PRESETS[1].startkapital)

  const [einnahmen, setEinnahmen] = useState<Einnahmen>({
    gehalt: PRESETS[1].netto,
    partner: 0,
    sonstige: 0,
  })
  const [ausgaben, setAusgaben] = useState<Ausgaben>(verteileAusgaben(PRESETS[1].fixkosten))

  function pick(p: Preset) {
    setPreset(p)
    setNetto(p.netto)
    setFixkosten(p.fixkosten)
    setStartkapital(p.startkapital)
    setEinnahmen({ gehalt: p.netto, partner: 0, sonstige: 0 })
    setAusgaben(verteileAusgaben(p.fixkosten))
  }

  const einnahmenSumme = summe(einnahmen)
  const ausgabenSumme = summe(ausgaben)
  const effNetto = modus === 'genau' ? einnahmenSumme : netto
  const effFix = modus === 'genau' ? ausgabenSumme : fixkosten
  const frei = effNetto - effFix

  function startFrei() {
    neuesSpiel(
      { name: name.trim() || 'Investor:in', nettoEinkommen: effNetto, fixkosten: effFix },
      startkapital,
      'frei',
    )
  }

  function startKarriere() {
    neuesSpiel(
      { name: name.trim() || 'Investor:in', nettoEinkommen: KARRIERE_START_NETTO, fixkosten: KARRIERE_START_FIX },
      KARRIERE_STARTKAPITAL,
      'karriere',
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div
        className="relative h-56 w-full bg-cover bg-center sm:h-72"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(15,23,32,0.15), rgba(15,23,32,0.55)), url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=70)',
        }}
      >
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-end px-5 pb-6">
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-700">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-brand-500 text-[10px] text-white">II</span>
            IMMO INC
          </div>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
            Bau dein Immobilien&shy;imperium.
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/85">
            Echte Objekte, echte Zahlen. Kaufen, finanzieren, renovieren, flippen oder vermieten — spiel deine eigene
            Situation durch.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-6">
        {step === 0 && (
          <Card className="p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-ink-900">Wie willst du spielen?</h2>
            <p className="mt-1 text-sm text-ink-500">Wähle deinen Modus — später kannst du jederzeit neu starten.</p>

            <div className="mt-4">
              <Field label="Dein Name (optional)">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. Eli"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setSpielModus('karriere')}
                className={`rounded-2xl border p-4 text-left transition ${
                  spielModus === 'karriere' ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🏆</span>
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">RANGLISTE</span>
                </div>
                <div className="mt-2 text-sm font-bold text-ink-900">Karriere-Modus</div>
                <div className="text-xs text-ink-500">
                  Fairer Start für alle: {euro(KARRIERE_START_NETTO)} netto. Arbeite dich mit Gehaltserhöhungen &amp;
                  Investments hoch und steig in den Rängen auf.
                </div>
              </button>

              <button
                onClick={() => setSpielModus('frei')}
                className={`rounded-2xl border p-4 text-left transition ${
                  spielModus === 'frei' ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🎨</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">KREATIV</span>
                </div>
                <div className="mt-2 text-sm font-bold text-ink-900">Freier Modus</div>
                <div className="text-xs text-ink-500">
                  Leg dein Einkommen, deine Ausgaben und dein Startkapital selbst fest. Kein Ranking — spiel für dich.
                </div>
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <Button onClick={() => setStep(1)}>Weiter →</Button>
            </div>
          </Card>
        )}

        {step === 1 && spielModus === 'karriere' && (
          <Card className="p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-ink-900">🏆 Karriere-Modus</h2>
            <p className="mt-1 text-sm text-ink-500">
              Alle starten gleich — was du daraus machst, zählt. Hier sind deine Startbedingungen:
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <StartKachel label="Netto-Gehalt" wert={`${euro(KARRIERE_START_NETTO)}/M`} />
              <StartKachel label="Lebenshaltung" wert={`− ${euro(KARRIERE_START_FIX)}/M`} />
              <StartKachel label="Startkapital" wert={euro(KARRIERE_STARTKAPITAL)} />
            </div>

            <div className="mt-4 rounded-xl bg-brand-50/60 p-4 text-sm text-ink-700">
              <div className="flex items-start gap-2">
                <span>📈</span>
                <span>
                  <b>Gehaltserhöhungen:</b> Alle {GEHALT_INTERVALL} Spiel-Monate steigt dein Gehalt automatisch. Dazu
                  kommen Miete, Flips, Börse &amp; Sparen — so arbeitest du dich Schritt für Schritt hoch.
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">Die Karriereleiter</div>
              <div className="flex flex-wrap gap-1.5">
                {KARRIERE_RAENGE.map((r) => (
                  <span key={r.name} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-ink-600">
                    {r.emoji} {r.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                ← Zurück
              </Button>
              <Button onClick={startKarriere}>Karriere starten 🏠</Button>
            </div>
          </Card>
        )}

        {step === 1 && spielModus === 'frei' && (
          <Card className="p-6 animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink-900">Deine finanzielle Ausgangslage</h2>
                <p className="mt-1 text-sm text-ink-500">
                  Diese Werte bestimmen deine Bonität bei der Bank und deinen monatlichen Cashflow.
                </p>
              </div>
              {/* Umschalter: schnelle Schätzung ↔ genaues Eintragen */}
              <div className="inline-flex shrink-0 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  onClick={() => setModus('schnell')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    modus === 'schnell' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                  }`}
                >
                  Schnell
                </button>
                <button
                  onClick={() => setModus('genau')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    modus === 'genau' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                  }`}
                >
                  Genau eintragen
                </button>
              </div>
            </div>

            {/* Schnellvorlagen als Startpunkt */}
            <div className="mt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">Vorlage (optional)</div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => pick(p)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      preset.key === p.key ? 'border-brand-400 bg-brand-50/60 text-ink-900' : 'border-slate-200 bg-white text-ink-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{p.emoji}</span> {p.titel} · {euro(p.startkapital)}
                  </button>
                ))}
              </div>
            </div>

            {modus === 'schnell' ? (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">Netto-Haushaltseinkommen / Monat</span>
                    <span className="font-bold tabular-nums text-ink-900">{euro(netto)}</span>
                  </div>
                  <Slider value={netto} min={1500} max={12000} step={100} onChange={setNetto} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">Fixkosten Lebenshaltung / Monat</span>
                    <span className="font-bold tabular-nums text-ink-900">{euro(fixkosten)}</span>
                  </div>
                  <Slider value={fixkosten} min={600} max={8000} step={100} onChange={setFixkosten} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">Startkapital (Eigenkapital)</span>
                    <span className="font-bold tabular-nums text-ink-900">{euro(startkapital)}</span>
                  </div>
                  <Slider value={startkapital} min={10000} max={500000} step={5000} onChange={setStartkapital} />
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <p className="text-xs text-ink-500">
                  Trag genau ein, was du im Monat verdienst und ausgibst — auf den Euro. Die Summen unten fließen direkt
                  ins Spiel ein.
                </p>

                {/* Einnahmen */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-ink-900">💶 Was du verdienst</span>
                    <span className="text-sm font-black tabular-nums text-emerald-600">{euro(einnahmenSumme)}</span>
                  </div>
                  <div className="space-y-2.5">
                    {EINNAHME_FELDER.map((f) => (
                      <PostenZeile
                        key={f.key}
                        label={f.label}
                        value={einnahmen[f.key]}
                        onChange={(v) => setEinnahmen((s) => ({ ...s, [f.key]: v }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Ausgaben */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-ink-900">🧾 Was du ausgibst</span>
                    <span className="text-sm font-black tabular-nums text-rose-600">{euro(ausgabenSumme)}</span>
                  </div>
                  <div className="space-y-2.5">
                    {AUSGABE_FELDER.map((f) => (
                      <PostenZeile
                        key={f.key}
                        label={f.label}
                        value={ausgaben[f.key]}
                        onChange={(v) => setAusgaben((s) => ({ ...s, [f.key]: v }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Startkapital */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-ink-900">🏦 Startkapital (Eigenkapital)</span>
                  </div>
                  <PostenZeile
                    label="Verfügbares Erspartes"
                    value={startkapital}
                    onChange={setStartkapital}
                  />
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Einkommen / Monat</span>
                <span className="font-semibold tabular-nums text-ink-800">{euro(effNetto)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-500">Ausgaben / Monat</span>
                <span className="font-semibold tabular-nums text-ink-800">− {euro(effFix)}</span>
              </div>
              <div className="my-2 border-t border-slate-200" />
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-700">Frei verfügbar / Monat</span>
                <span className={`font-black tabular-nums ${frei < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {euro(frei)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                ← Zurück
              </Button>
              <Button onClick={startFrei} disabled={effNetto <= 0}>
                Los geht's 🏠
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function StartKachel({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-0.5 text-sm font-black tabular-nums text-ink-900">{wert}</div>
    </div>
  )
}

function PostenZeile({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 flex-1 text-sm text-ink-700">{label}</span>
      <div className="relative w-32 shrink-0">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
          placeholder="0"
          className="w-full rounded-xl border border-slate-200 py-2 pl-3 pr-7 text-right text-sm tabular-nums outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">€</span>
      </div>
    </div>
  )
}
