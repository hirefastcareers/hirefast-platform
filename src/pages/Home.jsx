import { useNavigate } from 'react-router-dom'
import { Briefcase, Building2, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      {/* Subtle mesh gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-slate-700/20 rounded-full blur-[80px]" />
      </div>

      <Navbar />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
        {/* Hero */}
        <section className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            The 15-Second Application Flow for High-Volume UK Teams.
          </h1>
          <p className="mt-4 sm:mt-6 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Choose your path below.
          </p>
        </section>

        {/* Split: Two large cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Card A: Candidate */}
          <button
            onClick={() => navigate('/jobs')}
            className="group relative flex flex-col items-start text-left p-6 sm:p-8 rounded-2xl sm:rounded-3xl overflow-hidden min-h-[200px] sm:min-h-[240px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-indigo-900/40 border border-white/10 rounded-2xl sm:rounded-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),transparent)] rounded-2xl sm:rounded-3xl" />
            <div className="relative w-full flex-1 flex flex-col">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-4 sm:mb-5">
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                I am a Candidate
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Find roles and apply in seconds.
              </p>
              <span className="mt-auto pt-6 inline-flex items-center gap-2 text-indigo-400 font-semibold text-sm sm:text-base group-hover:gap-3 transition-all">
                Go to job listings
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </span>
            </div>
          </button>

          {/* Card B: Employer */}
          <button
            onClick={() => navigate('/employer/sales')}
            className="group relative flex flex-col items-start text-left p-6 sm:p-8 rounded-2xl sm:rounded-3xl overflow-hidden min-h-[200px] sm:min-h-[240px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-amber-900/30 border border-white/10 rounded-2xl sm:rounded-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.2),transparent)] rounded-2xl sm:rounded-3xl" />
            <div className="relative w-full flex-1 flex flex-col">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 sm:mb-5">
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                I am an Employer
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Get high-volume hires without the drop-off.
              </p>
              <span className="mt-auto pt-6 inline-flex items-center gap-2 text-amber-400 font-semibold text-sm sm:text-base group-hover:gap-3 transition-all">
                Contact sales
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </span>
            </div>
          </button>
        </section>
      </main>
    </div>
  )
}

export default Home
