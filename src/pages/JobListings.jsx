import Navbar from '../components/Navbar'
import JobBoard from '../components/JobBoard'

function JobListings() {
  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <Navbar />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
            Find your next role
          </h1>
          <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Check eligibility in seconds. No CV required to start.
          </p>
        </header>

        <JobBoard />
      </main>
    </div>
  )
}

export default JobListings
