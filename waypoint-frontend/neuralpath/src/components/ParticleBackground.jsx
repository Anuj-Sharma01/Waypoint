import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      dx: (Math.random() - 0.5) * 0.18,
      dy: (Math.random() - 0.5) * 0.18,
      r: 1.5 + Math.random() * 2,
      color: ['rgba(52,211,153,', 'rgba(56,189,248,', 'rgba(167,139,250,'][Math.floor(Math.random() * 3)],
    }))

    let animId
    let W = 0, H = 0

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Aurora mesh gradient background
      const g1 = ctx.createRadialGradient(W*0.2, H*0.3, 0, W*0.2, H*0.3, W*0.5)
      g1.addColorStop(0, 'rgba(52,211,153,0.18)')
      g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)

      const g2 = ctx.createRadialGradient(W*0.8, H*0.2, 0, W*0.8, H*0.2, W*0.45)
      g2.addColorStop(0, 'rgba(56,189,248,0.16)')
      g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)

      const g3 = ctx.createRadialGradient(W*0.6, H*0.8, 0, W*0.6, H*0.8, W*0.4)
      g3.addColorStop(0, 'rgba(167,139,250,0.14)')
      g3.addColorStop(1, 'transparent')
      ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H)

      const g4 = ctx.createRadialGradient(W*0.1, H*0.8, 0, W*0.1, H*0.8, W*0.35)
      g4.addColorStop(0, 'rgba(56,189,248,0.1)')
      g4.addColorStop(1, 'transparent')
      ctx.fillStyle = g4; ctx.fillRect(0, 0, W, H)

      // Move particles
      particles.forEach(p => {
        p.x += p.dx / W
        p.y += p.dy / H
        if (p.x < 0 || p.x > 1) p.dx *= -1
        if (p.y < 0 || p.y > 1) p.dy *= -1
      })

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = (particles[i].x - particles[j].x) * W
          const dy = (particles[i].y - particles[j].y) * H
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.25
            ctx.beginPath()
            ctx.moveTo(particles[i].x * W, particles[i].y * H)
            ctx.lineTo(particles[j].x * W, particles[j].y * H)
            ctx.strokeStyle = `rgba(99,179,237,${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      // Draw dots
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + '0.6)'
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
