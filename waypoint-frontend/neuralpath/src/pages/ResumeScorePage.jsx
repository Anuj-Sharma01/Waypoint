import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, TrendingUp, AlertCircle, CheckCircle2, Info, Upload } from 'lucide-react'
import { scoreResume } from '../api'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px`, fill: color, fontSize: '22px', fontWeight: 700 }}
      >{score}</text>
    </svg>
  )
}

export default function ResumeScorePage() {
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText]         = useState('')
  const [pdfFile, setPdfFile]       = useState(null)
  const [fileName, setFileName]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState('')
  const fileRef  = useRef()
  const navigate = useNavigate()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    if (file.name.endsWith('.pdf')) {
      setPdfFile(file)
      setResumeText('')
    } else {
      setPdfFile(null)
      const reader = new FileReader()
      reader.onload = (ev) => setResumeText(ev.target.result)
      reader.readAsText(file)
    }
  }

  const handleScore = async () => {
    if (!pdfFile && !resumeText.trim()) return
    setLoading(true)
    setError('')
    try {
      let resumeContent = resumeText

      if (pdfFile) {
        // Extract text from PDF via backend
        const formData = new FormData()
        formData.append('file', pdfFile)
        formData.append('target_role', 'General')
        const extractRes = await fetch(`${BASE_URL}/extract`, {
          method: 'POST',
          body: formData,
        })
        if (!extractRes.ok) throw new Error('PDF extraction failed')
        const extractData = await extractRes.json()
        resumeContent = extractData.skills?.map(s => `${s.name} (${s.proficiency})`).join(', ') || 'PDF uploaded'
      }

      const data = await scoreResume(resumeContent, jdText)

      setResult({
        overall:     data.ats_score,
        overallTen:  data.overall_score,
        breakdown: [
          { label: 'Keyword Match',   score: data.ats_score,                                      tip: `${data.keywords_found}/${data.keywords_total} keywords matched from job description.` },
          { label: 'Skills Coverage', score: Math.min(100, Math.round(data.overall_score * 10)),  tip: data.improvements[0] || 'Good skills coverage.' },
          { label: 'Content Quality', score: Math.min(100, Math.round(data.overall_score * 9.5)), tip: data.strengths[0]    || 'Strong content.' },
        ],
        strengths: data.strengths,
        gaps:      data.improvements,
        keywords:  data.keyword_matches,
        verdict:   data.overall_score >= 8 ? 'Strong resume — well aligned with the role.'
                 : data.overall_score >= 6 ? 'Good foundation — a few targeted improvements will make this stand out.'
                 : 'Needs work — focus on the gaps below to improve your match rate.',
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-700 text-ink mb-2">
          Resume <span className="text-gradient">Score</span>
        </h1>
        <p className="text-dim text-base">Upload or paste your resume to get an AI score with keyword matching and ATS analysis.</p>
      </div>

      {!result ? (
        <div className="space-y-4">
          {/* File upload */}
          <div
            onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-softborder rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-accent/60 transition-colors bg-white"
          >
            <Upload size={16} className="text-muted" />
            <span className="text-dim text-sm">{fileName || 'Upload PDF or TXT resume'}</span>
            <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFile} />
          </div>

          {/* Text paste */}
          {!pdfFile && (
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="...or paste your resume text here"
              className="w-full frosted rounded-2xl p-5 text-sm text-ink placeholder:text-muted font-body focus:outline-none resize-none h-48 shadow-sm border border-softborder"
            />
          )}
          {pdfFile && (
            <div className="frosted rounded-xl p-4 text-sm text-accentDark font-mono flex items-center gap-2 border border-softborder">
              ✅ {pdfFile.name} ready to score
              <button onClick={() => { setPdfFile(null); setFileName(null) }} className="ml-auto text-muted hover:text-ink text-xs">✕ remove</button>
            </div>
          )}

          {/* Optional JD */}
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Optional: paste the job description for keyword matching..."
            className="w-full frosted rounded-2xl p-5 text-sm text-ink placeholder:text-muted font-body focus:outline-none resize-none h-28 shadow-sm border border-softborder"
          />

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle size={14}/>{error}
            </div>
          )}

          <button
            onClick={handleScore}
            disabled={loading || (!pdfFile && !resumeText.trim())}
            style={{ background: 'linear-gradient(135deg, #059669, #0369a1)' }}
            className="w-full flex items-center justify-center gap-2 py-4 text-white font-display font-700 text-base rounded-xl transition-all disabled:opacity-40 shadow-lg"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin"/>Analyzing resume…</>
              : <>Score My Resume <TrendingUp size={18}/></>
            }
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Scores */}
          <div className="frosted rounded-2xl p-6 shadow-sm flex items-center gap-8 flex-wrap">
            <div className="flex flex-col items-center">
              <ScoreRing score={result.overall} size={120}/>
              <div className="text-xs font-mono text-muted mt-2 uppercase tracking-wider">ATS Score</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-5xl font-display font-800" style={{color:'#34d399'}}>
                {result.overallTen}<span className="text-2xl text-muted">/10</span>
              </div>
              <div className="text-xs font-mono text-muted mt-2 uppercase tracking-wider">Overall Score</div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-display text-xl font-700 text-ink mb-2">
                {result.overall >= 80 ? 'Strong resume' : result.overall >= 60 ? 'Good foundation' : 'Needs work'}
              </div>
              <p className="text-dim text-sm leading-relaxed">{result.verdict}</p>
              <button onClick={() => navigate('/upload')}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-white text-sm font-mono font-700 rounded-lg shadow-sm"
                style={{ background: 'linear-gradient(135deg, #059669, #0369a1)' }}
              >
                Close the gaps → <ArrowRight size={13}/>
              </button>
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
                      style={{ width:`${score}%`, background: score>=80?'linear-gradient(90deg,#34d399,#38bdf8)':score>=60?'linear-gradient(90deg,#38bdf8,#a78bfa)':'linear-gradient(90deg,#f9a070,#38bdf8)' }}
                    />
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Info size={10} className="text-muted mt-0.5 flex-shrink-0"/>
                    <p className="text-xs text-muted leading-relaxed">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          {result.keywords && result.keywords.length > 0 && (
            <div className="frosted rounded-2xl p-6 shadow-sm">
              <h3 className="font-display font-700 text-base text-ink mb-4">Keyword Analysis</h3>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map(k => (
                  <span key={k.keyword} className={`px-2.5 py-1 rounded-full text-xs font-mono border ${k.found ? 'bg-mintbg border-accent/30 text-accentDark' : 'bg-red-50 border-red-200 text-red-500'}`}>
                    {k.found ? '✓' : '✗'} {k.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Gaps */}
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

          <button onClick={() => { setResult(null); setPdfFile(null); setFileName(null); setResumeText('') }}
            className="text-sm text-muted hover:text-ink font-mono underline transition-colors"
          >
            Score another resume
          </button>
        </div>
      )}
    </div>
  )
}
