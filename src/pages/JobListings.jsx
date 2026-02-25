import Navbar from '../components/Navbar'
import JobBoard from '../components/JobBoard'

function JobListings() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Navbar />

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Find your next role
          </h1>
          <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Check eligibility in seconds. No CV required to start.
          </p>
        </header>

        <JobBoard />
      </main>
    </div>
  )
}

export default JobListings
