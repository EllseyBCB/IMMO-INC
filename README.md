# 🏙️ IMMO INC — Immobilien-Simulationsspiel

Ein Browser-Spiel, in dem du mit Eigenkapital startest und ein Immobilien-Imperium aufbaust:
echte deutsche Objekte durchsuchen, finanzieren, renovieren und **flippen** oder **vermieten** —
mit realistischen Zahlen (Kaufnebenkosten, Bonität, Annuität, Spekulationssteuer) und einer Prise
Glück & Pech beim Verkauf.

**Live:** wird über GitHub Actions automatisch nach GitHub Pages deployed →
`https://ellseybcb.github.io/IMMO-INC/`

## Was ist drin (Phase 1 — MVP)

- **Markt** mit 12 realistischen Objekten aus einem echten **OpenImmo-XML-Feed** (`public/data/immobilien.xml`)
  in echten Städten (Berlin, Leipzig, München, Hamburg …), mit Fotos, Filtern & Sortierung.
- **Lebenssituation** wählen (Startkapital, Einkommen, Fixkosten) → bestimmt Bonität & Cashflow.
- **Bank**: Bonitäts-Score, Zins nach Bonität, Kreditrechner, Annuität, Bonitätsrahmen.
- **Kauf** mit voller Finanzierung: Grunderwerbsteuer je Bundesland, Notar, Grundbuch, Makler.
- **Bauträger**: Gewerke (Küche, Bad, Böden, Fassade, energetisch …) × Qualität → Kosten,
  Wertsteigerung, Bauzeit. Erzeugt bereits den **KI-Prompt** für die spätere Bildgenerierung.
- **Flip / Verkauf** mit Angebotspreis-Poker (Vermarktungsrisiko), Verkaufskosten & Spekulationssteuer.
- **Vermieten** (Basis): laufende Mieteinnahmen im Cashflow.
- **Finanzen-Dashboard**: Netto-Vermögen, Cashflow-Aufstellung, Verlauf.
- **Handy**: Smartphone-Shell mit Kontakten & Apps (Vorschau auf Phase 2/3).
- **Speichern/Laden** automatisch im Browser (localStorage).

## Roadmap

- **Phase 2 — Handy & KI:** echte In-Game-Emails mit Kontakten (KI-Antworten via Supabase Edge Function),
  KI-Renovierungsbilder (Vorher/Nachher) auf Knopfdruck.
- **Phase 3 — Vermietung:** Objekte inserieren, Anfragen abwarten, Mieter mit Risikoprofil
  (höheres Risiko → höhere Miete, aber Ausfall-/Schadensgefahr), Besichtigungen, Glück & Pech.

## Tech

Vite · React · TypeScript · Tailwind CSS · Zustand. Kein Backend im MVP nötig — reine statische Seite.

## 🔐 Sicherheit / API-Keys

GitHub Pages ist **statisches** Hosting — ein API-Key im Frontend wäre öffentlich sichtbar.
Deshalb enthält dieses Repo **keinen** Key. Live-KI-Features (Phase 2/3) laufen über
**Supabase Edge Functions**, wo der OpenAI-Key als serverseitiges Secret liegt und nie im
Browser landet. Vorab generierte Bilder werden als statische Assets ausgeliefert.

## Entwicklung

```bash
npm install
npm run dev      # lokal starten
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
```
