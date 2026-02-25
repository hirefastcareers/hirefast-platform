# send-interest-check

Sends the Interest Check magic-link email to the candidate via Resend.

## Env (Supabase Edge Function secrets)

- **RESEND_API_KEY** (required to send): Your Resend API key. Without it, the function still saves the link and returns `sent: false` with `magic_link` so the client can log or copy it.
- **RESEND_FROM_EMAIL** (optional): Sender. Defaults to `HireFast AI <hello@hirefast.uk>`.
- **PUBLIC_APP_URL** (optional): Origin for the magic link. Defaults to `https://hirefast.uk`. Set only for staging/local (e.g. `http://localhost:5173`).

## Deploy

```bash
supabase functions deploy send-interest-check --secret RESEND_API_KEY=re_xxxx
```
