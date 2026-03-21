import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Zap, Menu, X } from 'lucide-react'
import ParticleBackground from './ParticleBackground'

const NAV = [
  { to: '/',           label: 'Home'        },
  { to: '/upload',     label: 'Analyze'     },
  { to: '/quiz',       label: 'Quiz'        },
  { to: '/score',      label: 'Resume Score'},
  { to: '/test',       label: 'Skill Test'  },   // ★ NEW
  { to: '/courses',    label: 'Courses'     },   // ★ NEW
]

export default function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])
  useEffect(() => setMenuOpen(false), [location])

  return (
    <div className="min-h-screen bg-soft relative">
      <ParticleBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-softborder shadow-sm' : ''}`}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <Zap size={14} className="text-accentDark" />
              </div>
              <span className="font-display font-800 text-lg tracking-tight text-ink">
                Way<span className="text-gradient">Point</span>
              </span>
            </NavLink>

            <div className="hidden md:flex items-center gap-1">
              {NAV.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to==='/'}
                  className={({ isActive }) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'text-accentDark bg-white/70' : 'text-dim hover:text-ink hover:bg-white/50'}`}
                >{label}</NavLink>
              ))}
              <NavLink to="/upload" className="ml-2 px-4 py-1.5 btn-gradient text-white text-sm font-display font-700 rounded-lg transition-all shadow-sm">
                Get Started →
              </NavLink>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-dim hover:text-ink">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden glass border-b border-softborder px-6 pb-4 flex flex-col gap-2">
              {NAV.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to==='/'}
                  className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'text-accentDark bg-white/70' : 'text-dim'}`}
                >{label}</NavLink>
              ))}
            </div>
          )}
        </nav>
        <main className="pt-20"><Outlet /></main>
      </div>
    </div>
  )
}
