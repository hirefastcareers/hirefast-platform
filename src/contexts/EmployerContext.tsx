import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'

const STORAGE_KEY = 'hirefast_selected_employer_id'

export type EmployerOption = {
  id: string
  company_name: string
}

type EmployerContextValue = {
  employers: EmployerOption[]
  selectedEmployerId: string | null
  setSelectedEmployerId: (id: string | null) => void
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createEmployer: (companyName: string, adminEmail: string) => Promise<{ id: string } | null>
}

const EmployerContext = createContext<EmployerContextValue | null>(null)

export function EmployerProvider({ children }: { children: React.ReactNode }) {
  const [employers, setEmployers] = useState<EmployerOption[]>([])
  const [selectedEmployerId, setSelectedEmployerIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEY)
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setSelectedEmployerId = useCallback((id: string | null) => {
    setSelectedEmployerIdState(id)
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const fetchEmployers = useCallback(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setEmployers([])
          setLoading(false)
          return
        }

        // Employers from recruiter_employers (explicit assignment)
        const { data: reRows, error: reErr } = await supabase
          .from('recruiter_employers')
          .select('employer_id, employers(company_name)')
          .eq('user_id', session.user.id)

        if (reErr) {
          setError(reErr.message ?? 'Failed to load employers.')
          setEmployers([])
          setLoading(false)
          return
        }

        // Employers from jobs (user created jobs for these employers – same as user_employer_ids() in RLS)
        const { data: jobRows, error: jobErr } = await supabase
          .from('jobs')
          .select('employer_id, employers(company_name)')
          .eq('recruiter_id', session.user.id)

        if (jobErr) {
          setError(jobErr.message ?? 'Failed to load employers.')
          setEmployers([])
          setLoading(false)
          return
        }

        const fromRe = (reRows ?? [])
          .filter((r: { employer_id?: string; employers?: { company_name: string } | null }) => r.employer_id && r.employers)
          .map((r: { employer_id: string; employers: { company_name: string } }) => ({
            id: r.employer_id,
            company_name: r.employers.company_name ?? 'Unknown',
          }))
        const fromJobs = (jobRows ?? [])
          .filter((r: { employer_id?: string; employers?: { company_name: string } | null }) => r.employer_id && r.employers)
          .map((r: { employer_id: string; employers: { company_name: string } }) => ({
            id: r.employer_id,
            company_name: r.employers.company_name ?? 'Unknown',
          }))

        // Merge and dedupe by id (recruiter_employers first, then jobs)
        const seen = new Set<string>()
        const list: EmployerOption[] = []
        for (const e of fromRe) {
          if (!seen.has(e.id)) {
            seen.add(e.id)
            list.push(e)
          }
        }
        for (const e of fromJobs) {
          if (!seen.has(e.id)) {
            seen.add(e.id)
            list.push(e)
          }
        }

        setEmployers(list)

        if (list.length === 0) {
          setSelectedEmployerIdState(null)
          if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
        } else {
          const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
          const validStored = stored && list.some((e) => e.id === stored)
          if (!validStored) {
            const firstId = list[0].id
            setSelectedEmployerIdState(firstId)
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, firstId)
          }
        }
      } catch (e) {
        setError('Something went wrong.')
      } finally {
        setLoading(false)
      }
  }, [])

  useEffect(() => {
    fetchEmployers()
  }, [fetchEmployers])

  const createEmployer = useCallback(async (companyName: string, adminEmail: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null
    const { data, error } = await supabase
      .from('employers')
      .insert({
        company_name: companyName.trim() || 'My Company',
        admin_email: adminEmail.trim() || session.user.email || 'admin@example.com',
        created_by: session.user.id,
      })
      .select('id')
      .single()
    if (error) return null
    await fetchEmployers()
    if (data?.id) {
      setSelectedEmployerIdState(data.id)
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, data.id)
    }
    return data ? { id: data.id } : null
  }, [fetchEmployers])

  const value: EmployerContextValue = {
    employers,
    selectedEmployerId,
    setSelectedEmployerId,
    loading,
    error,
    refetch: fetchEmployers,
    createEmployer,
  }

  return (
    <EmployerContext.Provider value={value}>
      {children}
    </EmployerContext.Provider>
  )
}

export function useEmployer() {
  const ctx = useContext(EmployerContext)
  if (!ctx) throw new Error('useEmployer must be used within EmployerProvider')
  return ctx
}

export function useEmployerOptional() {
  return useContext(EmployerContext)
}
