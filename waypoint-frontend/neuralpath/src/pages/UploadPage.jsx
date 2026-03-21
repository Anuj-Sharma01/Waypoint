import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Briefcase, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const LOADING_MESSAGES = [
  'Extracting skills from resume…',
  'Building prerequisite graph…',
  'Running Dijkstra gap traversal…',
  'Grounding modules to catalog…',
  'Generating reasoning traces…',
]

function extractRoleFromJD(jdText) {
  if (!jdText || !jdText.trim()) return 'Software Engineer'
  const lines = jdText.trim().split('\n').filter(l => l.trim())
  for (const line of lines.slice(0, 5)) {
    const clean = line.trim()
    const lower = clean.toLowerCase()
    if (lower.includes('role:') || lower.includes('position:') || lower.includes('title:')) {
      const after = clean.split(':')[1]?.trim()
      if (after) return after
    }
    if (clean.length < 60 && !clean.includes('.') && !clean.includes(',')) {
      return clean
    }
  }
  return lines[0]?.trim().slice(0, 60) || 'Software Engineer'
}

export default function UploadPage() {
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [pdfFile, setPdfFile]       = useState(null)
  const [loadingMsg, setLoadingMsg] = useState('')
  const fileRef  = useRef()
  const navigate = useNavigate()

  const handleFileDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (!file) return
    setResumeFile(file.name)

    if (file.name.endsWith('.pdf')) {
      // Store PDF file for backend upload
      setPdfFile(file)
      setResumeText('') // clear text box
    } else {
      // Read TXT file directly
      setPdfFile(null)
      const reader = new FileReader()
      reader.onload = (ev) => setResumeText(ev.target.result)
      reader.readAsText(file)
    }
  }

  const handleSubmit = async () => {
    if (!pdfFile && !resumeText.trim()) { setError('Please provide your resume (PDF upload or paste text).'); return }
    if (!jdText.trim()) { setError('Please provide the job description.'); return }
    setError('')
    setLoading(true)

    let msgIdx = 0
    setLoadingMsg(LOADING_MESSAGES[0])
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[msgIdx])
    }, 1800)

    try {
      const targetRole = extractRoleFromJD(jdText)
      let result

      if (pdfFile) {
        // Send PDF as multipart form
        const formData = new FormData()
        formData.append('file', pdfFile)
        formData.append('target_role', targetRole)
        formData.append('job_description', jdText)

        const res = await fetch(`${BASE_URL}/pathway`, {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
        const data = await res.json()
        result = transformResponse(data)
      } else {
        // Send plain text
        const res = await fetch(`${BASE_URL}/pathway/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_text:     resumeText,
            target_role:     targetRole,
            job_description: jdText,
          }),
        })
        if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
        const data = await res.json()
        result = transformResponse(data)
      }

      clearInterval(msgInterval)
      navigate('/pathway', { state: { result } })
    } catch (err) {
      clearInterval(msgInterval)
      setError(err.message || 'Something went wrong. Is the backend running?')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-800 mb-3 text-ink">
          Analyze your <span className="text-gradient">skill gap</span>
        </h1>
        <p className="text-dim text-base">
          Upload your resume and paste the job description. Waypoint will compute your shortest learning path.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-mono text-muted uppercase tracking-wider">
            <FileText size={12} className="text-accentDark" /> Resume
          </label>
          <div
            onClick={() => fileRef.current.click()}
            onDrop={handleFileDrop}
            onDragOver={e => e.preventDefault()}
            className="group border-2 border-dashed border-softborder rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-accent/60 transition-colors bg-white mb-2"
          >
            <Upload size={16} className="text-muted group-hover:text-accentDark transition-colors" />
            <span className="text-dim text-sm">{resumeFile || 'Drop PDF or TXT or click to upload'}</span>
            <input ref={fileRef} type="file" accept=".txt,.pdf" className="hidden" onChange={handleFileDrop} />
          </div>
          {pdfFile ? (
            <div className="frosted rounded-xl p-4 text-sm text-accentDark font-mono flex items-center gap-2">
              ✅ {pdfFile.name} ready to upload
            </div>
          ) : (
            <textarea
              value={resumeText}
              onChange={e => { setResumeText(e.target.value); setPdfFile(null); setResumeFile(null) }}
              placeholder="...or paste resume text here"
              className="flex-1 frosted rounded-xl p-4 text-sm text-ink placeholder:text-muted font-body focus:outline-none focus:border-accent/50 resize-none min-h-60 shadow-sm"
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-mono text-muted uppercase tracking-wider">
            <Briefcase size={12} className="text-skyDark" /> Job Description
          </label>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder={`Start with the job title on the first line, e.g:\n\nJava Developer\n\nWe are looking for a Java Developer with Spring Boot experience...`}
            className="flex-1 frosted rounded-xl p-4 text-sm text-ink placeholder:text-muted font-body focus:outline-none focus:border-sky/50 resize-none min-h-72 shadow-sm"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <AlertCircle size={14} />{error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 aurora-gradient text-white font-display font-700 text-base rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {loading
          ? <><Loader2 size={18} className="animate-spin" />{loadingMsg}</>
          : <>Generate Learning Pathway <ArrowRight size={18} /></>
        }
      </button>

      <p className="text-center text-xs font-mono text-muted mt-4">
        Tip: Start your job description with the role title on the first line
      </p>
    </div>
  )
}

function transformResponse(data) {
  return {
    name:           'Candidate',
    targetRole:     data.target_role,
    currentSkills:  data.existing_skills || [],
    partialSkills:  data.partial_skills  || [],
    gapSkills:      data.skill_gaps      || [],
    totalHours:     data.total_hours,
    standardHours:  data.standard_hours,
    timeSavedPct:   data.time_saved_pct,
    reasoningTrace: data.reasoning_trace || [],
    pathway: (data.modules || []).map((m, i) => ({
      id:         i + 1,
      title:      m.title,
      module_id:  m.module_id,
      provider:   'Waypoint',
      duration:   `${m.hours}h`,
      prereqs:    [],
      reason:     m.why_included     || '',
      skipReason: m.skip_reason      || null,
      confidence: Math.max(0.75, 0.95 - i * 0.02),
      priority:   m.priority         || 'CORE GAP',
      savingsPct: m.estimated_savings_pct || 0,
      questions: [
        { q: `Do you already have hands-on experience with ${m.title}?`,     weight: 0.6 },
        { q: `Can you confidently explain the core concepts of ${m.title}?`, weight: 0.4 },
      ],
    })),
  }
}
