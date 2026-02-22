import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'

function SalesEnquiry() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-6">
            <Building2 className="w-7 h-7" strokeWidth={2} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            For Employers
          </h1>
          <p className="text-slate-400 mb-8">
            Get in touch to see how HireFast can power high-volume hiring for your team.
          </p>
          <button
            onClick={() => navigate('/employer/signup')}
            className="w-full sm:w-auto bg-amber-500 text-slate-900 font-semibold px-6 py-3 rounded-xl hover:bg-amber-400 transition"
          >
            Create employer account
          </button>
        </div>
      </div>
    </div>
  )
}

export default SalesEnquiry
