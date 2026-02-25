// HireFast AI Data Extractor: CV text → structured JSON for candidates table
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages"

interface ParseCvRequest {
  cv_text: string
}

interface ParseCvResponse {
  full_name: string | null
  phone: string | null
  email: string | null
  postcode: string | null
  candidate_skills: string[]
  has_rtw: boolean | null
  speed_summary: string | null
}

const TICKETS_HINT =
  "CSCS, HGV Class 1, HGV Class 2, Forklift, NVQ Level 2, NVQ Level 3, Welding Cert, CNC Ops, IPAF, PASMA, First Aid, Manual Handling, Confined Space, CPCS, Slinger/Signaller, Warehouse, Counterbalance"

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders() })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    })
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    )
  }

  let body: ParseCvRequest
  try {
    body = (await req.json()) as ParseCvRequest
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    })
  }

  const cvText = body?.cv_text?.trim()
  if (!cvText || cvText.length < 50) {
    return new Response(
      JSON.stringify({ error: "cv_text required (min 50 characters)" }),
      { status: 400, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    )
  }

  const systemPrompt = `Role: You are the HireFast AI Data Extractor.
Task: Convert raw CV text into a structured JSON object that matches the candidates table schema.

Logic:
- Skills Match: Extract specific "tickets" (e.g. CSCS, HGV Class 1, Forklift, NVQ Level 3). Use only where clearly stated in the CV. Prefer from this list where applicable: ${TICKETS_HINT}. Also include other relevant certs or job titles mentioned.
- Truth Engine Check: Extract the candidate's partial or full UK postcode for distance calculation (e.g. "SW1A", "M1 1AD", "LS1 1BA"). Return null if not found.
- The Summary: Create a 1-sentence "Speed-Reader" summary of their work history (max 120 characters). Be factual and concise.
- Right to Work: Set has_rtw to true only if the CV explicitly states they have right to work in the UK (or similar). Set to false only if it explicitly says they do not. Otherwise null.
- Also extract: full_name, phone (UK number if present), email (if present).

Output Format: Return ONLY a valid JSON object with these exact keys. No markdown, no explanation.
{
  "full_name": "string or null",
  "phone": "string or null",
  "email": "string or null",
  "postcode": "string or null (UK postcode/partial)",
  "candidate_skills": ["array of strings"],
  "has_rtw": boolean or null,
  "speed_summary": "string or null (max 120 chars)"
}`

  const userContent = `Extract from this CV:\n\n${cvText.slice(0, 30000)}`

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(
        JSON.stringify({ error: "Claude API error", detail: err }),
        { status: 502, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      )
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> }
    const text = data?.content?.[0]?.text ?? ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Could not parse Claude response as JSON" }),
        { status: 502, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
      )
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParseCvResponse
    const speedSummary = parsed.speed_summary?.trim()
    const result: ParseCvResponse = {
      full_name: parsed.full_name ?? null,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      postcode: parsed.postcode?.trim() ?? null,
      candidate_skills: Array.isArray(parsed.candidate_skills) ? parsed.candidate_skills : [],
      has_rtw: typeof parsed.has_rtw === "boolean" ? parsed.has_rtw : null,
      speed_summary: speedSummary && speedSummary.length > 120 ? speedSummary.slice(0, 120) : (speedSummary || null),
    }
    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Parse failed", detail: String(e) }),
      { status: 500, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    )
  }
})
