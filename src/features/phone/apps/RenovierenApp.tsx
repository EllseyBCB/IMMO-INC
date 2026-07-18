import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../../../state/game'
import { euro } from '../../../lib/format'
import { RENOVATION_KATALOG, QUALITAET_FAKTOR, BAUTEMPO, berechneRenovierung } from '../../../data/renovation'
import { getBautraeger, bautraegerAlsAngebot, preisLevel, verhandleBau, type Bauangebot } from '../../../data/bauangebote'
import type { RenovationScope, Qualitaet, Bautempo } from '../../../data/types'
import type { PhoneNav } from '../nav'

const QUALITAETEN: Qualitaet[] = ['standard', 'gehoben', 'luxus']
const TEMPI: Bautempo[] = ['spar', 'standard', 'express', 'turbo']

function Sterne({ n }: { n: number }) {
  const voll = Math.round(n)
  return (
    <span className="text-amber-500">
      {'★'.repeat(voll)}
      {'☆'.repeat(Math.max(0, 5 - voll))}
    </span>
  )
}

export default function RenovierenApp({
  onClose,
  nav,
  bautraegerId,
}: {
  onClose: () => void
  nav: PhoneNav
  bautraegerId?: string
}) {
  const owned = useGame((s) => s.owned)
  const cash = useGame((s) => s.cash)
  const renovierenAushandeln = useGame((s) => s.renovierenAushandeln)

  const bt = bautraegerId ? getBautraeger(bautraegerId) : undefined

  // Objekte ohne laufende Renovierung
  const verfuegbar = useMemo(
    () => owned.filter((o) => !o.renovierung || o.renovierung.status !== 'in_arbeit'),
    [owned],
  )

  const [uid, setUid] = useState<string | null>(verfuegbar[0]?.uid ?? null)
  const [scopes, setScopes] = useState<RenovationScope[]>([])
  const [qualitaet, setQualitaet] = useState<Qualitaet>('gehoben')
  const [tempo, setTempo] = useState<Bautempo>('standard')
  const [angebot, setAngebot] = useState<Bauangebot | null>(null)
  const [gebot, setGebot] = useState(0)
  const [bauNachricht, setBauNachricht] = useState<string | null>(null)

  const objekt = verfuegbar.find((o) => o.uid === uid) ?? null

  // Basiskalkulation der aktuellen Auswahl
  const base = useMemo(() => {
    if (!objekt || scopes.length === 0) return null
    return berechneRenovierung(
      scopes,
      qualitaet,
      tempo,
      objekt.property.wohnflaeche,
      objekt.property.marktwert,
      objekt.property.sanierungspotenzial,
    )
  }, [objekt, scopes, qualitaet, tempo])

  // Verhandelbares Angebot des gewählten Bauträgers — bei jeder Änderung neu.
  useEffect(() => {
    if (!bt || !base) {
      setAngebot(null)
      setBauNachricht(null)
      return
    }
    const a = bautraegerAlsAngebot(bt, base.kosten, base.bauzeit)
    setAngebot(a)
    setGebot(a.preis)
    setBauNachricht(null)
  }, [bt, base])

  if (!bt) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="text-5xl">🔎</div>
        <div className="mt-3 text-base font-bold text-ink-900">Kein Bauträger gewählt</div>
        <p className="mt-1 text-sm text-ink-500">Such dir online bei Giggle einen passenden Bauträger aus.</p>
        <button
          onClick={() => nav.giggle('günstigen Bauträger finden')}
          className="mt-5 w-full max-w-[280px] rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white"
        >
          🔎 Bauträger bei Giggle suchen
        </button>
      </div>
    )
  }

  const wertsteigerung = base ? Math.round(base.wertsteigerung * bt.qualiFaktor) : 0
  const preis = angebot?.angebot ?? 0
  const bauzeit = angebot?.bauzeit ?? 0
  const mietVorher = objekt ? objekt.marktMiete || objekt.property.kaltmieteMarkt : 0
  const mietNachher = base ? Math.round(mietVorher * (1 + base.mietHebel)) : mietVorher
  const bezahlbar = preis <= cash
  const kannBeauftragen = !!objekt && scopes.length > 0 && !!angebot && bezahlbar && angebot.status !== 'abgelehnt'

  function toggleScope(s: RenovationScope) {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  function bieten() {
    if (!angebot) return
    const r = verhandleBau(angebot, Math.round(gebot))
    setAngebot(r.angebot)
    setBauNachricht(r.bauNachricht)
    setGebot(r.angebot.angebot)
  }

  function beauftragen() {
    if (!objekt || !angebot || !kannBeauftragen) return
    renovierenAushandeln(
      objekt.uid,
      scopes,
      qualitaet,
      tempo,
      angebot.angebot,
      angebot.bauzeit,
      bt!.name,
      bt!.rating,
      bt!.risiko,
      bt!.qualiFaktor,
    )
    nav.open('bautraeger')
  }

  const risikoHoch = bt.risiko >= 0.25
  const risikoMittel = bt.risiko >= 0.12 && bt.risiko < 0.25

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Kopf: gewählter Bauträger */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-3 py-3 pt-3 text-white">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-lg" aria-label="Zurück">
            ‹
          </button>
          <span className="text-sm font-bold">Renovierung beauftragen</span>
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white/15 p-2.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20 text-2xl">{bt.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{bt.name}</div>
            <div className="flex items-center gap-2 text-[11px] text-white/90">
              <Sterne n={bt.rating} />
              <span className="tabular-nums">{bt.rating.toFixed(1)}</span>
              <span className="text-white/70">({bt.bewertungen} Bew.)</span>
            </div>
            <div className="text-[11px] text-white/80">{bt.spezialitaet} · {preisLevel(bt.preisFaktor)}</div>
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
        {/* Risiko-Hinweis */}
        {(risikoHoch || risikoMittel) && (
          <div
            className={`rounded-xl p-2.5 text-xs ${
              risikoHoch ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
            }`}
          >
            {risikoHoch ? '⚠️ Hohes Risiko: ' : '⚠️ Erhöhtes Risiko: '}
            Günstige Bauträger pfuschen häufiger — es kann zu Mängeln & Wasserschäden nach der Renovierung kommen.
          </div>
        )}

        {verfuegbar.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center shadow-soft ring-1 ring-black/5">
            <div className="text-3xl">🏠</div>
            <div className="mt-2 text-sm font-bold text-ink-900">Keine Immobilie zum Renovieren</div>
            <p className="mt-1 text-xs text-ink-500">Kauf zuerst ein Objekt (oder warte, bis eine laufende Renovierung fertig ist).</p>
          </div>
        ) : (
          <>
            {/* Objekt wählen */}
            <div className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Objekt</div>
              <div className="mt-2 space-y-1.5">
                {verfuegbar.map((o) => (
                  <button
                    key={o.uid}
                    onClick={() => setUid(o.uid)}
                    className={`flex w-full items-center gap-2 rounded-xl border p-1.5 text-left transition ${
                      uid === o.uid ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <img src={o.property.bilder[0]} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900">{o.property.titel}</div>
                      <div className="text-[11px] text-ink-500">
                        {o.property.stadt} · {Math.round(o.property.wohnflaeche)} m²
                      </div>
                    </div>
                    {uid === o.uid && <span className="text-orange-500">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Gewerke */}
            <div className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Gewerke</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {RENOVATION_KATALOG.map((item) => {
                  const an = scopes.includes(item.scope)
                  return (
                    <button
                      key={item.scope}
                      onClick={() => toggleScope(item.scope)}
                      className={`rounded-xl border p-2 text-left text-xs transition ${
                        an ? 'border-orange-400 bg-orange-50 text-ink-900' : 'border-slate-200 bg-white text-ink-600'
                      }`}
                    >
                      <div className="font-semibold">
                        {item.emoji} {item.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Qualität & Tempo */}
            <div className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Qualität</div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {QUALITAETEN.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQualitaet(q)}
                    className={`rounded-xl border py-1.5 text-xs font-semibold transition ${
                      qualitaet === q ? 'border-orange-400 bg-orange-50 text-ink-900' : 'border-slate-200 text-ink-600'
                    }`}
                  >
                    {QUALITAET_FAKTOR[q].label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-500">Tempo</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {TEMPI.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTempo(t)}
                    className={`rounded-xl border py-1.5 text-xs font-semibold transition ${
                      tempo === t ? 'border-orange-400 bg-orange-50 text-ink-900' : 'border-slate-200 text-ink-600'
                    }`}
                  >
                    {BAUTEMPO[t].emoji} {BAUTEMPO[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kalkulation + Verhandlung */}
            {base && angebot ? (
              <div className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5">
                <div className="grid grid-cols-2 gap-2">
                  <Kachel label="Preis (Angebot)" wert={euro(preis)} />
                  <Kachel label="Bauzeit" wert={`${bauzeit} Mon.`} />
                  <Kachel label="Wertsteigerung" wert={`+${euro(wertsteigerung)}`} gut />
                  <Kachel label="Miete möglich" wert={`${euro(mietNachher)}/M`} gut />
                </div>

                {/* Verhandlung */}
                {angebot.status === 'abgelehnt' ? (
                  <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 ring-1 ring-rose-200">
                    {bt.name} ist aus der Verhandlung ausgestiegen. Ändere die Auswahl für ein neues Angebot.
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl bg-slate-50 p-2.5">
                    <div className="flex items-center justify-between text-xs text-ink-600">
                      <span>Dein Gebot</span>
                      <span className="font-bold tabular-nums text-ink-900">{euro(Math.round(gebot))}</span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(angebot.preis * 0.6)}
                      max={angebot.preis}
                      step={100}
                      value={Math.min(gebot, angebot.preis)}
                      onChange={(e) => setGebot(Number(e.target.value))}
                      className="mt-1.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-orange-500"
                    />
                    <button
                      onClick={bieten}
                      className="mt-2 w-full rounded-lg bg-white py-1.5 text-xs font-bold text-orange-600 ring-1 ring-orange-200 transition hover:bg-orange-50"
                    >
                      💬 Preis verhandeln
                    </button>
                    {bauNachricht && <p className="mt-2 text-[11px] italic text-ink-600">„{bauNachricht}"</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-4 text-center text-xs text-ink-400 shadow-soft ring-1 ring-black/5">
                Wähle mindestens ein Gewerk, um ein Angebot zu erhalten.
              </div>
            )}
          </>
        )}
      </div>

      {/* Beauftragen */}
      {verfuegbar.length > 0 && (
        <div className="border-t border-slate-100 bg-white p-3">
          {!bezahlbar && base && (
            <div className="mb-2 text-center text-[11px] text-rose-600">Nicht genug Liquidität ({euro(cash)} verfügbar).</div>
          )}
          <button
            onClick={beauftragen}
            disabled={!kannBeauftragen}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-40"
          >
            🔨 {bt.name} beauftragen{preis > 0 ? ` · ${euro(preis)}` : ''}
          </button>
        </div>
      )}
    </div>
  )
}

function Kachel({ label, wert, gut }: { label: string; wert: string; gut?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${gut ? 'text-emerald-600' : 'text-ink-900'}`}>{wert}</div>
    </div>
  )
}
