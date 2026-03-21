import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Briefcase, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

const MOCK_RESULT = {
  name: 'Demo User', targetRole: 'ML Engineer',
  currentSkills: ['Python', 'SQL', 'Data Analysis', 'Excel', 'Statistics'],
  gapSkills: ['PyTorch', 'MLOps', 'Docker', 'LLM Fine-tuning', 'Feature Engineering'],
  pathway: [
    { id:1, title:'PyTorch Fundamentals',        provider:'Fast.ai',        duration:'12h', prereqs:[],                                                             reason:'Foundational tensor ops required before MLOps tooling.',                    confidence:0.94, questions:[{q:'Have you built a neural network from scratch in PyTorch?',weight:.6},{q:'Do you understand autograd and backpropagation in code?',weight:.4}] },
    { id:2, title:'Feature Engineering',          provider:'Kaggle',         duration:'6h',  prereqs:['PyTorch Fundamentals'],                                       reason:'Bridges existing Statistics skill to model-ready inputs.',                   confidence:0.91, questions:[{q:'Can you explain target encoding and when to use it?',weight:.5},{q:'Have you handled missing data in a real project?',weight:.5}] },
    { id:3, title:'Docker for Data Scientists',   provider:'DataCamp',       duration:'8h',  prereqs:['PyTorch Fundamentals'],                                       reason:'Prerequisite for all MLOps pipeline construction.',                         confidence:0.89, questions:[{q:'Have you written a Dockerfile for a Python ML project?',weight:.6},{q:'Do you know how Docker Compose volumes work?',weight:.4}] },
    { id:4, title:'MLOps Zoomcamp',               provider:'DataTalks.Club', duration:'20h', prereqs:['Docker for Data Scientists','Feature Engineering'],           reason:'Combines all prior skills into a production deployment workflow.',           confidence:0.87, questions:[{q:'Have you set up experiment tracking with MLflow?',weight:.5},{q:'Can you explain model versioning and deployment pipelines?',weight:.5}] },
  ],
}

export default function UploadPage() {
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const fileRef = useRef()
  const navigate = useNavigate()

  const handleFileDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (!file) return
    setResumeFile(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => setResumeText(ev.target.result)
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    if (!resumeText.trim() || !jdText.trim()) { setError('Please provide both a resume and a job description.'); return }
    setError(''); setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 2000))
      navigate('/pathway', { state: { result: MOCK_RESULT } })
    } catch (err) { setError(err.message || 'Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-800 mb-3 text-ink">
          Analyze your <span className="text-gradient">skill gap</span>
        </h1>
        <p className="text-dim text-base">Paste your resume and the target job description. WayPoint will extract competencies and compute the shortest learning path.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-mono text-muted uppercase tracking-wider">
            <FileText size={12} className="text-accentDark" /> Resume
          </label>
          <div onClick={() => fileRef.current.click()} onDrop={handleFileDrop} onDragOver={e => e.preventDefault()}
            className="group border-2 border-dashed border-softborder rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-accent/60 transition-colors bg-white mb-2"
          >
            <Upload size={16} className="text-muted group-hover:text-accentDark transition-colors" />
            <span className="text-dim text-sm">{resumeFile || 'Drop PDF/TXT or click to upload'}</span>
            <input ref={fileRef} type="file" accept=".txt,.pdf" className="hidden" onChange={handleFileDrop} />
          </div>
          <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="...or paste resume text here"
            className="flex-1 frosted rounded-xl p-4 text-sm text-ink placeholder:text-muted font-body focus:outline-none focus:border-accent/50 resize-none min-h-60 shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-mono text-muted uppercase tracking-wider">
            <Briefcase size={12} className="text-skyDark" /> Job Description
          </label>
          <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste the target job description here..."
            className="flex-1 frosted rounded-xl p-4 text-sm text-ink placeholder:text-muted font-body focus:outline-none focus:border-sky/50 resize-none min-h-72 shadow-sm"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-accentDark text-sm bg-mintbg border border-softborder rounded-xl p-3 mb-4">
          <AlertCircle size={14} />{error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 btn-gradient text-white font-display font-700 text-base rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" />Analyzing skill graph…</> : <>Generate Learning Pathway <ArrowRight size={18} /></>}
      </button>
    </div>
  )
}
