// DemoPage.jsx — Live interactive demo
// User types any job title, picks a starting background, and sees a REAL
// gap analysis run through the actual API — no hardcoded data.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, ArrowRight, Loader2, AlertCircle,
  Code2, BarChart3, Server, Warehouse, Briefcase, ChevronRight
} from 'lucide-react'
import { analyzeGap } from '../api'

const STARTER_PROFILES = [
  {
    icon: Code2,
    label: 'Data Analyst',
    resume: `Data Analyst with 3 years experience.\nSkills: Python, SQL, Excel, Power BI, Data Visualization, Statistics, Pandas\nExperience: Built dashboards, wrote SQL queries, analyzed business metrics.`,
    color: 'accent',
    bg: 'bg-mintbg',
    border: 'border-accent/30',
    text: 'text-accentDark',
    ibg: 'bg-accent/20',
  },
  {
    icon: BarChart3,
    label: 'Business Analyst',
    resume: `Business Analyst with 4 years experience.\nSkills: Excel, Tableau, PowerPoint, Stakeholder Management, Requirements Gathering, Process Mapping\nExperience: Led process improvement projects, created business requirements docs.`,
    color: 'sky',
    bg: 'bg-panel2',
    border: 'border-sky/30',
    text: 'text-skyDark',
    ibg: 'bg-sky/20',
  },
  {
    icon: Server,
    label: 'Linux SysAdmin',
    resume: `Linux Systems Administrator with 5 years experience.\nSkills: Linux, Bash, Networking, On-premise Infrastructure, Monitoring, Apache, MySQL\nExperience: Managed 200+ servers, automated deployments with Bash scripts.`,
    color: 'lavender',
    bg: 'bg-lavbg',
    border: 'border-lavender/30',
    text: 'text-lavDark',
    ibg: 'bg-lavender/20',
  },
  {
    icon: Warehouse,
    label: 'Warehouse Supervisor',
    resume: `Warehouse Supervisor with 6 years experience.\nSkills: Team Leadership, Inventory Management, OSHA Compliance, Forklift, Receiving & Shipping\nExperience: Managed a team of 15, reduced inventory shrinkage by 20%.`,
    color: 'orange',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-600',
    ibg: 'bg-orange-100',
  },
  {
    icon: Briefcase,
    label: 'Fresh Graduate',
    resume: `Recent Computer Science graduate.\nSkills: Java, C++, Data Structures, Algorithms, OOP, Git basics\nProjects: Built a university management system, implemented sorting algorithms.`,
    color: 'accent',
    bg: 'bg-mintbg',
    border: 'border-accent/30',
    text: 'text-accentDark',
    ibg: 'bg-accent/20',
  },
]

export default function DemoPage() {
  const navigate = useNavigate()
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const canRun = selectedProfile !== null && targetRole.trim().length > 2

  const runDemo = async () => {
    if (!canRun) return
    setLoading(true)
    setError(null)
    try {
      const profile = STARTER_PROFILES[selectedProfile]
      const jd = `${targetRole.trim()}\n\nWe are looking for a skilled ${targetRole.trim()} to join our team.`
      const result = await analyzeGap(profile.resume, jd)
      localStorage.setItem('waypoint_result', JSON.stringify(result))
      navigate('/pathway', { state: { result } })
    } catch (e) {
      setError(e.message || 'Analysis failed — is the backend running?')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-soft">
      <div className="fixed top-0 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'rgba(52,211,153,0.07)' }} />
      <div className="fixed top-20 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'rgba(56,189,248,0.07)' }} />

      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-mintbg border border-accent/30 rounded-full mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"/>
            <span className="text-accentDark text-xs font-mono tracking-widest uppercase">Live Demo — Real API</span>
          </div>
          <h1 className="font-display text-5xl font-800 text-ink tracking-tight mb-3">
            See it work in real time
          </h1>
          <p className="text-dim text-base max-w-lg mx-auto">
            Pick a starting background, type any job title, and watch the actual gap analysis run through Grok — no fake data, no hardcoded results.
          </p>
        </div>

        {/* Step 1 — Pick a background */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-mono font-700 text-accentDark">1</div>
            <span className="text-sm font-mono font-600 text-ink">Pick a starting background</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {STARTER_PROFILES.map((p, i) => {
              const Icon = p.icon
              const sel = selectedProfile === i
              return (
                <button
                  key={p.label}
                  onClick={() => setSelectedProfile(i)}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${
                    sel
                      ? `${p.bg} ${p.border} shadow-md scale-[1.02]`
                      : 'bg-white border-softborder hover:border-accent/30 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${sel ? `${p.ibg} ${p.border}` : 'bg-soft border-softborder'}`}>
                    <Icon size={16} className={sel ? p.text : 'text-muted'}/>
                  </div>
                  <span className={`text-xs font-mono font-600 leading-tight ${sel ? p.text : 'text-dim'}`}>{p.label}</span>
                  {sel && <span className="w-1.5 h-1.5 rounded-full bg-accent"/>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2 — Target role */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-700 border transition-all ${selectedProfile !== null ? 'bg-accent/20 border-accent/40 text-accentDark' : 'bg-soft border-softborder text-muted'}`}>2</div>
            <span className={`text-sm font-mono font-600 transition-colors ${selectedProfile !== null ? 'text-ink' : 'text-muted'}`}>
              Type any target job title
            </span>
          </div>
          <div className={`frosted rounded-2xl border transition-all ${selectedProfile !== null ? 'border-accent/20' : 'border-softborder opacity-60'}`}>
            <input
              disabled={selectedProfile === null}
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runDemo()}
              placeholder="e.g. ML Engineer, DevOps Engineer, Product Manager, UX Designer…"
              className="w-full bg-transparent px-5 py-4 text-sm font-mono text-ink placeholder:text-muted outline-none"
            />
          </div>
          {selectedProfile !== null && (
            <p className="text-xs font-mono text-muted mt-2 ml-1">
              Starting from: <span className="text-dim">{STARTER_PROFILES[selectedProfile].label}</span> — type any role you want to transition to
            </p>
          )}
        </div>

        {/* Run button */}
        <button
          onClick={runDemo}
          disabled={!canRun || loading}
          className={`w-full py-4 rounded-2xl font-display font-700 text-base transition-all flex items-center justify-center gap-3 ${
            canRun && !loading
              ? 'btn-gradient text-white shadow-md hover:shadow-lg'
              : 'bg-soft border border-softborder text-muted cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin"/>
              Running gap analysis…
            </>
          ) : (
            <>
              <Zap size={18}/>
              Run Live Analysis
              <ArrowRight size={16}/>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 frosted rounded-xl p-4 border border-red-200 flex items-start gap-3">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-700 text-ink mb-0.5">Analysis failed</p>
              <p className="text-xs font-mono text-dim">{error}</p>
            </div>
          </div>
        )}

        {/* What happens next */}
        {!loading && (
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { n:'01', title:'Grok extracts skills', desc:'From the background profile using O*NET taxonomy' },
              { n:'02', title:'Gap is calculated',    desc:'Target role requirements minus your current skills' },
              { n:'03', title:'Pathway is built',     desc:'Dijkstra on the prerequisite graph — shortest path only' },
            ].map(step => (
              <div key={step.n} className="frosted rounded-xl p-4 shadow-sm text-center">
                <div className="text-xs font-mono text-muted mb-2">{step.n}</div>
                <div className="text-sm font-700 text-ink mb-1">{step.title}</div>
                <div className="text-xs font-mono text-dim leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Or use your own resume */}
        <div className="mt-8 text-center">
          <span className="text-xs font-mono text-muted">Want to use your actual resume? </span>
          <button onClick={() => navigate('/upload')} className="text-xs font-mono text-accentDark hover:underline">
            Upload your resume →
          </button>
        </div>
      </div>
    </div>
  )
}
