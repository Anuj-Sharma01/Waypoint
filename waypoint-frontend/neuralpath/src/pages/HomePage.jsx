import { useNavigate } from 'react-router-dom'
import { ArrowRight, Brain, GitBranch, Shield, Zap, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

const STATS = [
  { value:'0%',   label:'Hallucination Rate', desc:'Grounded by architecture', bg:'bg-mintbg border-accent/30',   num:'text-accentDark' },
  { value:'63%',  label:'Time Reduction',     desc:'vs static onboarding',    bg:'bg-panel2 border-sky/40',       num:'text-skyDark'    },
  { value:'4+',   label:'Role Categories',    desc:'Tech & operational',      bg:'bg-lavbg border-lavender/40',   num:'text-lavDark'    },
  { value:'O*NET',label:'Skill Taxonomy',     desc:'Industry standard',       bg:'bg-white border-softborder',    num:'text-accentDark' },
]

const PIPELINE = [
  { label:'Resume',          sub:'upload or paste',  color:'text-accentDark' },
  { label:'LLM Extraction',  sub:'Claude API',       color:'text-skyDark'    },
  { label:'Skill Gap',       sub:'target − current', color:'text-lavDark'    },
  { label:'Graph Traversal', sub:'Dijkstra on DAG',  color:'text-accentDark' },
  { label:'Pathway',         sub:'0% hallucination', color:'text-skyDark'    },
]

const FEATURES = [
  { icon:Brain,     title:'Bayesian Skill Graph',   desc:'Competency nodes weighted by proficiency. Prerequisite edges from O*NET — not guesswork.',                 tag:'20% criteria',    bg:'bg-mintbg',  border:'border-accent/25', tag_c:'text-accentDark', ibg:'bg-accent/20'   },
  { icon:GitBranch, title:'Dijkstra Gap Traversal', desc:'Shortest path on your gap subgraph. Only modules that matter, in the order they unlock.',                  tag:'adaptive pathing',bg:'bg-panel2',  border:'border-sky/30',    tag_c:'text-skyDark',    ibg:'bg-sky/20'      },
  { icon:Shield,    title:'Zero Hallucination',     desc:'Every recommendation validates against a locked course catalog before rendering.',                          tag:'15% criteria',    bg:'bg-lavbg',   border:'border-lavender/30',tag_c:'text-lavDark',   ibg:'bg-lavender/20' },
  { icon:Zap,       title:'Reasoning Trace',        desc:'Visible chain-of-thought per module — confidence score, prerequisite satisfaction, traversal logic.',       tag:'10% criteria',    bg:'bg-mintbg',  border:'border-accent/25', tag_c:'text-accentDark', ibg:'bg-accent/20'   },
]

const DEMO_ROLES = ['ML Engineer','Data Scientist','DevOps Engineer','Operations Lead']

export default function HomePage() {
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')

  useEffect(() => {
    let ci = 0, ri = 0, del = false, t
    const tick = () => {
      const cur = DEMO_ROLES[ri]
      if (!del) { setTyped(cur.slice(0, ci+1)); ci++; if (ci===cur.length){del=true;t=setTimeout(tick,1800);return} }
      else { setTyped(cur.slice(0, ci-1)); ci--; if (ci===0){del=false;ri=(ri+1)%DEMO_ROLES.length} }
      t = setTimeout(tick, del?40:70)
    }
    t = setTimeout(tick, 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-soft">

      {/* Gradient blobs */}
      <div className="fixed top-0 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10" style={{background:'rgba(52,211,153,0.08)'}} />
      <div className="fixed top-20 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10" style={{background:'rgba(56,189,248,0.08)'}} />
      <div className="fixed top-40 left-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-10" style={{background:'rgba(167,139,250,0.07)'}} />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-mintbg border border-accent/30 rounded-full mb-8 shadow-sm">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          <span className="text-accentDark text-xs font-mono tracking-widest uppercase">AI-Adaptive Onboarding Engine</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-800 leading-[1.05] tracking-tight mb-4 text-ink">
          Skip what you know.<br />
          <span className="text-gradient">Learn what you don't.</span>
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6 text-dim text-lg flex-wrap">
          <span>Your path to</span>
          <span className="inline-flex items-center px-3 py-1 bg-white border border-softborder rounded-lg font-mono text-ink min-w-[200px] justify-center shadow-sm">
            {typed}<span className="w-0.5 h-5 bg-accent ml-0.5 animate-pulse inline-block" />
          </span>
        </div>

        <p className="text-dim text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          WayPoint maps the exact gap between your skills and your target role — then builds the shortest learning path using a prerequisite dependency graph.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <button onClick={() => navigate('/upload')}
            className="group flex items-center justify-center gap-2 px-7 py-3.5 btn-gradient text-white font-display font-700 text-base rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            Analyze My Resume
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => navigate('/demo')}
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-softborder text-ink font-body text-base rounded-xl hover:border-accent/50 hover:shadow-sm transition-all"
          >
            See Live Demo <ChevronRight size={14} className="text-muted" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map(({ value, label, desc, bg, num }) => (
            <div key={label} className={`frosted rounded-xl p-5 text-left hover:shadow-md transition-all`}>
              <div className={`font-display text-3xl font-800 mb-1 ${num}`}>{value}</div>
              <div className="text-ink text-sm font-display font-700 mb-0.5">{label}</div>
              <div className="text-muted text-xs font-mono">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="frosted rounded-2xl p-6 shadow-sm overflow-x-auto">
          <div className="text-muted text-xs font-mono mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            WayPoint engine pipeline
          </div>
          <div className="flex items-center gap-2 min-w-max">
            {PIPELINE.map(({ label, sub, color }, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className={`font-mono text-sm font-700 ${color}`}>{label}</span>
                  <span className="text-muted text-xs">{sub}</span>
                </div>
                {i < PIPELINE.length-1 && <div className="flex items-center gap-1 text-muted mx-2"><div className="w-5 h-px bg-softborder"/><ArrowRight size={10}/></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-700 mb-3 text-ink">How it works</h2>
          <p className="text-dim text-base max-w-lg mx-auto">Three steps. No wasted time.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step:'01', title:'Upload resume + JD',  desc:'Paste or upload. Claude API extracts your current skills and target role requirements using O*NET taxonomy.',              bg:'bg-mintbg', border:'border-accent/25', sc:'text-accentDark', sbg:'bg-mintbg border-accent/20' },
            { step:'02', title:'Gap analysis runs',   desc:"Dijkstra's algorithm traverses the prerequisite DAG to find the minimum-cost path from your skills to role competency.", bg:'bg-panel2',  border:'border-sky/30',    sc:'text-skyDark',    sbg:'bg-panel2 border-sky/25'   },
            { step:'03', title:'Adaptive pathway',    desc:'Answer knowledge checks to auto-skip what you know. Every module shows its reasoning trace and confidence score.',        bg:'bg-lavbg',   border:'border-lavender/30',sc:'text-lavDark',    sbg:'bg-lavbg border-lavender/25'},
          ].map(({ step, title, desc, bg, border, sc, sbg }) => (
            <div key={step} className="frosted rounded-xl p-6 hover:shadow-md transition-all">
              <div className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-mono font-700 mb-4 ${sbg} ${sc}`}>{step}</div>
              <h3 className="font-display font-700 text-base mb-2 text-ink">{title}</h3>
              <p className="text-dim text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-700 mb-3 text-ink">Built different.</h2>
          <p className="text-dim text-base">Not keyword matching. Not cosine similarity. Actual graph intelligence.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map(({ icon:Icon, title, desc, tag, bg, border, tag_c, ibg }) => (
            <div key={title} className="frosted rounded-xl p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${ibg} flex items-center justify-center`}>
                  <Icon size={18} className="text-accentDark" />
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-lg border ${bg} ${border} ${tag_c}`}>{tag}</span>
              </div>
              <h3 className="font-display font-700 text-base mb-2 text-ink">{title}</h3>
              <p className="text-dim text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
