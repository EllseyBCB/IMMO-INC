import { Link } from 'react-router-dom'
import type { Property } from '../../data/types'
import { Badge } from '../../components/ui'
import { euro, area, pct } from '../../lib/format'
import { mietrendite, zustandLabel, zustandTone } from './propertyUtil'

export default function PropertyCard({ p }: { p: Property }) {
  const rendite = mietrendite(p.kaltmieteMarkt, p.kaufpreis)
  return (
    <Link
      to={`/objekt/${p.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/[0.04] transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={p.bilder[0]}
          alt={p.titel}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone={zustandTone(p.zustand)}>{zustandLabel(p.zustand)}</Badge>
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-2.5 py-1 text-sm font-extrabold text-ink-900 shadow-soft">
          {euro(p.kaufpreis)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-bold text-ink-900">{p.titel}</h3>
        </div>
        <p className="mt-0.5 text-xs text-ink-500">
          {p.stadtteil ? `${p.stadtteil}, ` : ''}
          {p.stadt} · {p.objektart}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-700">
          <span>{area(p.wohnflaeche)}</span>
          <span className="text-slate-300">•</span>
          <span>{p.zimmer.toLocaleString('de-DE')} Zi.</span>
          <span className="text-slate-300">•</span>
          <span>Bj. {p.baujahr}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-ink-500">
            Miete ~{euro(p.kaltmieteMarkt)}<span className="text-ink-400">/M</span>
          </span>
          <span className="text-xs font-semibold text-emerald-600">{pct(rendite)} Rendite</span>
        </div>
      </div>
    </Link>
  )
}
