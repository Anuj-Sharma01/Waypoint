import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, FileText, TrendingUp, AlertCircle, CheckCircle2, Info } from 'lucide-react'

const MOCK_SCORES = {
  overall: 74,
  breakdown: [
    { label: 'Skills Relevance',    score: 82, max: 100, tip: 'Good match with common ML/Data roles. Add PyTorch, Docker, and MLOps to push this above 90.' },
    { label: 'Experience Depth',    score: 68, max: 100, tip: 'Projects are listed but lack measurable impact. Add numbers — "improved accuracy by 12%" beats "built a model".' },
    { label: 'Education & Certs',   score: 80, max: 100, tip: 'Solid foundation. A Kaggle competition or cloud cert (AWS/GCP) would add significant weight.' },
    { label: 'Keyword Density',     score: 71, max: 100, tip: 'Missing: "A/B testing", "feature engineering", "model deployment". Add these where true.' },
    { label: 'Structure & Clarity', score: 90, max: 100, tip: 'Clean, readable format. Recruiters can parse this in 6 seconds.' },
  ],
  strengths: ['Strong Python proficiency', 'SQL and data analysis experience', 'Clear resume structure'],
  gaps: ['No MLOps or deployment experience', 'Missing cloud platform skills', 'No measurable business impact in project descriptions'],
  verdict: 'Competitive for junior-mid data roles. One targeted upskill sprint away from senior ML positions.',
}

function ScoreRing({ score, size = 120 }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const pct = score / 100
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#38bdf8' : '#f9a070'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e0f2fe" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px`, fill: color, fontSize: '22px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}
      >{score}</text>
    </svg>
  )
}

export default function ResumeScorePage() {
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const handleScore = async () => {
    if (!resumeText.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 2200))
    setResult(MOCK_SCORES)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-700 text-ink mb-2">
          Resume <span className="text-gradient">Score</span>
        </h1>
        <p className="text-dim text-base">Paste your resume and get an AI score out of 100 with actionable feedback.</p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <textarea
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            placeholder="Paste your resume text here..."
            className="w-full frosted rounded-2xl p-5 text-sm text-ink placeholder:text-muted font-body focus:outline-none resize-none h-64 shadow-sm border border-softborder"
          />
          <button onClick={handleScore} disabled={loading || !resumeText.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 text-white font-display font-700 text-base rounded-xl transition-all disabled:opacity-40 shadow-lg btn-gradient"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" />Analyzing resume…</> : <>Score My Resume <TrendingUp size={18} /></>}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Overall score */}
          <div className="frosted rounded-2xl p-6 shadow-sm flex items-center gap-8 flex-wrap">
            <div className="flex flex-col items-center">
              <ScoreRing score={result.overall} size={120} />
              <div className="text-xs font-mono text-muted mt-2 uppercase tracking-wider">Overall Score</div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-display text-xl font-700 text-ink mb-2">
                {result.overall >= 80 ? 'Strong resume' : result.overall >= 60 ? 'Good foundation' : 'Needs work'}
              </div>
              <p className="text-dim text-sm leading-relaxed">{result.verdict}</p>
              <button onClick={() => navigate('/upload')}
                className="mt-4 flex items-center gap-2 px-4 py-2 btn-gradient text-white text-sm font-mono font-700 rounded-lg shadow-sm"
              >Close the gaps → <ArrowRight size={13} /></button>
            </div>
          </div>

          {/* Breakdown */}
          <div className="frosted rounded-2xl p-6 shadow-sm">
            <h3 className="font-display font-700 text-base text-ink mb-4">Score Breakdown</h3>
            <div className="space-y-4">
              {result.breakdown.map(({ label, score, tip }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-mono text-dim">{label}</span>
                    <span className={`text-sm font-mono font-700 ${score>=80?'text-accentDark':score>=60?'text-skyDark':'text-orange-500'}`}>{score}/100</span>
                  </div>
                  <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-softborder mb-1">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score}%`, background: score>=80?'linear-gradient(90deg,#34d399,#38bdf8)':score>=60?'linear-gradient(90deg,#38bdf8,#a78bfa)':'linear-gradient(90deg,#f9a070,#38bdf8)' }}
                    />
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Info size={10} className="text-muted mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted leading-relaxed">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & gaps */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="frosted rounded-2xl p-5 shadow-sm">
              <h3 className="font-display font-700 text-sm text-accentDark mb-3 flex items-center gap-2"><CheckCircle2 size={14}/> Strengths</h3>
              <ul className="space-y-2">
                {result.strengths.map(s => <li key={s} className="text-sm text-dim flex items-start gap-2"><span className="text-accent mt-0.5">✓</span>{s}</li>)}
              </ul>
            </div>
            <div className="frosted rounded-2xl p-5 shadow-sm">
              <h3 className="font-display font-700 text-sm text-orange-500 mb-3 flex items-center gap-2"><AlertCircle size={14}/> Gaps to Fix</h3>
              <ul className="space-y-2">
                {result.gaps.map(g => <li key={g} className="text-sm text-dim flex items-start gap-2"><span className="text-orange-400 mt-0.5">→</span>{g}</li>)}
              </ul>
            </div>
          </div>

          <button onClick={() => setResult(null)} className="text-sm text-muted hover:text-ink font-mono underline transition-colors">Score another resume</button>
        </div>
      )}
    </div>
  )
}
