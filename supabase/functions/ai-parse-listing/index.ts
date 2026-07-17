// IMMO INC — Edge Function "ai-parse-listing"
// Zerlegt eingefügten Inserat-Text (ein ODER mehrere Inserate, z. B. eine ganze
// Suchergebnis-Seite) per KI in strukturierte Objekte. Key bleibt Secret.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return json({ error: 'missing_key', objekte: [] }, 200)

  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  const text = (body.text ?? '').slice(0, 14000)
  if (!text.trim()) return json({ error: 'empty' }, 400)

  const system = [
    'Du extrahierst aus dem Text deutscher Immobilien-Inserate strukturierte Daten.',
    'Der Text kann EIN oder MEHRERE Inserate enthalten (z. B. eine Suchergebnis-Seite).',
    'Gib ein JSON-Objekt zurück: { "objekte": [ ... ] } mit einem Eintrag pro Immobilie.',
    'Jeder Eintrag hat exakt diese Felder:',
    'titel (string), objektart (einer von: "Wohnung","Haus","Reihenhaus","Mehrfamilienhaus","Dachgeschoss"),',
    'stadt (string), stadtteil (string, "" wenn unbekannt), plz (string), bundesland (string, aus der Stadt ableiten),',
    'kaufpreis (Zahl in Euro), wohnflaeche (Zahl m2), grundstueck (Zahl m2 oder null),',
    'zimmer (Zahl, Dezimal erlaubt), baujahr (Zahl),',
    'zustand (einer von: "sanierungsbeduerftig","renovierungsbeduerftig","gepflegt","modernisiert","neuwertig","erstbezug"),',
    'energieklasse (Buchstabe A-H oder "-"), hausgeldOderNebenkosten (Zahl EUR/Monat, schaetze wenn noetig),',
    'kaltmieteMarkt (Zahl EUR/Monat erzielbare Marktmiete; schaetze realistisch, falls nicht genannt),',
    'beschreibung (string, 1-3 Saetze), ausstattung (Array von Kurz-Strings),',
    'marktwert (Zahl, fairer Verkehrswert; nahe Kaufpreis, leicht abweichend),',
    'sanierungspotenzial (Zahl 0..1; hoch bei alt/unsaniert, niedrig bei neuwertig).',
    'Nur Objekte mit erkennbarem Kaufpreis aufnehmen. Fehlende Zahlen sinnvoll aus Kontext schaetzen.',
    'Maximal 25 Objekte. Keine Erklaerungen, nur das JSON.',
  ].join(' ')

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text },
        ],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      return json({ error: 'openai_error', detail, objekte: [] }, 200)
    }
    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? '{}'
    let parsed: any = {}
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {}
    }
    const objekte = Array.isArray(parsed?.objekte)
      ? parsed.objekte
      : Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && parsed.kaufpreis
          ? [parsed]
          : []
    return json({ objekte })
  } catch (e) {
    return json({ error: 'exception', detail: String(e), objekte: [] }, 200)
  }
})
