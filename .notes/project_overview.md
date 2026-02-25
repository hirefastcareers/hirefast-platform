# HireFast: Project Overview (v2.0 - Master Plan)

## 🎯 Mission
To eliminate the "Drop-off Crisis" and the "Ghosting Crisis" in high-volume UK recruitment. HireFast replaces slow, 30-field legacy systems with a 15-second, mobile-first "Express Apply" engine and a "Truth-Driven" recruiter dashboard.

## 🛠 Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons.
- **Backend/Database:** Supabase (Auth, Postgres, RLS).
- **Authentication:** Passwordless Magic Links only.
- **External APIs:** Postcodes.io (Commute calculation).

## 🎨 Brand Colours (site-wide)
Use only these three colours across the site:
- **Blue** — Logo “Fast”, primary CTAs, links, focus rings. Tailwind: `blue-600` (#2563eb), hover `blue-700`.
- **Black** — Logo “Hire”, headings, dark buttons/surfaces. Tailwind: `slate-900` (or equivalent dark).
- **White** — Backgrounds, cards, light surfaces. Tailwind: `white`, `slate-50` for subtle off-white.

## 🧩 The Problems We Are Solving
1. **Drop-off Crisis:** Reducing application time from minutes to 15 seconds.
2. **Sifting Fatigue:** Automated ranking using "Truth Data" (Commute distance, Right to Work).
3. **Ghosting Crisis:** Mutual accountability scores and "Interest Checks" via magic links.
4. **Recruiter Friction:** Eliminating the "Broadbeam" headache with sector-specific job templates.

## 🚀 Key Features (Phase 1 & 2)
- **Rapid-Post Engine:** Sector-specific templates (Logistics, Engineering, Manufacturing, Retail) to post jobs in <30 seconds.
- **Match Scoring:** Every application gets a suitability % based on commute (Truth Engine), Right to Work, and for Engineering/Manufacturing a 50% Location + 50% Skills Match when required tickets are set.
- **Truth Engine:** Postcode-based 🟢/🟡/🔴 Reliability Risk scores.
- **Multi-Tenant Dashboard:** Recruiters manage multiple client companies with zero data leakage (RLS enforced).

## 📊 Database Schema (Master)
- **employers**: `id`, `company_name`, `admin_email`, `industry_sector`
- **jobs**: `id`, `employer_id`, `recruiter_id`, `title`, `location`, `pay_rate`, `description_template`, `is_active`, `sector`, `required_skills` (tickets/certs)
- **applications**: `id`, `job_id`, `employer_id`, `full_name`, `email`, `phone`, `commute_distance`, `match_score`, `status`, `has_rtw`, `candidate_skills`, `last_interest_check`

## 💼 Business Model: B2B SaaS
- **Architecture:** Multi-tenant. Data isolated by `employer_id` via Supabase RLS.
- **Scale:** £50–£100/month initial burn; scaling with volume.