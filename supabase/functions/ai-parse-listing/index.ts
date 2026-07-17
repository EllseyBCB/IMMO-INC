// IMMO INC — Edge Function "ai-parse-listing"
// Zerlegt eingefügten Inserat-Text (ImmoScout/Immowelt/ohnemakler/…) per KI in
// strukturierte Objektfelder. Der OpenAI-Key bleibt serverseitiges Secret.

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
  if (!apiKey) return json({ error: 'missing_key', objekt: null }, 200)

  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  const text = (body.text ?? '').slice(0, 6000)
  if (!text.trim()) return json({ error: 'empty' }, 400)

  const system = [
    'Du extrahierst aus dem Text eines deutschen Immobilien-Inserats strukturierte Daten.',
    'Antworte NUR mit einem JSON-Objekt mit exakt diesen Feldern:',
    'titel (string), objektart (einer von: "Wohnung","Haus","Reihenhaus","Mehrfamilienhaus","Dachgeschoss"),',
    'stadt (string), stadtteil (string, "" wenn unbekannt), plz (string), bundesland (string, aus der Stadt ableiten),',
    'kaufpreis (Zahl in Euro), wohnflaeche (Zahl m²), grundstueck (Zahl m² oder null),',
    'zimmer (Zahl, Dezimal erlaubt), baujahr (Zahl), ',
    'zustand (einer von: "sanierungsbedürftig","renovierungsbedürftig","gepflegt","modernisiert","neuwertig","erstbezug"),',
    'energieklasse (Buchstabe A-H oder "—"), hausgeldOderNebenkosten (Zahl €/Monat, schätze wenn nötig),',
    'kaltmieteMarkt (Zahl €/Monat erzielbare Marktmiete; schätze realistisch, falls nicht genannt),',
    'beschreibung (string, 1-3 Sätze), ausstattung (Array von Kurz-Strings),',
    'marktwert (Zahl, fairer Verkehrswert; nahe Kaufpreis, leicht abweichend),',
    'sanierungspotenzial (Zahl 0..1; hoch bei alt/unsaniert, niedrig bei neuwertig).',
    'Fehlende Zahlen sinnvoll aus Kontext (Lage, Baujahr, Zustand) schätzen. Keine Erklärungen, nur JSON.',
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
        max_tokens: 700,
        response_format: { type: 'json_object' },
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      return json({ error: 'openai_error', detail, objekt: null }, 200)
    }
    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? '{}'
    let objekt: unknown = null
    try {
      objekt = JSON.parse(raw)
    } catch {
      objekt = null
    }
    return json({ objekt })
  } catch (e) {
    return json({ error: 'exception', detail: String(e), objekt: null }, 200)
  }
})
