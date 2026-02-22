HireFast: Project Overview
🎯 Mission
To eliminate candidate drop-off in high-volume UK recruitment by replacing clunky, slow legacy systems with a "speed-first," mobile-optimized experience.

🛠 Tech Stack
Frontend: React (Vite) + Tailwind CSS

Backend/Database: Supabase (Auth, Postgres, Storage)

Design Philosophy: Mobile-first, bold typography, professional but high-energy.

🧩 Core Problems We Are Solving
Candidate Drop-off: Shortening the time-to-apply from minutes to seconds.

Sifting Fatigue: Automating the initial screening so recruiters don't drown in CVs.

UK Compliance: Ensuring data handling aligns with local standards.

🚀 Key Features (Phase 1)
Magic-Link Login: No passwords to remember for candidates.

Fast-Apply Interface: A Tinder-style or "one-tap" application flow.

Recruiter Dashboard: A clean, high-speed view of the top 10% of candidates.
## Current Progress (Feb 2026)
- **Deployment:** Live on Vercel (hirefast-platform.vercel.app).
- **Features:** - Landing page hero section implemented.
    - "Get Started" modal is functional.
    - Connection to Supabase is active (responses are being captured in the database).
    ### 📊 Database Schema
- **Table:** `leads`
- **Columns:** `id`, `created_at`, `full_name`, `email`, `company`, `status`
## 💼 Business Model: B2B SaaS
- **Target Users:** UK Employers (SMEs and High-Volume recruiters).
- **Architecture:** Multi-tenant. Each Employer has their own workspace.
- **Candidate Experience:** Ultra-fast, branded to the employer.
- **Employer Experience:** A dashboard to manage their specific job postings and applicants.
### 📊 Database Schema (v2 - Multi-tenant)
- **employers**: id, company_name, admin_email
- **jobs**: id, employer_id, title, location, is_active
- **applications**: id, job_id, employer_id, full_name, email, phone, status