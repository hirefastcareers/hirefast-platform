// HireFast: send Interest Check email with magic link (Resend)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API = "https://api.resend.com/emails"

interface RequestBody {
  application_id: string
}

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

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized", sent: false }), {
      status: 401,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    })
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body", sent: false }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    })
  }

  const applicationId = body?.application_id?.trim()
  if (!applicationId) {
    return new Response(JSON.stringify({ error: "application_id required", sent: false }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured", sent: false }),
      { status: 500, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: row, error: fetchError } = await supabase
    .from("applications")
    .select("id, email, full_name, interest_check_token, jobs(title), employers(company_name)")
    .eq("id", applicationId)
    .single()

  if (fetchError || !row) {
    return new Response(
      JSON.stringify({ error: "Application not found", sent: false }),
      { status: 404, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    )
  }

  const email = (row as { email?: string }).email?.trim()
  const token = (row as { interest_check_token?: string }).interest_check_token
  if (!email) {
    return new Response(
      JSON.stringify({ error: "Application has no email", sent: false }),
      { status: 400, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    )
  }
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Interest check token not set; save the check first", sent: false }),
      { status: 400, headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    )
  }

  const jobs = row.jobs as { title?: string } | null
  const employers = row.employers as { company_name?: string } | null
  const jobTitle = jobs?.title ?? "the role"
  const companyName = employers?.company_name ?? "the company"
  const candidateName = (row as { full_name?: string }).full_name ?? "there"

  const origin =
    Deno.env.get("PUBLIC_APP_URL") ??
    "https://hirefast.uk"
  const magicLink = `${origin.replace(/\/$/, "")}/confirm-interest/${applicationId}?t=${encodeURIComponent(token)}`

  const resendKey = Deno.env.get("RESEND_API_KEY")
  if (!resendKey) {
    return new Response(
      JSON.stringify({
        sent: false,
        error: "Email not configured. Add RESEND_API_KEY to send the link to the candidate.",
        magic_link: magicLink,
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    )
  }

  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "HireFast AI <hello@hirefast.uk>"
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #1e293b; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p>Hi ${escapeHtml(candidateName)},</p>
  <p>You applied for <strong>${escapeHtml(jobTitle)}</strong> at ${escapeHtml(companyName)}.</p>
  <p>Are you still interested? Tap the button below to confirm in one click—no password needed.</p>
  <p style="margin: 28px 0;">
    <a href="${escapeHtml(magicLink)}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 600;">Yes, I'm still interested</a>
  </p>
  <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="font-size: 12px; word-break: break-all; color: #64748b;">${escapeHtml(magicLink)}</p>
  <p style="font-size: 14px; color: #64748b;">— HireFast</p>
</body>
</html>
`.trim()

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Still interested in ${jobTitle}?`,
        html,
      }),
    })

    const resData = await res.json().catch(() => ({}))
    if (!res.ok) {
      return new Response(
        JSON.stringify({
          sent: false,
          error: (resData as { message?: string }).message ?? `Resend error: ${res.status}`,
        }),
        {
          status: 200,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      )
    }

    return new Response(
      JSON.stringify({ sent: true, id: (resData as { id?: string }).id }),
      { headers: { ...getCorsHeaders(), "Content-Type": "application/json" } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ sent: false, error: String(e) }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    )
  }
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
