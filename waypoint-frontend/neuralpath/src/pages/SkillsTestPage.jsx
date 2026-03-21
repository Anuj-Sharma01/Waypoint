// SkillsTestPage.jsx — Adaptive skill assessment
// Questions are generated one at a time by Grok/AI.
// Difficulty increases/decreases based on your answers.
// No fixed question count — test ends when confidence is established.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain, CheckCircle2, XCircle, AlertCircle, ArrowLeft,
  Loader2, Zap, BookOpen, RotateCcw, TrendingUp, Target
} from 'lucide-react'
import { generateNextAdaptiveQuestion } from '../api'

// ─── Read real skills from stored gap analysis ────────────────────────────────
function getAnalysisSkills() {
  try {
    const raw = sessionStorage.getItem('waypoint_result')
    if (!raw) return null
    const r = JSON.parse(raw)
    return {
      targetRole:    r.targetRole    || null,
      gapSkills:     r.gapSkills     || [],
      currentSkills: r.currentSkills || [],
      partialSkills: r.partialSkills || [],
      moduleTitles:  (r.pathway || []).map(m => m.title),
    }
  } catch { return null }
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────
function DiffBadge({ level }) {
  const map = {
    easy:   'bg-mintbg border-accent/30 text-accentDark',
    medium: 'bg-panel2 border-sky/30 text-skyDark',
    hard:   'bg-lavbg border-lavender/30 text-lavDark',
    expert: 'bg-red-50 border-red-300 text-red-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-mono border ${map[level] || map.medium}`}>
      {level}
    </span>
  )
}

// ─── Skill pill ───────────────────────────────────────────────────────────────
function SkillPill({ label, variant = 'module', onClick }) {
  const s = {
    gap:     'bg-panel2 border-sky/40 text-skyDark hover:bg-sky/20',
    current: 'bg-mintbg border-accent/40 text-accentDark hover:bg-accent/20',
    partial: 'bg-lavbg border-lavender/40 text-lavDark hover:bg-lavender/20',
    module:  'bg-white border-softborder text-dim hover:border-accent/30 hover:text-ink',
  }
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-mono font-600 border transition-all ${s[variant]}`}>
      {label}
    </button>
  )
}

// ─── Single question display ──────────────────────────────────────────────────
function QuestionCard({ question, questionNum, totalAnswered, onAnswer, answered }) {
  const { text, options, correct, explanation, difficulty } = question
  const selected = answered?.selected
  const isCorrect = selected !== undefined && selected === correct

  return (
    <div className="frosted rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-softborder">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted">Q{questionNum}</span>
          <DiffBadge level={difficulty} />
        </div>
        <span className="text-xs font-mono text-muted">{totalAnswered} answered so far</span>
      </div>
      <div className="p-5">
        <p className="text-sm text-ink leading-relaxed mb-4">{text}</p>
        <div className="grid grid-cols-1 gap-2">
          {options.map((opt, oi) => {
            let cls = 'border-softborder bg-white text-dim hover:border-accent/30 hover:text-ink cursor-pointer'
            if (selected !== undefined) {
              if (oi === correct) cls = 'border-accent/60 bg-mintbg text-accentDark cursor-default'
              else if (oi === selected) cls = 'border-red-300 bg-red-50 text-red-700 cursor-default'
              else cls = 'border-softborder bg-white/40 text-muted cursor-default'
            }
            return (
              <button
                key={oi}
                disabled={selected !== undefined}
                onClick={() => onAnswer(oi)}
                className={`text-left px-4 py-3 rounded-xl border text-xs font-mono transition-all ${cls}`}
              >
                <span className="font-700 mr-2 text-muted">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            )
          })}
        </div>
        {selected !== undefined && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-mono flex gap-2 ${isCorrect ? 'bg-mintbg border border-accent/30 text-accentDark' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {isCorrect ? <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" /> : <XCircle size={13} className="flex-shrink-0 mt-0.5" />}
            <span>{explanation}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Progress & score bar ─────────────────────────────────────────────────────
function ProgressBar({ history }) {
  if (!history.length) return null
  const correct = history.filter(h => h.correct).length
  const pct = Math.round((correct / history.length) * 100)
  return (
    <div className="frosted rounded-xl p-4 shadow-sm mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-dim">{correct}/{history.length} correct</span>
          <span className="text-xs font-mono text-muted">·</span>
          <span className="text-xs font-mono text-dim">current difficulty: <span className="text-accentDark font-600">{history[history.length-1]?.difficulty || '—'}</span></span>
        </div>
        <span className="text-xs font-mono font-700 text-ink">{pct}%</span>
      </div>
      <div className="w-full bg-soft rounded-full h-1.5">
        <div className="progress-gradient h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {/* Answer trail */}
      <div className="flex gap-1 mt-2 flex-wrap">
        {history.map((h, i) => (
          <div key={i} title={`Q${i+1}: ${h.difficulty}`}
            className={`w-4 h-1.5 rounded-full ${h.correct ? 'bg-accent' : 'bg-red-400'}`} />
        ))}
      </div>
    </div>
  )
}

// ─── Final results ────────────────────────────────────────────────────────────
function Results({ skill, history, onRetry, onPickAnother }) {
  const correct = history.filter(h => h.correct).length
  const total = history.length
  const pct = Math.round((correct / total) * 100)

  const byDiff = { easy: {c:0,t:0}, medium: {c:0,t:0}, hard: {c:0,t:0}, expert: {c:0,t:0} }
  history.forEach(h => {
    if (!byDiff[h.difficulty]) byDiff[h.difficulty] = {c:0,t:0}
    byDiff[h.difficulty].t++
    if (h.correct) byDiff[h.difficulty].c++
  })

  const grade = pct >= 85 ? 'Expert' : pct >= 70 ? 'Proficient' : pct >= 50 ? 'Developing' : 'Beginner'
  const gradeBg = pct >= 85
    ? 'bg-mintbg border-accent/30 text-accentDark'
    : pct >= 70 ? 'bg-panel2 border-sky/30 text-skyDark'
    : pct >= 50 ? 'bg-lavbg border-lavender/30 text-lavDark'
    : 'bg-red-50 border-red-200 text-red-600'

  return (
    <div className="frosted rounded-2xl p-6 shadow-md">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono font-700 border mb-3 ${gradeBg}`}>
          {pct >= 70 ? <CheckCircle2 size={14}/> : pct >= 50 ? <AlertCircle size={14}/> : <XCircle size={14}/>}
          {grade}
        </div>
        <div className="text-5xl font-display font-800 text-ink mb-1">{pct}%</div>
        <p className="text-sm text-dim">{correct} / {total} correct on <span className="text-accentDark font-600">{skill}</span></p>
      </div>

      <div className="w-full bg-soft rounded-full h-2 mb-6">
        <div className="progress-gradient h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>

      {/* Breakdown by difficulty */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {Object.entries(byDiff).filter(([,v]) => v.t > 0).map(([diff, v]) => (
          <div key={diff} className="bg-soft border border-softborder rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <DiffBadge level={diff} />
              <span className="text-xs font-mono text-dim">{v.c}/{v.t}</span>
            </div>
            <div className="w-full bg-softborder/50 rounded-full h-1">
              <div className={`h-1 rounded-full ${v.c/v.t > 0.6 ? 'bg-accent' : 'bg-red-400'}`}
                style={{ width: `${(v.c/v.t)*100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-softborder rounded-xl text-xs font-mono text-dim hover:text-ink hover:border-accent/30 transition-all">
          <RotateCcw size={12}/> Retry
        </button>
        <button onClick={onPickAnother} className="flex-1 py-2.5 btn-gradient text-white text-xs font-mono font-700 rounded-xl shadow-sm">
          Test Another Skill →
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
// Adaptive test logic:
// - Starts at 'easy'
// - 2 correct in a row → bump up difficulty
// - 2 wrong in a row → drop difficulty
// - Min 8 questions, max 20
// - Ends early when: ≥12 questions AND confidence locked (≥4 at same level with >80% or <30%)

const MIN_Q = 8
const MAX_Q = 20

export default function SkillsTestPage() {
  const navigate = useNavigate()

  // Test state
  const [skill, setSkill] = useState(null)
  const [currentQ, setCurrentQ] = useState(null)       // current question object
  const [questionNum, setQuestionNum] = useState(0)
  const [history, setHistory] = useState([])            // [{correct, difficulty}]
  const [answered, setAnswered] = useState(null)        // {selected} for current Q
  const [difficulty, setDifficulty] = useState('easy')
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)
  const [consecutiveWrong, setConsecutiveWrong] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingNext, setLoadingNext] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const analysis = getAnalysisSkills()
  const hasAnalysis = analysis && (
    analysis.gapSkills.length > 0 ||
    analysis.currentSkills.length > 0 ||
    analysis.moduleTitles.length > 0
  )

  // ── Fetch next question from AI ─────────────────────────────────────────────
  const fetchQuestion = async (skill, diff, hist, qNum, isFirst = false) => {
    if (isFirst) setLoading(true)
    else setLoadingNext(true)
    setError(null)
    try {
      const q = await generateNextAdaptiveQuestion({ skill, difficulty: diff, history: hist, questionNumber: qNum })
      setCurrentQ(q)
      setAnswered(null)
    } catch (e) {
      setError(e.message || 'Failed to generate question.')
    } finally {
      setLoading(false)
      setLoadingNext(false)
    }
  }

  // ── Start a test ─────────────────────────────────────────────────────────────
  const startTest = async (s) => {
    setSkill(s)
    setHistory([])
    setQuestionNum(1)
    setDifficulty('easy')
    setConsecutiveCorrect(0)
    setConsecutiveWrong(0)
    setDone(false)
    setCurrentQ(null)
    await fetchQuestion(s, 'easy', [], 1, true)
  }

  // ── Answer a question ─────────────────────────────────────────────────────────
  const handleAnswer = async (selectedIdx) => {
    if (!currentQ || answered !== null) return
    setAnswered({ selected: selectedIdx })

    const isCorrect = selectedIdx === currentQ.correct
    const newHistory = [...history, { correct: isCorrect, difficulty, questionText: currentQ.text }]
    setHistory(newHistory)

    // Adaptive difficulty
    let newCC = isCorrect ? consecutiveCorrect + 1 : 0
    let newCW = isCorrect ? 0 : consecutiveWrong + 1
    let newDiff = difficulty

    const LEVELS = ['easy', 'medium', 'hard', 'expert']
    const currIdx = LEVELS.indexOf(difficulty)

    if (newCC >= 2 && currIdx < LEVELS.length - 1) {
      newDiff = LEVELS[currIdx + 1]
      newCC = 0
    } else if (newCW >= 2 && currIdx > 0) {
      newDiff = LEVELS[currIdx - 1]
      newCW = 0
    }

    setConsecutiveCorrect(newCC)
    setConsecutiveWrong(newCW)
    setDifficulty(newDiff)

    // Check if test should end
    const nextNum = questionNum + 1
    const shouldEnd = nextNum > MAX_Q || (
      nextNum > MIN_Q && isConfidenceLocked(newHistory, newDiff)
    )

    if (shouldEnd) {
      setTimeout(() => setDone(true), 1200)
    } else {
      // Wait 1.2s so user sees the explanation, then load next
      setTimeout(async () => {
        setQuestionNum(nextNum)
        await fetchQuestion(skill, newDiff, newHistory, nextNum)
      }, 1200)
    }
  }

  const resetTest = () => {
    setSkill(null)
    setCurrentQ(null)
    setHistory([])
    setQuestionNum(0)
    setDifficulty('easy')
    setDone(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-soft">
      <div className="fixed top-0 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'rgba(52,211,153,0.07)' }} />
      <div className="fixed top-20 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'rgba(167,139,250,0.07)' }} />

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <button onClick={() => skill ? resetTest() : navigate(-1)} className="flex items-center gap-2 text-xs font-mono text-dim hover:text-ink mb-6 transition-colors">
            <ArrowLeft size={13}/> {skill ? 'Choose different skill' : 'Back'}
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Brain size={16} className="text-accentDark"/>
            </div>
            <div>
              <h1 className="font-display font-800 text-2xl text-ink tracking-tight">Adaptive Skill Test</h1>
              <p className="text-xs font-mono text-dim">AI-powered · difficulty adjusts to your answers · {MIN_Q}–{MAX_Q} questions</p>
            </div>
          </div>
          {!skill && (
            <p className="text-sm text-dim leading-relaxed mt-3 max-w-xl">
              The test starts easy and gets harder as you answer correctly — or easier if you struggle. It ends when the AI has enough data to accurately assess your level.
            </p>
          )}
        </div>

        {/* ── Skill picker ── */}
        {!skill && (
          <div className="space-y-5">
            {hasAnalysis ? (
              <>
                {analysis.gapSkills.length > 0 && (
                  <div className="frosted rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-sky-400"/>
                      <span className="text-xs font-mono text-muted uppercase tracking-widest">Skills to learn</span>
                      <span className="text-xs font-mono text-muted">— test your starting point</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.gapSkills.map(s => <SkillPill key={s} label={s} variant="gap" onClick={() => startTest(s)}/>)}
                    </div>
                  </div>
                )}
                {analysis.partialSkills.length > 0 && (
                  <div className="frosted rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-lavender"/>
                      <span className="text-xs font-mono text-muted uppercase tracking-widest">Partial skills</span>
                      <span className="text-xs font-mono text-muted">— find exactly where you stand</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.partialSkills.map(s => <SkillPill key={s} label={s} variant="partial" onClick={() => startTest(s)}/>)}
                    </div>
                  </div>
                )}
                {analysis.currentSkills.length > 0 && (
                  <div className="frosted rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-accent"/>
                      <span className="text-xs font-mono text-muted uppercase tracking-widest">Your current skills</span>
                      <span className="text-xs font-mono text-muted">— verify your level</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.currentSkills.map(s => <SkillPill key={s} label={s} variant="current" onClick={() => startTest(s)}/>)}
                    </div>
                  </div>
                )}
                {analysis.moduleTitles.length > 0 && (
                  <div className="frosted rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-muted"/>
                      <span className="text-xs font-mono text-muted uppercase tracking-widest">Your learning modules</span>
                      <span className="text-xs font-mono text-muted">— test before you start</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.moduleTitles.map(s => <SkillPill key={s} label={s} variant="module" onClick={() => startTest(s)}/>)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="frosted rounded-2xl p-5 shadow-sm border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Zap size={15} className="text-accentDark flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-700 text-ink mb-1">Get personalised skill tests</p>
                      <p className="text-xs font-mono text-dim mb-3">Run a resume gap analysis and your exact skills appear here automatically.</p>
                      <button onClick={() => navigate('/upload')} className="px-4 py-2 btn-gradient text-white text-xs font-mono font-700 rounded-lg shadow-sm">
                        Analyse my resume →
                      </button>
                    </div>
                  </div>
                </div>
                <div className="frosted rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={13} className="text-muted"/>
                    <span className="text-xs font-mono text-muted uppercase tracking-widest">Common skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FALLBACK_SKILLS.map(s => <SkillPill key={s} label={s} variant="module" onClick={() => startTest(s)}/>)}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Test in progress ── */}
        {skill && !done && (
          <div>
            {/* Skill + progress header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-dim">Testing: </span>
                <span className="text-xs font-mono font-700 text-accentDark">{skill}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={12} className="text-muted"/>
                <span className="text-xs font-mono text-muted">adaptive</span>
              </div>
            </div>

            <ProgressBar history={history}/>

            {/* Loading first question */}
            {loading && (
              <div className="frosted rounded-2xl p-12 text-center shadow-sm">
                <Loader2 size={24} className="text-accentDark animate-spin mx-auto mb-3"/>
                <p className="font-display font-700 text-ink mb-1">Building your test…</p>
                <p className="text-xs font-mono text-dim">Starting with an easy question on <span className="text-accentDark">{skill}</span></p>
              </div>
            )}

            {/* Active question */}
            {!loading && currentQ && (
              <div>
                <QuestionCard
                  question={currentQ}
                  questionNum={questionNum}
                  totalAnswered={history.length}
                  answered={answered}
                  onAnswer={handleAnswer}
                />
                {/* Loading next */}
                {loadingNext && (
                  <div className="flex items-center gap-2 mt-4 text-xs font-mono text-dim">
                    <Loader2 size={12} className="animate-spin text-accentDark"/>
                    Generating next question…
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="frosted rounded-2xl p-5 shadow-sm border border-red-200 mt-4">
                <div className="flex items-start gap-3">
                  <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-sm font-700 text-ink mb-1">Couldn't load question</p>
                    <p className="text-xs font-mono text-dim mb-3">{error}</p>
                    <button onClick={() => fetchQuestion(skill, difficulty, history, questionNum)}
                      className="text-xs font-mono text-accentDark hover:underline">Retry →</button>
                  </div>
                </div>
              </div>
            )}

            {/* End test early option */}
            {history.length >= MIN_Q && !loadingNext && !loading && (
              <div className="mt-5 text-center">
                <button onClick={() => setDone(true)} className="text-xs font-mono text-dim hover:text-ink transition-colors underline underline-offset-2">
                  End test & see results
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {done && skill && (
          <Results
            skill={skill}
            history={history}
            onRetry={() => startTest(skill)}
            onPickAnother={resetTest}
          />
        )}
      </div>
    </div>
  )
}

// Confidence is "locked" when the last 4 answers at the same difficulty level
// show clearly above 80% or below 30% accuracy
function isConfidenceLocked(history, currentDiff) {
  const recent = history.slice(-4).filter(h => h.difficulty === currentDiff)
  if (recent.length < 4) return false
  const rate = recent.filter(h => h.correct).length / recent.length
  return rate >= 0.8 || rate <= 0.3
}

const FALLBACK_SKILLS = [
  'Python', 'Machine Learning', 'SQL', 'React', 'Docker',
  'AWS', 'System Design', 'Statistics', 'Git', 'TypeScript',
  'Deep Learning', 'REST APIs', 'CI/CD', 'Kubernetes', 'Prompt Engineering',
]
