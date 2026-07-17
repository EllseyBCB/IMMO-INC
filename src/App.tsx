import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ladeSpielstand, nettoVermoegen, useGame } from './state/game'
import { euro, euroShort, gameDatum } from './lib/format'
import Onboarding from './features/onboarding/Onboarding'
import Markt from './features/markt/Markt'
import PropertyDetail from './features/markt/PropertyDetail'
import Portfolio from './features/portfolio/Portfolio'
import Bank from './features/bank/Bank'
import Finanzen from './features/finanzen/Finanzen'
import Handy from './features/handy/Handy'

function TopBar() {
  const { cash, owned, monthIndex } = useGame()
  const monatVorspringen = useGame((s) => s.monatVorspringen)
  const vermoegen = nettoVermoegen(cash, owned)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-soft">
            <span className="text-sm font-black">II</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-ink-900">IMMO INC</div>
            <div className="flex items-center gap-1 text-[11px] text-ink-500">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {gameDatum(monthIndex)} · Echtzeit
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={monatVorspringen}
            title="Einen Monat vorspringen"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink-700 shadow-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            <span className="text-sm leading-none">⏭️</span>
            <span>+1 Monat</span>
          </button>
          <div className="hidden text-right sm:block">
            <div className="text-[11px] uppercase tracking-wide text-ink-500">Vermögen</div>
            <div className="text-sm font-bold tabular-nums text-ink-900">{euroShort(vermoegen)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-ink-500">Liquidität</div>
            <div className={`text-sm font-bold tabular-nums ${cash < 0 ? 'text-rose-600' : 'text-ink-900'}`}>
              {euro(cash)}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

const NAV = [
  { to: '/', label: 'Markt', icon: '🏙️', end: true },
  { to: '/portfolio', label: 'Portfolio', icon: '🗂️' },
  { to: '/bank', label: 'Bank', icon: '🏦' },
  { to: '/handy', label: 'Handy', icon: '📱' },
  { to: '/finanzen', label: 'Finanzen', icon: '📊' },
]

function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-stretch justify-around px-2">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] font-semibold transition ${
                isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-700'
              }`
            }
          >
            <span className="text-lg leading-none">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  const { gestartet, laden } = useGame()
  const location = useLocation()

  useEffect(() => {
    const saved = ladeSpielstand()
    if (saved && saved.gestartet) laden(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Echtzeit-Herzschlag: wendet jede Sekunde die vergangene Zeit an (auch offline).
  useEffect(() => {
    const id = setInterval(() => useGame.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (!gestartet) {
    return <Onboarding />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        <Routes>
          <Route path="/" element={<Markt />} />
          <Route path="/objekt/:id" element={<PropertyDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/bank" element={<Bank />} />
          <Route path="/handy" element={<Handy />} />
          <Route path="/finanzen" element={<Finanzen />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
