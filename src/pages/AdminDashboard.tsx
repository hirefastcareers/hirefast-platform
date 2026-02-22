import { useEffect, useState } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { supabase } from '../supabase'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        navigate('/login', { replace: true })
        return
      }
      setChecking(false)
    }

    checkSession()
    return () => { cancelled = true }
  }, [navigate])

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-100/80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#f4601a] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Authenticating...</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
