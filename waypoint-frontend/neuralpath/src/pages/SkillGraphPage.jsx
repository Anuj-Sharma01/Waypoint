import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

const COLORS = {
  node: { fill: 'rgba(255,255,255,0.9)', stroke: '#a5f3fc', text: '#0d2b1f' },
  done: { fill: '#ecfdf5', stroke: '#34d399', text: '#065f46' },
  skipped: { fill: '#e0f2fe', stroke: '#38bdf8', text: '#0369a1' },
  active: { fill: '#ede9fe', stroke: '#a78bfa', text: '#4c1d95' },
  edge: 'rgba(99,179,237,0.4)',
}

function buildGraph(pathway) {
  const W = 700, H = 500
  const nodes = []
  const edges = []
  const cols = Math.ceil(Math.sqrt(pathway.length))

  pathway.forEach((mod, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    nodes.push({
      id: mod.id,
      title: mod.title.length > 18 ? mod.title.slice(0, 16) + '…' : mod.title,
      fullTitle: mod.title,
      x: 80 + col * ((W - 160) / Math.max(cols - 1, 1)),
      y: 80 + row * ((H - 160) / Math.max(Math.ceil(pathway.length / cols) - 1, 1)),
      prereqs: mod.prereqs,
    })
  })

  pathway.forEach(mod => {
    mod.prereqs?.forEach(prereqTitle => {
      const from = nodes.find(n => pathway.find(m => m.id === n.id)?.title === prereqTitle)
      const to = nodes.find(n => n.id === mod.id)
      if (from && to) edges.push({ from: from.id, to: to.id })
    })
  })

  return { nodes, edges }
}

export default function SkillGraphPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const canvasRef = useRef()
  const [zoom, setZoom] = useState(1)
  const [tooltip, setTooltip] = useState(null)
  const [highlighted, setHighlighted] = useState(null)

  const result = state?.result
  const pathway = result?.pathway || []
  const { nodes, edges } = buildGraph(pathway)

  const draw = (canvas, z) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.scale(z, z)

    // Draw edges
    edges.forEach(e => {
      const from = nodes.find(n => n.id === e.from)
      const to = nodes.find(n => n.id === e.to)
      if (!from || !to) return

      const isHl = highlighted === e.from || highlighted === e.to
      ctx.beginPath()
      const mx = (from.x + to.x) / 2
      const my = (from.y + to.y) / 2 - 30
      ctx.moveTo(from.x, from.y)
      ctx.quadraticCurveTo(mx, my, to.x, to.y)
      ctx.strokeStyle = isHl ? '#38bdf8' : COLORS.edge
      ctx.lineWidth = isHl ? 2 : 1
      ctx.setLineDash(isHl ? [] : [4, 3])
      ctx.stroke()
      ctx.setLineDash([])

      // Arrowhead
      const angle = Math.atan2(to.y - my, to.x - mx)
      ctx.save()
      ctx.translate(to.x, to.y - 22)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.moveTo(0, 0); ctx.lineTo(-8, -4); ctx.lineTo(-8, 4)
      ctx.fillStyle = isHl ? '#38bdf8' : COLORS.edge
      ctx.fill()
      ctx.restore()
    })

    // Draw nodes
    nodes.forEach(n => {
      const isHl = highlighted === n.id
      const isDone = state?.completedIds?.includes(n.id)
      const isSkipped = state?.skippedIds?.includes(n.id)
      const c = isDone ? COLORS.done : isSkipped ? COLORS.skipped : isHl ? COLORS.active : COLORS.node

      // Shadow
      ctx.shadowColor = isHl ? 'rgba(167,139,250,0.4)' : 'rgba(0,0,0,0.1)'
      ctx.shadowBlur = isHl ? 16 : 8
      ctx.shadowOffsetY = 2

      // Node box
      const w = 120, h = 44
      ctx.beginPath()
      ctx.roundRect(n.x - w/2, n.y - h/2, w, h, 10)
      ctx.fillStyle = c.fill
      ctx.fill()
      ctx.strokeStyle = c.stroke
      ctx.lineWidth = isHl ? 2 : 1.5
      ctx.stroke()
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

      // Text
      ctx.fillStyle = c.text
      ctx.font = `${isHl ? '600' : '500'} 11px "DM Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(n.title, n.x, n.y)

      // Done checkmark
      if (isDone) {
        ctx.fillStyle = '#34d399'
        ctx.font = '12px sans-serif'
        ctx.fillText('✓', n.x + 48, n.y - 16)
      }
    })

    ctx.restore()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) draw(canvas, zoom)
  }, [zoom, highlighted, pathway])

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / zoom
    const my = (e.clientY - rect.top) / zoom
    const hit = nodes.find(n => Math.abs(n.x - mx) < 62 && Math.abs(n.y - my) < 24)
    setHighlighted(hit?.id || null)
    setTooltip(hit ? { x: e.clientX, y: e.clientY, text: hit.fullTitle } : null)
  }

  if (!result) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-muted mb-4">No pathway found.</p>
      <button onClick={() => navigate('/upload')} className="text-accentDark underline text-sm">Go analyze first</button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-ink text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-700 text-ink">Skill Dependency Graph</h1>
          <p className="text-dim text-sm mt-1">Visual map of your learning path — arrows show prerequisites</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="frosted p-2 rounded-lg border border-softborder hover:border-accent/40 transition-all"><ZoomIn size={16} className="text-dim" /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="frosted p-2 rounded-lg border border-softborder hover:border-accent/40 transition-all"><ZoomOut size={16} className="text-dim" /></button>
          <button onClick={() => setZoom(1)} className="frosted p-2 rounded-lg border border-softborder hover:border-accent/40 transition-all"><RotateCcw size={16} className="text-dim" /></button>
          <span className="text-xs font-mono text-muted">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="frosted rounded-2xl overflow-hidden shadow-lg relative">
        <canvas
          ref={canvasRef}
          width={700} height={500}
          style={{ width: '100%', height: 'auto', cursor: highlighted ? 'pointer' : 'default' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHighlighted(null); setTooltip(null) }}
        />
        {tooltip && (
          <div className="fixed z-50 px-3 py-1.5 bg-ink text-white text-xs font-mono rounded-lg pointer-events-none shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
          >{tooltip.text}</div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        {[
          { color: '#a5f3fc', label: 'To complete' },
          { color: '#34d399', label: 'Done' },
          { color: '#38bdf8', label: 'Skipped' },
          { color: '#a78bfa', label: 'Hovered' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs font-mono text-muted">
            <div className="w-3 h-3 rounded" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
