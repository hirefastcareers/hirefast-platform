import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        <button
          onClick={() => navigate('/')}
          className="text-white font-bold text-lg sm:text-xl tracking-tight hover:opacity-90 transition"
        >
          Hire<span className="text-amber-400">Fast</span>
        </button>
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate('/employer/sales')}
            className="text-slate-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition"
          >
            For Employers
          </button>
          <button
            onClick={() => navigate('/jobs')}
            className="text-slate-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition"
          >
            For Candidates
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="ml-1 sm:ml-2 bg-white text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            Login
          </button>
        </nav>
      </div>
    </header>
  )
}
