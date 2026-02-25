import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        <button
          onClick={() => navigate('/')}
          className="font-bold text-lg sm:text-xl tracking-tight transition"
        >
          <span className="text-slate-900 hover:text-slate-700">Hire</span>
          <span className="text-blue-600 hover:text-blue-700">Fast</span>
        </button>
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate('/employer/sales')}
            className="text-slate-600 hover:text-blue-600 text-sm font-medium px-3 py-2 rounded-lg transition"
          >
            For Employers
          </button>
          <button
            onClick={() => navigate('/jobs')}
            className="text-slate-600 hover:text-blue-600 text-sm font-medium px-3 py-2 rounded-lg transition"
          >
            For Candidates
          </button>
          <button
            onClick={() => navigate('/employer/login')}
            className="ml-1 sm:ml-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Login
          </button>
        </nav>
      </div>
    </header>
  )
}
