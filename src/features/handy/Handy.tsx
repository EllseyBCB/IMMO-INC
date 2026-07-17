import { gameDate } from '../../lib/format'
import { useGame } from '../../state/game'

interface Kontakt {
  name: string
  rolle: string
  emoji: string
}

const KONTAKTE: Kontakt[] = [
  { name: 'Sabine Kern', rolle: 'Maklerin — IMMO INC', emoji: '🏘️' },
  { name: 'Dr. Weber', rolle: 'Kreditberater — Deine Bank', emoji: '🏦' },
  { name: 'Bauträger Yılmaz', rolle: 'Sanierung & Renovierung', emoji: '🛠️' },
  { name: 'Hausverwaltung Nord', rolle: 'Verwaltung & Mieter', emoji: '🔑' },
]

const APPS = [
  { label: 'Nachrichten', emoji: '✉️', tone: 'from-blue-400 to-blue-600' },
  { label: 'Kontakte', emoji: '👥', tone: 'from-emerald-400 to-emerald-600' },
  { label: 'ImmoScout', emoji: '🏠', tone: 'from-orange-400 to-orange-600' },
  { label: 'Banking', emoji: '💳', tone: 'from-violet-400 to-violet-600' },
  { label: 'Besichtigung', emoji: '📅', tone: 'from-rose-400 to-rose-600' },
  { label: 'KI-Studio', emoji: '✨', tone: 'from-fuchsia-400 to-fuchsia-600' },
]

export default function Handy() {
  const { monthIndex } = useGame()

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-ink-900">Dein Handy</h1>
        <p className="text-sm text-ink-500">Kontakte, Nachrichten und Apps für dein Business</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[360px]">
          {/* Phone frame */}
          <div className="rounded-[2.5rem] border-[10px] border-ink-900 bg-ink-900 shadow-2xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-50 to-white">
              {/* Statusbar / notch */}
              <div className="relative flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-ink-700">
                <span>{gameDate(monthIndex).split(' ')[0]}</span>
                <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-ink-900" />
                <span>📶 🔋</span>
              </div>

              {/* App grid */}
              <div className="px-5 pb-3 pt-4">
                <div className="grid grid-cols-4 gap-4">
                  {APPS.map((a) => (
                    <div key={a.label} className="flex flex-col items-center gap-1">
                      <div
                        className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${a.tone} text-2xl shadow-md`}
                      >
                        {a.emoji}
                      </div>
                      <span className="text-[10px] font-medium text-ink-600">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages preview widget */}
              <div className="mx-4 mb-4 rounded-2xl bg-white/80 p-3 shadow-soft ring-1 ring-black/5 backdrop-blur">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-700">Kontakte</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                    KI-Chat bald
                  </span>
                </div>
                <div className="space-y-1">
                  {KONTAKTE.map((k) => (
                    <div key={k.name} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-lg">{k.emoji}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-ink-900">{k.name}</div>
                        <div className="text-[11px] text-ink-500">{k.rolle}</div>
                      </div>
                      <span className="text-ink-300">›</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-violet-50/60 p-4 text-center">
            <div className="text-sm font-bold text-violet-700">✨ Nächstes Update</div>
            <p className="mt-1 text-xs text-violet-700/80">
              Schreib deinen Kontakten echte Nachrichten — eine KI antwortet individuell und spielrelevant. Inseriere
              Objekte zur Vermietung, mach Besichtigungen aus und wäge Mieter-Risiken ab. Und im KI-Studio siehst du
              deine Renovierung als fotorealistisches Vorher/Nachher-Bild.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
