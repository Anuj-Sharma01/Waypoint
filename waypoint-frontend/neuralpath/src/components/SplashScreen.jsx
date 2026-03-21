import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  // phase 0: logo appears, phase 1: tagline, phase 2: fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => setPhase(2), 2000)
    const t3 = setTimeout(() => onDone(), 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className={`fixed inset-0 z-[999] flex flex-col items-center justify-center transition-opacity duration-700 ${phase === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 50%, #ede9fe 100%)' }}
    >
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(52,211,153,0.2)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(56,189,248,0.2)', animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(167,139,250,0.15)', animationDelay: '1s' }} />

      <div className="relative text-center">
        {/* Logo */}
        <div className={`transition-all duration-700 ${phase >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #34d399, #38bdf8, #a78bfa)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" strokeWidth="0"/>
              </svg>
            </div>
            <span className="font-display text-4xl font-800 text-ink">Way<span style={{ background: 'linear-gradient(135deg,#34d399,#38bdf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Point</span></span>
          </div>
        </div>

        {/* Tagline */}
        <div className={`transition-all duration-700 delay-300 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="font-body text-lg text-dim tracking-wide">Skip what you know. Learn what you don't.</p>
          {/* Loading bar */}
          <div className="mt-8 w-48 mx-auto h-1 bg-white/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full animate-[loading_1.2s_ease-in-out_forwards]" style={{ background: 'linear-gradient(90deg,#34d399,#38bdf8,#a78bfa)' }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  )
}
