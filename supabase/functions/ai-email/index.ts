// IMMO INC — Edge Function "ai-email"
// OpenAI-Proxy für In-Game-Emails. Der OpenAI-Key liegt als Supabase-Secret
// OPENAI_API_KEY und verlässt NIE den Server / das Frontend.
//
// Deploy: via Supabase MCP oder `supabase functions deploy ai-email --no-verify-jwt`
// Secret: `supabase secrets set OPENAI_API_KEY=sk-...` (oder im Dashboard).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HistoryItem {
  from: 'player' | 'contact'
  text: string
}

interface Body {
  contact: { name: string; role: string; persona: string }
  history: HistoryItem[]
  message: string
  context: {
    spielerName: string
    monat: string
    liquiditaet: number
    objekte: number
    portfolioWert: number
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return json({ error: 'missing_key', reply: null }, 200)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  const { contact, history = [], message, context } = body
  if (!message || !contact) return json({ error: 'bad_request' }, 400)

  const euro = (n: number) => `${Math.round(n).toLocaleString('de-DE')} €`

  const system = [
    `Du bist "${contact.name}", ${contact.role} im Immobilien-Aufbauspiel IMMO INC.`,
    `Persona/Verhalten: ${contact.persona}`,
    ``,
    `Aktuelle Lage der Spielerin/des Spielers (${context.spielerName || 'Investor:in'}):`,
    `- Datum im Spiel: ${context.monat}`,
    `- Liquidität: ${euro(context.liquiditaet)}`,
    `- Immobilien im Portfolio: ${context.objekte} (Wert ${euro(context.portfolioWert)})`,
    ``,
    `Antworte AUF DEUTSCH, in der Rolle, wie in einer echten E-Mail/Chat-Nachricht.`,
    `Halte dich kurz (2–5 Sätze). Sei realistisch: du kannst zusagen, absagen,`,
    `Bedingungen/Kosten/Termine nennen, nachfragen. Kein Meta-Gerede, kein "Als KI".`,
    `Bleib beim Thema Immobilien, Finanzierung, Sanierung, Vermietung.`,
  ].join('\n')

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-8).map((h) => ({
      role: h.from === 'player' ? ('user' as const) : ('assistant' as const),
      content: h.text,
    })),
    { role: 'user', content: message },
  ]

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.9,
        max_tokens: 220,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      return json({ error: 'openai_error', detail, reply: null }, 200)
    }

    const data = await res.json()
    const reply: string = data?.choices?.[0]?.message?.content?.trim() ?? ''
    return json({ reply })
  } catch (e) {
    return json({ error: 'exception', detail: String(e), reply: null }, 200)
  }
})
