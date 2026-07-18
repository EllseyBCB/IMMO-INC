import { useState } from 'react'
import { useGame } from '../../state/game'
import {
  ASSETS,
  ORDERGEBUEHR,
  aktuelleNews,
  assetEventBadge,
  assetPreis,
  assetVeraenderung,
  depotEinstand,
  depotWert,
  getAsset,
  preisHistorie,
  type Asset,
  type AssetKlasse,
} from '../../data/assets'
import { euro } from '../../lib/format'

const KLASSEN: AssetKlasse[] = ['ETF', 'Aktie', 'Krypto']

function kurs(v: number): string {
  if (v >= 1000) return v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'
  if (v >= 1) return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  return v.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + ' €'
}

export default function BoerseApp({ onClose }: { onClose: () => void }) {
  const { cash, depot, monthIndex } = useGame()
  const [detail, setDetail] = useState<string | null>(null)
  const [filter, setFilter] = useState<AssetKlasse | 'alle'>('alle')

  const dWert = depotWert(depot, monthIndex)
  const dEinstand = depotEinstand(depot)
  const gv = dWert - dEinstand

  if (detail) {
    const a = getAsset(detail)
    if (a) return <AssetDetail asset={a} onBack={() => setDetail(null)} />
  }

  const liste = ASSETS.filter((a) => filter === 'alle' || a.klasse === filter)

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 pt-3 text-white">
        <button onClick={onClose} className="rounded-lg px-1.5 py-0.5 text-lg" aria-label="Schließen">
          ✕
        </button>
        <span className="text-sm font-bold">Börse · Depot</span>
        <span className="ml-auto text-[11px] text-white/80">Frei {euro(cash)}</span>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {/* Depot-Wert */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 px-4 pb-4 pt-1 text-white">
          <div className="text-[11px] uppercase tracking-wide text-white/70">Depotwert</div>
          <div className="mt-0.5 text-3xl font-black tabular-nums">{euro(dWert)}</div>
          {depot.length > 0 && (
            <div className={`mt-1 text-xs font-semibold ${gv >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
              {gv >= 0 ? '▲' : '▼'} {euro(Math.abs(gv))} {gv >= 0 ? 'Gewinn' : 'Verlust'} · investiert {euro(dEinstand)}
            </div>
          )}
        </div>

        {/* Markt-News */}
        <NewsFeed t={monthIndex} />

        {/* Eigene Positionen */}
        {depot.length > 0 && (
          <div className="px-3 pt-3">
            <div className="mb-1 px-1 text-xs font-bold uppercase tracking-wide text-ink-500">Meine Positionen</div>
            <div className="space-y-2">
              {depot.map((p) => {
                const a = getAsset(p.assetId)
                if (!a) return null
                const wert = p.menge * assetPreis(a, monthIndex)
                const pl = wert - p.investiert
                return (
                  <button
                    key={p.assetId}
                    onClick={() => setDetail(p.assetId)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft ring-1 ring-black/5 transition hover:bg-slate-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">{a.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink-900">{a.name}</span>
                      <span className="block text-[10px] text-ink-400">{p.menge.toLocaleString('de-DE', { maximumFractionDigits: 4 })} × {kurs(assetPreis(a, monthIndex))}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-black tabular-nums text-ink-900">{euro(wert)}</span>
                      <span className={`block text-[10px] font-bold ${pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {pl >= 0 ? '+' : ''}{euro(pl)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Markt-Filter */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-3">
          <FilterChip label="Alle" aktiv={filter === 'alle'} onClick={() => setFilter('alle')} />
          {KLASSEN.map((k) => (
            <FilterChip key={k} label={k} aktiv={filter === k} onClick={() => setFilter(k)} />
          ))}
        </div>

        {/* Markt */}
        <div className="space-y-2 px-3 pb-4">
          {liste.map((a) => (
            <MarktZeile key={a.id} asset={a} t={monthIndex} onClick={() => setDetail(a.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function NewsFeed({ t }: { t: number }) {
  const news = aktuelleNews(t, 5)
  if (news.length === 0) return null
  return (
    <div className="px-3 pt-3">
      <div className="mb-1 flex items-center gap-1 px-1 text-xs font-bold uppercase tracking-wide text-ink-500">
        📰 Markt-News
      </div>
      <div className="space-y-1.5">
        {news.map((n, i) => {
          const a = getAsset(n.assetId)
          return (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-soft ring-1 ring-black/5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm">{a?.emoji ?? '📈'}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-800">
                {n.text}
                {n.aktiv && <span className="ml-1 text-[9px] font-bold text-amber-600">● live</span>}
              </span>
              <span className={`shrink-0 text-xs font-black tabular-nums ${n.positiv ? 'text-emerald-600' : 'text-rose-600'}`}>
                {n.positiv ? '+' : '−'}{n.prozent.toFixed(1)} %
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MarktZeile({ asset, t, onClick }: { asset: Asset; t: number; onClick: () => void }) {
  const preis = assetPreis(asset, t)
  const chg = assetVeraenderung(asset, t)
  const hist = preisHistorie(asset, t)
  const badge = assetEventBadge(asset, t)
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft ring-1 ring-black/5 transition hover:bg-slate-50"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">{asset.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-ink-900">{asset.name}</span>
          {badge && <span className="shrink-0 text-xs">{badge === 'pos' ? '🔥' : '⚠️'}</span>}
          <span className="shrink-0 rounded bg-slate-100 px-1 text-[9px] font-bold text-ink-400">{asset.klasse}</span>
        </span>
        <span className="block text-[10px] text-ink-400">{asset.kuerzel}{asset.dividende > 0 ? ` · ${(asset.dividende * 100).toFixed(1)}% Div.` : ''}</span>
      </span>
      <Sparkline werte={hist} positiv={chg >= 0} />
      <span className="w-20 shrink-0 text-right">
        <span className="block text-sm font-black tabular-nums text-ink-900">{kurs(preis)}</span>
        <span className={`block text-[10px] font-bold ${chg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {chg >= 0 ? '+' : ''}{chg.toFixed(2)} %
        </span>
      </span>
    </button>
  )
}

function Sparkline({ werte, positiv }: { werte: number[]; positiv: boolean }) {
  const min = Math.min(...werte)
  const max = Math.max(...werte)
  const spanne = max - min || 1
  const w = 44
  const h = 24
  const punkte = werte
    .map((v, i) => `${(i / (werte.length - 1)) * w},${h - ((v - min) / spanne) * h}`)
    .join(' ')
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden>
      <polyline
        points={punkte}
        fill="none"
        stroke={positiv ? '#059669' : '#e11d48'}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FilterChip({ label, aktiv, onClick }: { label: string; aktiv: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        aktiv ? 'bg-indigo-600 text-white' : 'bg-white text-ink-600 ring-1 ring-black/5 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
}

function AssetDetail({ asset, onBack }: { asset: Asset; onBack: () => void }) {
  const { cash, depot, monthIndex, assetKaufen, assetVerkaufen } = useGame()
  const [modus, setModus] = useState<'kaufen' | 'verkaufen'>('kaufen')
  const [betrag, setBetrag] = useState('')

  const preis = assetPreis(asset, monthIndex)
  const chg = assetVeraenderung(asset, monthIndex)
  const hist = preisHistorie(asset, monthIndex, 48, 0.4)
  const pos = depot.find((p) => p.assetId === asset.id)
  const bestand = pos?.menge ?? 0

  // Eingabe = Euro-Betrag, den man investieren/lösen will
  const euroBetrag = Math.max(0, Number(betrag.replace(',', '.')) || 0)
  const mengeKauf = euroBetrag > 0 ? euroBetrag / (preis * (1 + ORDERGEBUEHR)) : 0
  const mengeVerkauf = euroBetrag > 0 ? Math.min(bestand, euroBetrag / (preis * (1 - ORDERGEBUEHR))) : 0

  const kaufbar = modus === 'kaufen' && euroBetrag > 0 && euroBetrag <= cash
  const verkaufbar = modus === 'verkaufen' && mengeVerkauf > 0

  const w = 100
  const h = 44
  const min = Math.min(...hist)
  const max = Math.max(...hist)
  const spanne = max - min || 1
  const linie = hist.map((v, i) => `${(i / (hist.length - 1)) * w},${h - ((v - min) / spanne) * h}`).join(' ')

  function los() {
    if (modus === 'kaufen' && kaufbar) assetKaufen(asset.id, mengeKauf)
    else if (modus === 'verkaufen' && verkaufbar) assetVerkaufen(asset.id, mengeVerkauf)
    setBetrag('')
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 pt-3 text-white">
        <button onClick={onBack} className="rounded-lg px-1.5 py-0.5 text-lg" aria-label="Zurück">
          ‹
        </button>
        <span className="text-lg">{asset.emoji}</span>
        <span className="text-sm font-bold">{asset.name}</span>
        <span className="ml-auto text-[11px] text-white/80">{asset.kuerzel}</span>
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
        {/* Kurs + Chart */}
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-black tabular-nums text-ink-900">{kurs(preis)}</div>
              <div className={`text-sm font-bold ${chg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {chg >= 0 ? '▲' : '▼'} {chg.toFixed(2)} % · letzter Tag
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">{asset.klasse}</span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-24 w-full" preserveAspectRatio="none" aria-hidden>
            <polyline points={linie} fill="none" stroke={chg >= 0 ? '#059669' : '#e11d48'} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <p className="mt-2 text-[11px] leading-snug text-ink-500">{asset.beschreibung}</p>
          {asset.dividende > 0 && (
            <p className="mt-1 text-[11px] font-semibold text-emerald-600">Zahlt {(asset.dividende * 100).toFixed(1)} % Dividende pro Jahr (monatlich).</p>
          )}
        </div>

        {/* Bestand */}
        {bestand > 0 && pos && (
          <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
            <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Dein Bestand</div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-ink-600">{bestand.toLocaleString('de-DE', { maximumFractionDigits: 4 })} Anteile</span>
              <span className="font-bold tabular-nums text-ink-900">{euro(bestand * preis)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-ink-600">Gewinn / Verlust</span>
              <SaldoText v={bestand * preis - pos.investiert} />
            </div>
          </div>
        )}

        {/* Handeln */}
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
          <div className="mb-3 inline-flex w-full rounded-xl bg-slate-100 p-1 text-sm font-bold">
            <button onClick={() => setModus('kaufen')} className={`flex-1 rounded-lg py-1.5 transition ${modus === 'kaufen' ? 'bg-white text-emerald-600 shadow-soft' : 'text-ink-500'}`}>
              Kaufen
            </button>
            <button onClick={() => setModus('verkaufen')} disabled={bestand <= 0} className={`flex-1 rounded-lg py-1.5 transition ${modus === 'verkaufen' ? 'bg-white text-rose-600 shadow-soft' : 'text-ink-500'} disabled:opacity-40`}>
              Verkaufen
            </button>
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={betrag}
              onChange={(e) => setBetrag(e.target.value)}
              placeholder="Betrag in Euro"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-8 text-right text-sm tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">€</span>
          </div>

          {/* Schnellwahl */}
          <div className="mt-2 flex gap-2">
            {(modus === 'kaufen' ? [250, 1000, 5000] : []).map((v) => (
              <button key={v} onClick={() => setBetrag(String(Math.min(v, Math.floor(cash))))} className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-ink-600 hover:bg-slate-200">
                {euro(v)}
              </button>
            ))}
            {modus === 'kaufen' && (
              <button onClick={() => setBetrag(String(Math.floor(cash)))} className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-ink-600 hover:bg-slate-200">
                Max
              </button>
            )}
            {modus === 'verkaufen' && (
              <>
                <button onClick={() => setBetrag(String(Math.round(bestand * preis * 0.5)))} className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-ink-600 hover:bg-slate-200">
                  Hälfte
                </button>
                <button onClick={() => setBetrag(String(Math.ceil(bestand * preis)))} className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-ink-600 hover:bg-slate-200">
                  Alles
                </button>
              </>
            )}
          </div>

          <div className="mt-2 text-[11px] text-ink-500">
            {modus === 'kaufen'
              ? `≈ ${mengeKauf.toLocaleString('de-DE', { maximumFractionDigits: 4 })} Anteile · inkl. ${(ORDERGEBUEHR * 100).toFixed(1)} % Gebühr`
              : `≈ ${mengeVerkauf.toLocaleString('de-DE', { maximumFractionDigits: 4 })} Anteile · inkl. ${(ORDERGEBUEHR * 100).toFixed(1)} % Gebühr`}
          </div>

          <button
            onClick={los}
            disabled={modus === 'kaufen' ? !kaufbar : !verkaufbar}
            className={`mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-ink-400 ${
              modus === 'kaufen' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {modus === 'kaufen' ? `Für ${euro(euroBetrag)} kaufen` : `Für ${euro(euroBetrag)} verkaufen`}
          </button>
          {modus === 'kaufen' && euroBetrag > cash && (
            <div className="mt-1 text-center text-[11px] text-rose-600">Nicht genug Liquidität ({euro(cash)} frei).</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SaldoText({ v }: { v: number }) {
  return (
    <span className={`text-sm font-bold tabular-nums ${v >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
      {v >= 0 ? '+' : ''}
      {euro(v)}
    </span>
  )
}
