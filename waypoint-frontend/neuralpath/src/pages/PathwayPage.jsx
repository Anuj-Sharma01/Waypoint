import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, Clock, CheckCircle2, SkipForward, Trophy, ExternalLink } from 'lucide-react'

function SkillBadge({ label, variant='gap' }) {
  const s = {
    current: 'bg-mintbg text-accentDark border-accent/30',
    gap:     'bg-panel2 text-skyDark border-sky/30',
  }
  return <span className={`px-2 py-0.5 text-xs font-mono rounded-full border ${s[variant]}`}>{label}</span>
}

function ReasoningTrace({ module, open, onToggle }) {
  return (
    <div className="border border-softborder rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono text-muted hover:text-accentDark transition-colors bg-soft">
        <span>▶ trace: why this module?</span>
        {open ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
      </button>
      {open && (
        <div className="px-3 pb-3 text-xs font-mono space-y-1.5 border-t border-softborder bg-white">
          <div className="text-dim pt-2">confidence: <span className="text-accentDark font-700">{(module.confidence*100).toFixed(0)}%</span></div>
          <div className="text-dim">prereqs: <span className="text-ink">[{module.prereqs.join(', ')||'none'}]</span></div>
          <div className="text-dim">reason: <span className="text-ink">"{module.reason}"</span></div>
          {module.skipReason && <div className="text-dim">skip: <span className="text-skyDark">"{module.skipReason}"</span></div>}
        </div>
      )}
    </div>
  )
}

function KnowledgeCheck({ questions, answers, onAnswer }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-muted uppercase tracking-wider">Knowledge check — auto-skip if you know this</div>
      {questions.map((qobj, qi) => (
        <div key={qi} className="bg-soft border border-softborder rounded-xl p-3">
          <p className="text-sm text-ink mb-3 leading-relaxed">{qobj.q}</p>
          <div className="flex gap-2">
            <button onClick={() => onAnswer(qi,'yes')}
              className={`flex-1 py-2 rounded-lg border text-xs font-mono font-700 transition-all ${answers[qi]==='yes' ? 'bg-mintbg border-accent/40 text-accentDark' : 'border-softborder text-muted bg-white hover:border-accent/40 hover:text-accentDark'}`}
            >✓ Yes, I know this</button>
            <button onClick={() => onAnswer(qi,'no')}
              className={`flex-1 py-2 rounded-lg border text-xs font-mono font-700 transition-all ${answers[qi]==='no' ? 'bg-panel2 border-sky/40 text-skyDark' : 'border-softborder text-muted bg-white hover:border-sky/40 hover:text-skyDark'}`}
            >✗ Need to learn</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ModuleCard({ module, index, moduleState, onComplete, onSkip, onAnswer, onToggleExpand, onToggleTrace }) {
  const { done, skipped, expanded, traceOpen, answers } = moduleState
  const isFinished = done || skipped
  const questions = module.questions || [
    { q:`Have you used ${module.title} in a real project?`, weight:0.6 },
    { q:`Do you feel confident explaining ${module.title}?`, weight:0.4 },
  ]

  return (
    <div className={`frosted overflow-hidden transition-all duration-200 shadow-sm ${
      expanded ? 'border-accent/50 shadow-md' : isFinished ? 'border-softborder opacity-75' : 'border-softborder hover:border-accent/30 hover:shadow-md'
    }`}>
      <button onClick={onToggleExpand} className="w-full flex items-center gap-3 p-5 hover:bg-soft/60 transition-colors text-left">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
          done    ? 'bg-mintbg border-accent/50 text-accentDark'
          :skipped ? 'bg-panel2 border-sky/40 text-skyDark'
          :expanded? 'bg-mintbg border-accent/40 text-accentDark'
          :          'bg-soft border-softborder text-muted'
        }`}>
          {done?<CheckCircle2 size={17}/>:skipped?<SkipForward size={15}/>:<span className="text-xs font-mono font-700">{index+1}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-700 text-sm text-ink">{module.title}</span>
            {done    && <span className="text-xs font-mono text-accentDark border border-accent/30 bg-mintbg px-2 py-0.5 rounded-full">done</span>}
            {skipped && <span className="text-xs font-mono text-skyDark border border-sky/30 bg-panel2 px-2 py-0.5 rounded-full">skipped</span>}
            {/* ── Priority badge ── */}
            {module.priority && (
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                module.priority === 'PREREQUISITE' ? 'bg-soft border-softborder text-muted' :
                module.priority === 'CORE GAP'     ? 'bg-panel2 border-sky/30 text-skyDark' :
                module.priority === 'ADVANCED'     ? 'bg-lavbg border-lavender/30 text-lavDark' :
                'bg-mintbg border-accent/30 text-accentDark'
              }`}>{module.priority}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* ── Show provider from Coursera dataset ── */}
            <span className="text-xs font-mono text-muted">{module.course_provider || module.provider || 'Coursera'}</span>
            <span className="text-muted text-xs">·</span>
            <span className="flex items-center gap-1 text-xs font-mono text-muted"><Clock size={9}/> {module.duration}</span>
            {module.prereqs?.length > 0 && (
              <><span className="text-muted text-xs">·</span>
              <span className="text-xs font-mono text-muted">needs {module.prereqs.length} prereq{module.prereqs.length>1?'s':''}</span></>
            )}
          </div>
        </div>
        <ChevronDown size={14} className={`text-muted flex-shrink-0 transition-transform ${expanded?'rotate-180':''}`}/>
      </button>

      {expanded && (
        <div className="border-t border-softborder px-5 pb-5 space-y-4 pt-4">
          {skipped && <div className="flex items-center gap-2 bg-panel2 border border-sky/30 rounded-xl px-3 py-2.5"><SkipForward size={13} className="text-skyDark"/><span className="text-xs font-mono text-skyDark">Auto-skipped — you already know this material</span></div>}
          {done    && <div className="flex items-center gap-2 bg-mintbg border border-accent/30 rounded-xl px-3 py-2.5"><CheckCircle2 size={13} className="text-accentDark"/><span className="text-xs font-mono text-accentDark">Module completed — great work!</span></div>}

          {!isFinished && <KnowledgeCheck questions={questions} answers={answers} onAnswer={onAnswer}/>}

          {module.prereqs?.length > 0 && (
            <div>
              <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Requires first</div>
              <div className="flex gap-1.5 flex-wrap">
                {module.prereqs.map(p=><span key={p} className="text-xs font-mono text-dim bg-soft border border-softborder px-2 py-0.5 rounded-full">{p}</span>)}
              </div>
            </div>
          )}

          <ReasoningTrace module={module} open={traceOpen} onToggle={onToggleTrace}/>

          {/* ── Coursera course link ─────────────────────────────────────── */}
          {module.course_url && (
            <a
              href={module.course_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-4 py-3 bg-mintbg border border-accent/30 rounded-xl hover:bg-accent/15 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📚</span>
                <div>
                  <div className="text-xs font-mono font-700 text-accentDark">Start this module on Coursera</div>
                  <div className="text-xs font-mono text-muted truncate max-w-xs">{module.course_url.replace('https://','')}</div>
                </div>
              </div>
              <ExternalLink size={14} className="text-accentDark flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}

          {!isFinished && (
            <div className="flex gap-2 pt-1">
              <button onClick={onSkip} className="flex-1 py-2.5 border border-softborder text-muted text-xs font-mono rounded-xl bg-soft hover:border-sky/40 hover:text-skyDark transition-all">Skip (already know this)</button>
              <button onClick={onComplete} className="flex-1 py-2.5 btn-gradient text-white text-xs font-mono font-700 rounded-xl transition-all shadow-sm">Mark complete →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PathwayPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const result    = state?.result || JSON.parse(sessionStorage.getItem('waypoint_result') || 'null')
  const pathway   = result?.pathway || []

  const [moduleStates, setModuleStates] = useState(() =>
    Object.fromEntries(pathway.map((m,i) => [m.id, { done:false, skipped:false, expanded:i===0, traceOpen:false, answers:{} }]))
  )

  if (!result) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-muted mb-4">No analysis result found.</p>
      <button onClick={() => navigate('/upload')} className="text-accentDark underline text-sm">Go back to analyze</button>
    </div>
  )

  const completedCount = pathway.filter(m => moduleStates[m.id]?.done || moduleStates[m.id]?.skipped).length
  const progress       = Math.round((completedCount / pathway.length) * 100)
  const allDone        = completedCount === pathway.length
  const update         = (id, patch) => setModuleStates(prev => ({ ...prev, [id]:{ ...prev[id], ...patch } }))

  const handleAnswer = (moduleId, qi, val) => {
    const mod        = pathway.find(m => m.id === moduleId)
    const questions  = mod.questions || [{weight:0.6},{weight:0.4}]
    const newAnswers = { ...moduleStates[moduleId].answers, [qi]:val }
    const yesWeight  = questions.filter((_,i) => newAnswers[i]==='yes').reduce((s,q) => s+q.weight, 0)
    if (Object.keys(newAnswers).length === questions.length && yesWeight >= 0.8) {
      setTimeout(() => {
        update(moduleId, { answers:newAnswers, skipped:true })
        const idx = pathway.findIndex(m => m.id === moduleId)
        if (idx+1 < pathway.length) update(pathway[idx+1].id, { expanded:true })
      }, 350)
    }
    update(moduleId, { answers:newAnswers })
  }

  const handleComplete = (id) => {
    update(id, { done:true, expanded:false })
    const idx = pathway.findIndex(m => m.id === id)
    if (idx+1 < pathway.length) update(pathway[idx+1].id, { expanded:true })
  }

  const handleSkip = (id) => {
    update(id, { skipped:true, expanded:false })
    const idx = pathway.findIndex(m => m.id === id)
    if (idx+1 < pathway.length) update(pathway[idx+1].id, { expanded:true })
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 min-h-screen">
      <button onClick={() => navigate('/upload')} className="flex items-center gap-2 text-muted hover:text-ink text-sm mb-8 transition-colors">
        <ArrowLeft size={14}/> Back to Analyze
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="text-xs font-mono text-muted uppercase tracking-widest">Learning Pathway</span>
          <span className="px-3 py-0.5 bg-mintbg text-accentDark text-xs font-mono rounded-full border border-accent/30">{result.targetRole}</span>
          {result.timeSavedPct > 0 && (
            <span className="px-3 py-0.5 bg-panel2 text-skyDark text-xs font-mono rounded-full border border-sky/30">
              {result.timeSavedPct}% time saved vs standard track
            </span>
          )}
        </div>
        <h1 className="font-display text-4xl font-800 mb-1 text-ink">{pathway.length} modules to close the gap</h1>
        <p className="text-dim text-sm">Answer knowledge checks to auto-skip what you already know. Each module links to a real Coursera course.</p>
      </div>

      {allDone && (
        <div className="mb-8 bg-mintbg border border-accent/30 rounded-2xl p-6 text-center shadow-sm">
          <Trophy size={28} className="text-accentDark mx-auto mb-3"/>
          <h2 className="font-display font-700 text-xl text-ink mb-1">Pathway complete! 🎉</h2>
          <p className="text-dim text-sm mb-4">You've closed the gap to {result.targetRole}. Time to build something.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/certificate', { state: { result } })} className="px-5 py-2 btn-gradient text-white text-sm font-mono font-700 rounded-xl shadow-sm">Get Certificate 🎓</button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {/* Progress */}
          <div className="frosted rounded-2xl p-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Progress</span>
              <span className="text-xs font-mono text-accentDark font-700">{completedCount}/{pathway.length} complete</span>
            </div>
            <div className="h-3 bg-soft rounded-full overflow-hidden border border-softborder">
              <div className="h-full rounded-full transition-all duration-500 progress-gradient" style={{width:`${progress}%`}}/>
            </div>
            <div className="flex justify-between mt-2 text-xs font-mono text-muted">
              <span>0%</span>
              <span className={progress===100?'text-accentDark font-700':''}>{progress}%</span>
              <span>100%</span>
            </div>
          </div>

          {pathway.map((module, i) => (
            <ModuleCard key={module.id} module={module} index={i}
              moduleState={moduleStates[module.id]}
              onComplete={() => handleComplete(module.id)}
              onSkip={() => handleSkip(module.id)}
              onAnswer={(qi,val) => handleAnswer(module.id,qi,val)}
              onToggleExpand={() => update(module.id,{expanded:!moduleStates[module.id].expanded})}
              onToggleTrace={() => update(module.id,{traceOpen:!moduleStates[module.id].traceOpen})}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div>
          <div className="frosted rounded-2xl p-5 sticky top-24 shadow-sm">
            <h3 className="font-display font-700 text-sm mb-4 text-muted uppercase tracking-wider">Skill Map</h3>
            <div className="mb-4">
              <div className="text-xs font-mono text-muted mb-2 uppercase tracking-wider">You have</div>
              <div className="flex flex-wrap gap-1.5">{result.currentSkills?.map(s=><SkillBadge key={s} label={s} variant="current"/>)}</div>
            </div>
            <div className="mb-4 pt-4 border-t border-softborder">
              <div className="text-xs font-mono text-muted mb-2 uppercase tracking-wider">Gap skills</div>
              <div className="flex flex-wrap gap-1.5">{result.gapSkills?.map(s=><SkillBadge key={s} label={s} variant="gap"/>)}</div>
            </div>
            <div className="pt-4 border-t border-softborder space-y-2.5">
              {[
                { label:'Total modules',      val:pathway.length,                                        color:'text-ink'        },
                { label:'Total hours',        val:`${result.totalHours || '—'}h`,                        color:'text-skyDark'    },
                { label:'Time saved',         val:`${result.timeSavedPct || 0}%`,                        color:'text-accentDark' },
                { label:'Completed',          val:pathway.filter(m=>moduleStates[m.id]?.done).length,    color:'text-accentDark' },
                { label:'Skipped',            val:pathway.filter(m=>moduleStates[m.id]?.skipped).length, color:'text-skyDark'    },
                { label:'Hallucination rate', val:'0%',                                                  color:'text-lavDark'    },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between text-xs font-mono">
                  <span className="text-muted">{label}</span>
                  <span className={`font-700 ${color}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
