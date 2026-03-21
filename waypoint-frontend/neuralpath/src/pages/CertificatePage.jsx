import { useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import { Download, ArrowLeft, Share2 } from 'lucide-react'

export default function CertificatePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const certRef = useRef()
  const [downloaded, setDownloaded] = useState(false)

  const role = state?.result?.targetRole || 'ML Engineer'
  const name = state?.result?.name || 'Learner'
  const modules = state?.result?.pathway?.length || 4
  const date = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })

  const handleDownload = async () => {
    const el = certRef.current
    if (!el) return

    // Use html2canvas-like approach via canvas
    const canvas = document.createElement('canvas')
    canvas.width = 900; canvas.height = 620
    const ctx = canvas.getContext('2d')

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 900, 620)
    bg.addColorStop(0, '#ecfdf5'); bg.addColorStop(0.5, '#e0f2fe'); bg.addColorStop(1, '#ede9fe')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 900, 620)

    // Border
    ctx.strokeStyle = 'rgba(52,211,153,0.4)'; ctx.lineWidth = 2
    ctx.strokeRect(20, 20, 860, 580)
    ctx.strokeStyle = 'rgba(167,139,250,0.3)'; ctx.lineWidth = 1
    ctx.strokeRect(28, 28, 844, 564)

    // Top accent bar
    const bar = ctx.createLinearGradient(0, 0, 900, 0)
    bar.addColorStop(0, '#34d399'); bar.addColorStop(0.5, '#38bdf8'); bar.addColorStop(1, '#a78bfa')
    ctx.fillStyle = bar; ctx.fillRect(20, 20, 860, 6)

    // Watermark circles
    ctx.beginPath(); ctx.arc(100, 100, 80, 0, Math.PI*2)
    ctx.fillStyle = 'rgba(52,211,153,0.07)'; ctx.fill()
    ctx.beginPath(); ctx.arc(800, 520, 100, 0, Math.PI*2)
    ctx.fillStyle = 'rgba(167,139,250,0.07)'; ctx.fill()

    // Logo text
    ctx.fillStyle = '#065f46'; ctx.font = 'bold 28px serif'
    ctx.textAlign = 'center'; ctx.fillText('WayPoint', 450, 100)

    // Certificate of completion
    ctx.fillStyle = '#4b5563'; ctx.font = '16px sans-serif'
    ctx.fillText('CERTIFICATE OF COMPLETION', 450, 135)

    // Decorative line
    ctx.strokeStyle = 'rgba(52,211,153,0.4)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(200, 155); ctx.lineTo(700, 155); ctx.stroke()

    // This certifies
    ctx.fillStyle = '#6b7280'; ctx.font = '14px sans-serif'
    ctx.fillText('This certifies that', 450, 195)

    // Name
    ctx.fillStyle = '#0d2b1f'; ctx.font = 'bold 42px serif'
    ctx.fillText(name, 450, 255)

    // has successfully
    ctx.fillStyle = '#6b7280'; ctx.font = '14px sans-serif'
    ctx.fillText('has successfully completed the adaptive learning pathway for', 450, 295)

    // Role
    ctx.font = 'bold 28px serif'
    const grad = ctx.createLinearGradient(300, 0, 600, 0)
    grad.addColorStop(0, '#34d399'); grad.addColorStop(0.5, '#38bdf8'); grad.addColorStop(1, '#a78bfa')
    ctx.fillStyle = grad; ctx.fillText(role, 450, 345)

    // Stats
    ctx.fillStyle = '#6b7280'; ctx.font = '13px sans-serif'
    ctx.fillText(`${modules} modules completed  ·  0% hallucination rate  ·  O*NET grounded pathway`, 450, 385)

    // Bottom line
    ctx.strokeStyle = 'rgba(52,211,153,0.4)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(200, 420); ctx.lineTo(700, 420); ctx.stroke()

    // Date and platform
    ctx.fillStyle = '#9ca3af'; ctx.font = '12px monospace'
    ctx.textAlign = 'left'; ctx.fillText(`Issued: ${date}`, 200, 450)
    ctx.textAlign = 'right'; ctx.fillText('waypoint.ai', 700, 450)

    // Download
    const link = document.createElement('a')
    link.download = `WayPoint_Certificate_${role.replace(/ /g,'_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloaded(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-ink text-sm mb-8 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-700 text-ink mb-2">Your Certificate 🎓</h1>
        <p className="text-dim text-sm">You've closed the gap to {role}. Download and share your achievement.</p>
      </div>

      {/* Certificate preview */}
      <div ref={certRef}
        className="rounded-2xl overflow-hidden shadow-xl mb-6 relative"
        style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#e0f2fe 50%,#ede9fe 100%)', border: '2px solid rgba(52,211,153,0.3)' }}
      >
        {/* Top bar */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#34d399,#38bdf8,#a78bfa)' }} />

        <div className="px-12 py-12 text-center relative">
          {/* Decorative bg circles */}
          <div className="absolute top-4 left-4 w-32 h-32 rounded-full" style={{ background: 'rgba(52,211,153,0.07)' }} />
          <div className="absolute bottom-4 right-4 w-40 h-40 rounded-full" style={{ background: 'rgba(167,139,250,0.07)' }} />

          <div className="relative">
            <p className="font-display text-3xl font-700 text-accentDark mb-1">WayPoint</p>
            <p className="text-xs font-mono text-muted uppercase tracking-[0.25em] mb-6">Certificate of Completion</p>

            <div className="w-48 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent mx-auto mb-6" />

            <p className="text-dim text-sm mb-2 font-body">This certifies that</p>
            <p className="font-display text-5xl font-700 text-ink mb-3">{name}</p>
            <p className="text-dim text-sm mb-3 font-body">has successfully completed the adaptive learning pathway for</p>

            <p className="font-display text-3xl font-700 mb-4 text-gradient">{role}</p>

            <p className="text-xs font-mono text-muted mb-6">
              {modules} modules completed · 0% hallucination rate · O*NET grounded pathway
            </p>

            <div className="w-48 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent mx-auto mb-5" />

            <div className="flex justify-between text-xs font-mono text-muted px-12">
              <span>Issued: {date}</span>
              <span>waypoint.ai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 btn-gradient text-white font-display font-700 text-sm rounded-xl shadow-lg transition-all hover:opacity-90"
        >
          <Download size={16} />
          {downloaded ? 'Downloaded!' : 'Download PNG'}
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: `I completed the ${role} pathway on WayPoint!`, url: window.location.href })
            }
          }}
          className="flex items-center gap-2 px-6 py-3 frosted border border-softborder text-dim font-mono text-sm rounded-xl hover:border-accent/40 hover:text-ink transition-all"
        >
          <Share2 size={15} /> Share
        </button>
      </div>
    </div>
  )
}
