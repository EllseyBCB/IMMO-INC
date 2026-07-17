import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white shadow-card ring-1 ring-black/[0.04] ${onClick ? 'cursor-pointer transition hover:shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'danger' | 'success'

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40'
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-soft',
    ghost: 'bg-transparent text-ink-700 hover:bg-slate-100',
    outline: 'bg-white text-ink-900 ring-1 ring-slate-200 hover:bg-slate-50',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode
  tone?: 'slate' | 'blue' | 'green' | 'amber' | 'rose' | 'violet'
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = 'ink',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'ink' | 'up' | 'down'
}) {
  const colors = { ink: 'text-ink-900', up: 'text-emerald-600', down: 'text-rose-600' }
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`mt-0.5 text-xl font-bold tabular-nums ${colors[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-ink-500">{sub}</div>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-in relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        {title && (
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">{title}</h3>
            <button onClick={onClose} className="rounded-lg p-1 text-ink-500 hover:bg-slate-100" aria-label="Schließen">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
    />
  )
}
