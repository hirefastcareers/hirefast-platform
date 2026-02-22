import { useNavigate } from 'react-router-dom'
import { Zap, Filter, MessageCircle, Store, Truck, UtensilsCrossed, FileEdit, Timer, Users, User } from 'lucide-react'
import FadeInSection from '../components/FadeInSection'

function Home() {
  const navigate = useNavigate()

  const industries = [
    { icon: Store, label: 'Retail' },
    { icon: Truck, label: 'Logistics' },
    { icon: UtensilsCrossed, label: 'Hospitality' },
  ]

  const features = [
    { icon: Zap, title: 'Zero drop-off', description: 'A 90-second mobile application.' },
    { icon: Filter, title: 'No more sifting', description: 'Hard-gate knockout questions that filter for UK Right-to-Work and shift availability instantly.' },
    { icon: MessageCircle, title: 'Ghost-free zone', description: 'Automated instant feedback for every candidate.' },
  ]

  const steps = [
    { icon: FileEdit, num: 1, title: 'Post your role', description: 'Create your listing in minutes. Our templates are built for volume hiring.' },
    { icon: Timer, num: 2, title: 'Candidates pass 90s triage', description: 'Right-to-Work, shifts, and transport questions filter before you see anyone.' },
    { icon: Users, num: 3, title: 'View your curated shortlist', description: 'Pre-qualified candidates, ranked and ready. No sifting required.' },
  ]

  return (
    <div className="min-h-screen bg-[#0d2547]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d2547] border-b border-white/10 backdrop-blur-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-18">
          <button
            onClick={() => navigate('/')}
            className="text-white font-black text-xl sm:text-2xl tracking-tight hover:opacity-90 transition"
          >
            Hire<span className="text-[#f4601a]">Fast</span>
          </button>
          <nav className="flex items-center gap-3 sm:gap-4 lg:gap-6">
            <button
              onClick={() => navigate('/jobs')}
              className="text-white/90 text-sm font-medium hover:text-white transition px-2 sm:px-0"
            >
              Find work
            </button>
            <button
              onClick={() => navigate('/employer/signup')}
              className="bg-[#f4601a] text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg hover:opacity-90 transition whitespace-nowrap"
            >
              For employers
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Indeed gets you applications.
              <br />
              <span className="text-[#f4601a]">HireFast gets you hires.</span>
            </h1>
            <p className="text-[#e2e8f0] text-lg sm:text-xl mb-10 max-w-2xl mx-auto px-2">
              The UK's fastest route from applicant to hire. Built for volume recruitment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-2">
              <button
                onClick={() => navigate('/employer/signup')}
                className="w-full sm:w-auto bg-[#f4601a] text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg shadow-[#f4601a]/20"
              >
                I'm an employer →
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#0d2547] transition"
              >
                I'm looking for work →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Trust Strip */}
      <section className="w-full">
        <FadeInSection>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-5xl mx-auto">
              <p className="text-[#a8c0dc] text-sm sm:text-base font-medium text-center mb-8 sm:mb-10 uppercase tracking-wider px-2">
                Powering volume hiring across:
              </p>
              <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-12 lg:gap-16 px-2">
                {industries.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#f4601a]">
                      <Icon size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-white font-semibold text-base sm:text-lg">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Why HireFast? */}
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-6xl mx-auto">
            <FadeInSection>
              <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-10 sm:mb-14 px-2">
                Why HireFast?
              </h2>
            </FadeInSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map(({ icon: Icon, title, description }, i) => (
                <FadeInSection key={title} delay={i * 100}>
                  <article className="bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 hover:bg-white/[0.12] transition shadow-xl shadow-black/10 h-full">
                    <div className="w-12 h-12 rounded-xl bg-[#f4601a]/20 backdrop-blur-sm flex items-center justify-center text-[#f4601a] border border-[#f4601a]/30 flex-shrink-0">
                      <Icon size={24} strokeWidth={2} />
                    </div>
                    <h3 className="text-white font-bold text-lg sm:text-xl">{title}</h3>
                    <p className="text-[#a8c0dc] text-base sm:text-lg leading-relaxed flex-1">
                      {description}
                    </p>
                  </article>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* From Post to Hire in 48 Hours */}
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-6xl mx-auto">
            <FadeInSection>
              <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 px-2">
                From Post to Hire in 48 Hours
              </h2>
              <p className="text-[#a8c0dc] text-center mb-12 sm:mb-16 max-w-2xl mx-auto px-2">
                Three steps. No sifting. No ghosting. Just hires.
              </p>
            </FadeInSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {steps.map(({ icon: Icon, num, title, description }, i) => (
                <FadeInSection key={num} delay={i * 120}>
                  <article className="bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 hover:bg-white/[0.12] transition shadow-xl shadow-black/10 relative overflow-hidden h-full">
                    <div className="absolute top-4 right-4 text-white/10 font-black text-5xl">{num}</div>
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-[#f4601a] border border-white/20 flex-shrink-0">
                      <Icon size={24} strokeWidth={2} />
                    </div>
                    <h3 className="text-white font-bold text-lg sm:text-xl pr-12">Step {num}: {title}</h3>
                    <p className="text-[#a8c0dc] text-base leading-relaxed flex-1">
                      {description}
                    </p>
                  </article>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Insight */}
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-5xl mx-auto">
            <FadeInSection>
              <article className="bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-xl shadow-black/10 flex flex-col sm:flex-row">
                <div className="w-full sm:w-80 flex-shrink-0 bg-white/5 flex items-center justify-center aspect-square sm:aspect-auto sm:min-h-[280px] p-6">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                    <User size={48} className="text-white/30 sm:w-16 sm:h-16" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="p-6 sm:p-10 flex flex-col justify-center">
                  <p className="text-[#e2e8f0] text-lg sm:text-xl leading-relaxed mb-6 italic">
                    &ldquo;As a former recruiter, I saw 60% of great candidates drop out because the process was too slow. We built HireFast to put the human back in high-volume hiring.&rdquo;
                  </p>
                  <p className="text-white font-semibold">— HireFast Founder</p>
                </div>
              </article>
            </FadeInSection>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home