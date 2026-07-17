import type { Zustand } from '../../data/types'

export function zustandTone(z: Zustand): 'rose' | 'amber' | 'slate' | 'blue' | 'green' {
  switch (z) {
    case 'sanierungsbedürftig':
      return 'rose'
    case 'renovierungsbedürftig':
      return 'amber'
    case 'gepflegt':
      return 'slate'
    case 'modernisiert':
      return 'blue'
    default:
      return 'green'
  }
}

export function zustandLabel(z: Zustand): string {
  return z.charAt(0).toUpperCase() + z.slice(1)
}

/** Brutto-Mietrendite p.a. */
export function mietrendite(kaltmiete: number, kaufpreis: number): number {
  if (kaufpreis <= 0) return 0
  return ((kaltmiete * 12) / kaufpreis) * 100
}
