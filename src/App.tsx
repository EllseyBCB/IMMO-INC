import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ladeSpielstand, monatlicheMiete, monatlicheRaten, nettoVermoegen, useGame } from './state/game'
import { euro, euroShort, gameDate } from './lib/format'
import Onboarding from './features/onboarding/Onboarding'
import Markt from './features/markt/Markt'
import PropertyDetail from './features/markt/PropertyDetail'
import Portfolio from './features/portfolio/Portfolio'
import Bank from './features/bank/Bank'
import Finanzen from './features/finanzen/Finanzen'
import Handy from './features/handy/Handy'

function TopBar() {
  const { cash, owned, monthIndex, naechsterMonat, lebenssituation } = useGame()
  const vermoegen = nettoVermoegen(cash, owned)
  const raten = monatlicheRaten(owned)
  const miete = monatlicheMiete(owned)
  const privat = lebenssituation.nettoEinkommen - lebenssituation.fixkosten
  const monatsCashflow = privat + miete - raten -
    owned.filter((o) => o.nutzung !== 'vermietet').reduce((s, o) => s + o.property.hausgeldOderNebenkosten, 0)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-soft">
            <span className="text-sm font-black">II</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-ink-900">IMMO INC</div>
            <div className="text-[11px] text-ink-500">{gameDate(monthIndex)}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
          <button
            onClick={naechsterMonat}
            title={`Monats-Cashflow ~${euro(monatsCashflow)}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.98]"
          >
            <span>Monat</span>
            <span aria-hidden>→</span>
          </button>
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
