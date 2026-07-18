import { useMemo, useState } from 'react'
import { gesamtVermoegen, sparGuthaben, useGame } from '../../state/game'
import { euro, euroShort, gameDatum, gameTag } from '../../lib/format'
import { APPS, DOCK, appMeta, type AppId, type AppMeta, type PhoneNav } from './nav'

import PropertyDetail from '../markt/PropertyDetail'
import Portfolio from '../portfolio/Portfolio'
import Bank from '../bank/Bank'
import Finanzen from '../finanzen/Finanzen'
import BankingApp from '../handy/BankingApp'
import BoerseApp from '../handy/BoerseApp'
import ShopApp from '../handy/ShopApp'
import BautraegerApp from '../handy/BautraegerApp'
import ImmoProudApp from './apps/ImmoProudApp'
import NachrichtenApp from '../handy/Handy'
import GiggleApp from './apps/GiggleApp'
import ChatOmgApp from './apps/ChatOmgApp'
import EinstellungenApp from './apps/EinstellungenApp'
import DaytradingApp from './apps/DaytradingApp'
import SlotApp from './apps/SlotApp'

interface Screen {
  app: AppId
  props?: Record<string, unknown>
}

export default function PhoneOS() {
  const [stack, setStack] = useState<Screen[]>([])
  const [gesperrt, setGesperrt] = useState(true)

  const nav: PhoneNav = useMemo(
    () => ({
      open: (app, props) => setStack((s) => [...s, { app, props }]),
      openObjekt: (id) => setStack((s) => [...s, { app: 'objekt', props: { objektId: id } }]),
      giggle: (query) => setStack((s) => [...s, { app: 'giggle', props: { initial: query } }]),
      back: () => setStack((s) => s.slice(0, -1)),
      home: () => setStack([]),
    }),
    [],
  )

  const current = stack[stack.length - 1] ?? null

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black sm:p-4">
      <div className="relative flex h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden bg-black sm:h-[min(920px,100dvh)] sm:rounded-[2.75rem] sm:border-[11px] sm:border-black sm:shadow-2xl">
        {/* Bildschirm */}
        <div className="relative flex h-full flex-col overflow-hidden bg-white">
          <PhoneStatusBar dunkel={gesperrt} />

          <div className="relative flex-1 overflow-hidden">
            {gesperrt ? (
              <LockScreen onUnlock={() => setGesperrt(false)} />
            ) : current ? (
              <AppHost key={stack.length} screen={current} nav={nav} />
            ) : (
              <HomeScreen nav={nav} />
            )}
          </div>

          {/* Home-Leiste */}
          {!gesperrt && (
            <div className="flex items-center justify-center gap-6 bg-black/[0.02] py-2">
              {current ? (
                <button onClick={nav.back} className="text-xs font-semibold text-ink-400" aria-label="Zurück">
                  ‹ Zurück
                </button>
              ) : (
                <span className="text-xs text-ink-300">IMMO INC</span>
              )}
              <button
                onClick={nav.home}
                className="h-1.5 w-32 rounded-full bg-ink-900/80"
                aria-label="Home"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PhoneStatusBar({ dunkel }: { dunkel?: boolean }) {
  const monthIndex = useGame((s) => s.monthIndex)
  const farbe = dunkel ? 'text-white/90' : 'text-ink-700'
  return (
    <div className={`relative flex items-center justify-between px-6 pb-1 pt-2 text-[11px] font-semibold ${farbe}`}>
      <span>{gameTag(monthIndex)}. {gameDatum(monthIndex).split('. ')[1]}</span>
      <div className="absolute left-1/2 top-1.5 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <span>IMMO&nbsp;INC 📶 🔋</span>
    </div>
  )
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { spielerName, cash, owned, depot, monthIndex, tagesgeld, festgeld } = useGame()
  const vermoegen = gesamtVermoegen(cash, owned, depot, monthIndex, sparGuthaben(tagesgeld, festgeld))
  return (
    <button
      onClick={onUnlock}
      className="flex h-full w-full flex-col items-center justify-between bg-gradient-to-b from-slate-800 via-slate-900 to-black px-6 py-12 text-white"
    >
      <div className="mt-8 text-center">
        <div className="text-6xl font-black tabular-nums">{gameTag(monthIndex)}.</div>
        <div className="mt-1 text-lg font-medium text-white/80">{gameDatum(monthIndex).split('. ')[1]}</div>
      </div>

      <div className="w-full rounded-3xl bg-white/10 p-4 backdrop-blur">
        <div className="text-[11px] uppercase tracking-wide text-white/60">Gesamtvermögen</div>
        <div className="mt-0.5 text-2xl font-black tabular-nums">{euro(vermoegen)}</div>
        <div className="mt-1 text-xs text-white/60">Hallo {spielerName || 'Investor:in'} 👋</div>
      </div>

      <div className="mb-4 text-center">
        <div className="text-sm text-white/70">Tippen zum Entsperren</div>
        <div className="mt-2 text-2xl">⬆️</div>
      </div>
    </button>
  )
}

function FinanzWidget() {
  const { cash, owned, depot, monthIndex, tagesgeld, festgeld, monatVorspringen } = useGame()
  const vermoegen = gesamtVermoegen(cash, owned, depot, monthIndex, sparGuthaben(tagesgeld, festgeld))
  return (
    <div className="mx-4 rounded-3xl bg-white/85 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-500">Gesamtvermögen</div>
          <div className="text-2xl font-black tabular-nums text-ink-900">{euroShort(vermoegen)}</div>
        </div>
        <button
          onClick={monatVorspringen}
          className="flex items-center gap-1 rounded-xl bg-brand-500 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-soft transition hover:bg-brand-600"
        >
          ⏭️ +1 Monat
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
        <span className="text-ink-500">Liquidität</span>
        <span className={`font-bold tabular-nums ${cash < 0 ? 'text-rose-600' : 'text-ink-900'}`}>{euro(cash)}</span>
      </div>
    </div>
  )
}

function HomeScreen({ nav }: { nav: PhoneNav }) {
  const gridApps = APPS.filter((a) => a.id !== 'objekt' && !DOCK.includes(a.id))
  const dockApps = DOCK.map(appMeta)
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-sky-200 via-indigo-100 to-slate-100">
      <div className="pt-3">
        <FinanzWidget />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pt-4">
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {gridApps.map((a) => (
            <AppIcon key={a.id} meta={a} onClick={() => nav.open(a.id)} />
          ))}
        </div>
      </div>

      {/* Dock */}
      <div className="mx-3 mb-3 rounded-3xl bg-white/40 p-2 backdrop-blur">
        <div className="grid grid-cols-4 gap-3">
          {dockApps.map((a) => (
            <AppIcon key={a.id} meta={a} onClick={() => nav.open(a.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AppIcon({ meta, onClick }: { meta: AppMeta; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 transition active:scale-95">
      <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${meta.farbe} text-2xl text-white shadow-md`}>
        {meta.emoji}
      </span>
      <span className="w-full truncate text-center text-[10px] font-semibold text-ink-700">{meta.label}</span>
    </button>
  )
}

/** Rendert die aktuelle App. Native Apps bringen eigene Kopfzeile mit; „Dokument"-Screens bekommen einen AppBar. */
function AppHost({ screen, nav }: { screen: Screen; nav: PhoneNav }) {
  const meta = appMeta(screen.app)
  const onClose = nav.back

  // Native Apps (eigene Kopfzeile, füllen die Höhe selbst)
  switch (screen.app) {
    case 'immobilien':
      return <ImmoProudApp onClose={onClose} nav={nav} />
    case 'konten':
      return <BankingApp onClose={onClose} />
    case 'boerse':
      return <BoerseApp onClose={onClose} />
    case 'shop':
      return <ShopApp onClose={onClose} />
    case 'bautraeger':
      return <BautraegerApp onClose={onClose} />
    case 'daytrading':
      return <DaytradingApp onClose={onClose} nav={nav} />
    case 'slot':
      return <SlotApp onClose={onClose} nav={nav} />
    case 'nachrichten':
      return <NachrichtenApp onClose={onClose} />
    case 'giggle':
      return <GiggleApp onClose={onClose} nav={nav} initial={screen.props?.initial as string | undefined} />
    case 'chatomg':
      return <ChatOmgApp onClose={onClose} nav={nav} />
  }

  // Dokument-Screens mit generischem AppBar + Scroll-Container
  let inhalt: React.ReactNode = null
  switch (screen.app) {
    case 'objekt':
      inhalt = <PropertyDetail objektId={screen.props?.objektId as string} nav={nav} />
      break
    case 'portfolio':
      inhalt = <Portfolio nav={nav} />
      break
    case 'bank':
      inhalt = <Bank nav={nav} />
      break
    case 'finanzen':
      inhalt = <Finanzen />
      break
    case 'einstellungen':
      inhalt = <EinstellungenApp />
      break
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-2 py-2">
        <button onClick={onClose} className="rounded-lg px-2 py-1 text-lg text-brand-600" aria-label="Zurück">
          ‹
        </button>
        <span className="text-sm font-bold text-ink-900">
          {meta.emoji} {meta.label}
        </span>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-3">{inhalt}</div>
    </div>
  )
}
