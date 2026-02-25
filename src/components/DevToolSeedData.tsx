/**
 * Dev-only tool: seeds the current employer with 4 test vacancies and 10–15 mock candidates
 * so you can see the dashboard (Truth Engine, skills tags, interest confirmed) in action.
 * Uses the selectedEmployerId from EmployerContext so data shows on your dashboard.
 */
import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { supabase } from '../supabase'
import { useEmployer } from '../contexts/EmployerContext'

const TEST_JOBS = [
  { title: 'Warehouse Operative', sector: 'logistics', postcode: 'S1 1HE', location: 'Sheffield', pay_rate: '£11.50/hr', required_skills: [] as string[] },
  { title: 'CNC Machinist', sector: 'engineering', postcode: 'LS1 1BA', location: 'Leeds', pay_rate: '£16.00/hr', required_skills: ['CNC Ops'] as string[] },
  { title: 'Assembly Line Worker', sector: 'manufacturing', postcode: 'S60 1AB', location: 'Rotherham', pay_rate: '£12.00/hr', required_skills: [] as string[] },
  { title: 'Store Assistant', sector: 'retail', postcode: 'M1 1AD', location: 'Manchester', pay_rate: '£10.42/hr', required_skills: [] as string[] },
]

// Valid UK postcodes for Truth Engine (commute_distance logic): close, medium and far from job locations
const CANDIDATE_POSTCODES = [
  'S1 1AA',   // Sheffield
  'S1 2AA',   // Sheffield
  'S2 4BA',   // Sheffield
  'S10 2AA',  // Sheffield
  'S60 1AA',  // Rotherham
  'DN1 2AB',  // Doncaster
  'LS1 1AA',  // Leeds
  'LS2 3AB',  // Leeds
  'M1 1AA',   // Manchester
  'M1 2AD',   // Manchester
  'M2 1AA',   // Manchester
  'B1 1AA',   // Birmingham
  'L1 1AA',   // Liverpool
]

const MOCK_CANDIDATES = [
  { full_name: 'Jordan Smith', email: 'jordan.smith@example.com', phone: '07700 900111' },
  { full_name: 'Sam Taylor', email: 'sam.taylor@example.com', phone: '07700 900222' },
  { full_name: 'Alex Brown', email: 'alex.brown@example.com', phone: '07700 900333' },
  { full_name: 'Casey Wilson', email: 'casey.wilson@example.com', phone: '07700 900444' },
  { full_name: 'Morgan Lee', email: 'morgan.lee@example.com', phone: '07700 900555' },
  { full_name: 'Riley Clark', email: 'riley.clark@example.com', phone: '07700 900666' },
  { full_name: 'Quinn Hall', email: 'quinn.hall@example.com', phone: '07700 900777' },
  { full_name: 'Jamie Wright', email: 'jamie.wright@example.com', phone: '07700 900888' },
  { full_name: 'Drew Evans', email: 'drew.evans@example.com', phone: '07700 900999' },
  { full_name: 'Finley King', email: 'finley.king@example.com', phone: '07700 901000' },
  { full_name: 'Reese Green', email: 'reese.green@example.com', phone: '07700 901001' },
  { full_name: 'Parker Scott', email: 'parker.scott@example.com', phone: '07700 901002' },
  { full_name: 'Avery Adams', email: 'avery.adams@example.com', phone: '07700 901003' },
  { full_name: 'Blake Turner', email: 'blake.turner@example.com', phone: '07700 901004' },
]

function getCommuteRiskLevel(distanceMiles: number, sector: string): 'green' | 'amber' | 'red' {
  const greenMiles: Record<string, number> = { logistics: 10, retail: 10, manufacturing: 15, engineering: 25 }
  const amberMiles: Record<string, number> = { logistics: 20, retail: 20, manufacturing: 28, engineering: 45 }
  const green = greenMiles[sector] ?? 10
  const amber = amberMiles[sector] ?? 20
  if (distanceMiles < green) return 'green'
  if (distanceMiles <= amber) return 'amber'
  return 'red'
}

function getLocationScore(risk: 'green' | 'amber' | 'red'): number {
  if (risk === 'green') return 100
  if (risk === 'amber') return 85
  return 50
}

export default function DevToolSeedData() {
  const { selectedEmployerId } = useEmployer()
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSeed() {
    if (!selectedEmployerId) {
      setMessage({ type: 'err', text: 'Select an employer first (dropdown above).' })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'err', text: 'You must be signed in to seed data.' })
      return
    }

    setSeeding(true)
    setMessage(null)
    try {
      // 1) Insert 4 jobs
      const jobInserts = TEST_JOBS.map((j) => ({
        employer_id: selectedEmployerId,
        recruiter_id: user.id,
        title: j.title,
        location: j.postcode,
        location_name: j.location,
        postcode: j.postcode,
        pay_rate: j.pay_rate,
        description_template: `Test role: ${j.title} in ${j.location}.`,
        is_active: true,
        sector: j.sector,
        required_skills: j.required_skills,
      }))
      const { data: insertedJobs, error: jobsErr } = await supabase
        .from('jobs')
        .upsert(jobInserts, { onConflict: 'employer_id,title,location' })
        .select('id, sector, postcode, required_skills')
      if (jobsErr) throw jobsErr
      if (!insertedJobs?.length) throw new Error('No jobs returned.')

      // 2) Build 12 applications spread across jobs, with varied statuses/skills/postcodes
      const applications: Array<{
        job_id: string
        employer_id: string
        full_name: string
        email: string
        phone: string
        candidate_postcode: string
        status: string
        commute_distance: number
        commute_risk_level: string
        match_score: number
        has_rtw: boolean
        has_certs?: boolean
        candidate_skills?: string[]
        shortlisted_at?: string
        last_contacted_at?: string
        interest_check_sent_at?: string
        interest_status?: string
      }> = []

      const now = new Date().toISOString()
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()

      let candIndex = 0
      let postcodeIndex = 0

      // Warehouse (Sheffield) – 3 apps: 2 shortlisted, 1 confirmed; some with Forklift/CSCS
      const warehouseJob = insertedJobs.find((j) => j.sector === 'logistics')!
      const warehouseSkills = [['Forklift'], ['CSCS'], [] as string[]]
      for (let i = 0; i < 3; i++) {
        const c = MOCK_CANDIDATES[candIndex++ % MOCK_CANDIDATES.length]
        const dist = i === 0 ? 1.2 : i === 1 ? 5 : 22
        const risk = getCommuteRiskLevel(dist, 'logistics')
        const locScore = getLocationScore(risk)
        applications.push({
          job_id: warehouseJob.id,
          employer_id: selectedEmployerId,
          full_name: c.full_name,
          email: c.email,
          phone: c.phone,
          candidate_postcode: CANDIDATE_POSTCODES[postcodeIndex++ % CANDIDATE_POSTCODES.length],
          status: i === 2 ? 'pending' : 'shortlisted',
          commute_distance: dist,
          commute_risk_level: risk,
          match_score: locScore,
          has_rtw: true,
          candidate_skills: warehouseSkills[i],
          shortlisted_at: i === 2 ? null : twoDaysAgo,
          last_contacted_at: i === 0 ? oneDayAgo : undefined,
          interest_check_sent_at: i === 0 ? oneDayAgo : undefined,
          interest_status: i === 0 ? 'confirmed' : (i === 1 ? 'pending' : undefined),
        } as typeof applications[0])
      }

      // CNC Machinist (Leeds, requires CNC Ops) – 4 apps: some with ticket, some missing
      const cncJob = insertedJobs.find((j) => j.sector === 'engineering')!
      for (let i = 0; i < 4; i++) {
        const c = MOCK_CANDIDATES[candIndex++ % MOCK_CANDIDATES.length]
        const hasCncTicket = i === 0 || i === 2
        const dist = i === 0 ? 3 : i === 1 ? 12 : i === 2 ? 28 : 8
        const risk = getCommuteRiskLevel(dist, 'engineering')
        const locScore = getLocationScore(risk)
        const skillsScore = hasCncTicket ? 100 : 0
        const match_score = Math.round(0.5 * locScore + 0.5 * skillsScore)
        applications.push({
          job_id: cncJob.id,
          employer_id: selectedEmployerId,
          full_name: c.full_name,
          email: c.email,
          phone: c.phone,
          candidate_postcode: CANDIDATE_POSTCODES[postcodeIndex++ % CANDIDATE_POSTCODES.length],
          status: i === 1 ? 'shortlisted' : 'pending',
          commute_distance: dist,
          commute_risk_level: risk,
          match_score,
          has_rtw: true,
          has_certs: true,
          candidate_skills: hasCncTicket ? ['CNC Ops'] : [],
          shortlisted_at: i === 1 ? twoDaysAgo : undefined,
          interest_status: i === 1 ? 'confirmed' : undefined,
          interest_check_sent_at: i === 1 ? oneDayAgo : undefined,
        } as typeof applications[0])
      }

      // Assembly (Rotherham) – 3 apps; some with Manual Handling, Forklift
      const assemblyJob = insertedJobs.find((j) => j.sector === 'manufacturing')!
      const assemblySkills = [['Manual Handling', 'Forklift'], ['Forklift'], [] as string[]]
      for (let i = 0; i < 3; i++) {
        const c = MOCK_CANDIDATES[candIndex++ % MOCK_CANDIDATES.length]
        const dist = i === 0 ? 2 : i === 1 ? 18 : 35
        const risk = getCommuteRiskLevel(dist, 'manufacturing')
        const locScore = getLocationScore(risk)
        applications.push({
          job_id: assemblyJob.id,
          employer_id: selectedEmployerId,
          full_name: c.full_name,
          email: c.email,
          phone: c.phone,
          candidate_postcode: CANDIDATE_POSTCODES[postcodeIndex++ % CANDIDATE_POSTCODES.length],
          status: i === 1 ? 'shortlisted' : 'pending',
          commute_distance: dist,
          commute_risk_level: risk,
          match_score: locScore,
          has_rtw: true,
          candidate_skills: assemblySkills[i],
          shortlisted_at: i === 1 ? twoDaysAgo : undefined,
        } as typeof applications[0])
      }

      // Store Assistant (Manchester) – 3 apps; one with First Aid (retail-appropriate)
      const retailJob = insertedJobs.find((j) => j.sector === 'retail')!
      const retailSkills = [['First Aid'], [] as string[], [] as string[]]
      for (let i = 0; i < 3; i++) {
        const c = MOCK_CANDIDATES[candIndex++ % MOCK_CANDIDATES.length]
        const dist = i === 0 ? 0.8 : i === 1 ? 9 : 25
        const risk = getCommuteRiskLevel(dist, 'retail')
        const locScore = getLocationScore(risk)
        applications.push({
          job_id: retailJob.id,
          employer_id: selectedEmployerId,
          full_name: c.full_name,
          email: c.email,
          phone: c.phone,
          candidate_postcode: CANDIDATE_POSTCODES[postcodeIndex++ % CANDIDATE_POSTCODES.length],
          status: i === 0 ? 'shortlisted' : 'pending',
          commute_distance: dist,
          commute_risk_level: risk,
          match_score: locScore,
          has_rtw: true,
          candidate_skills: retailSkills[i],
          shortlisted_at: i === 0 ? twoDaysAgo : undefined,
          interest_status: i === 0 ? 'confirmed' : undefined,
          interest_check_sent_at: i === 0 ? oneDayAgo : undefined,
        } as typeof applications[0])
      }

      const rows = applications.map((a) => ({
        job_id: a.job_id,
        employer_id: a.employer_id,
        full_name: a.full_name,
        email: a.email,
        phone: a.phone,
        candidate_postcode: a.candidate_postcode,
        status: a.status,
        commute_distance: a.commute_distance,
        commute_risk_level: a.commute_risk_level,
        match_score: a.match_score,
        has_rtw: a.has_rtw,
        ...(a.has_certs !== undefined && { has_certs: a.has_certs }),
        ...(a.candidate_skills && a.candidate_skills.length > 0 && { candidate_skills: a.candidate_skills }),
        shortlisted_at: a.shortlisted_at ?? null,
        last_contacted_at: a.last_contacted_at ?? null,
        interest_check_sent_at: a.interest_check_sent_at ?? null,
        interest_status: a.interest_status ?? 'none',
      }))
      const { error: appErr } = await supabase
        .from('applications')
        .upsert(rows, { onConflict: 'job_id,email' })
      if (appErr) throw appErr

      setMessage({ type: 'ok', text: `Seeded 4 jobs and ${applications.length} applications. Reloading…` })
      window.location.reload()
    } catch (e) {
      const err = e as { message?: string } | Error
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : err instanceof Error
            ? err.message
            : String(e)
      setMessage({ type: 'err', text: msg || 'Something went wrong.' })
    } finally {
      setSeeding(false)
    }
  }

  return (
    <details className="rounded-xl border border-amber-500/30 bg-amber-950/20 overflow-hidden">
      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-amber-200 font-medium list-none">
        <FlaskConical size={18} aria-hidden />
        Dev: Seed test data
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-3">
        <p className="text-slate-400 text-sm">
          4 vacancies (Warehouse Sheffield, CNC Leeds, Assembly Rotherham, Store Manchester) and 12 mock candidates with mixed statuses, distances, and skills.
        </p>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding || !selectedEmployerId}
          className="rounded-lg bg-amber-600 text-slate-900 font-semibold px-4 py-2 text-sm hover:bg-amber-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {seeding ? 'Seeding…' : 'Seed test data'}
        </button>
        {message && (
          <p className={message.type === 'err' ? 'text-red-400 text-sm' : 'text-emerald-400 text-sm'}>
            {message.text}
          </p>
        )}
      </div>
    </details>
  )
}
