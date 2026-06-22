import { useEffect, useRef, useState } from 'react'
import { ZONE_TITLES } from './ProjectCard'

export default function Cursor() {
  const ringRef = useRef(null)
  const dotRef = useRef(null)
  const mouse = useRef({ x: -100, y: -100 })
  const ring = useRef({ x: -100, y: -100 })
  const ringScale = useRef(1)
  const zoneRef = useRef(null)
  const [zoneInfo, setZoneInfo] = useState(null)

  useEffect(() => {
    document.documentElement.style.cursor = 'none'

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }

    const onZone = (e) => {
      zoneRef.current = e.detail || null
      setZoneInfo(e.detail || null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('hoveredzone', onZone)

    let raf
    let last = performance.now()

    const animate = (now) => {
      const dt = Math.min((now - last) / 16.667, 4) // frames-équivalent à 60fps, clampé
      last = now

      // Lerp frame-rate independent
      const factor = 1 - Math.pow(0.18, dt)
      ring.current.x += (mouse.current.x - ring.current.x) * factor
      ring.current.y += (mouse.current.y - ring.current.y) * factor

      // Scale via ref (pas de closure stale)
      const targetScale = zoneRef.current ? 1.5 : 1
      ringScale.current += (targetScale - ringScale.current) * Math.min(0.12 * dt, 1)

      // translate3d → layer GPU dédié, 0 layout thrashing
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) scale(${ringScale.current})`
      }

      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      document.documentElement.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('hoveredzone', onZone)
      cancelAnimationFrame(raf)
    }
  }, [])

  const SIZE = 28
  const DOT = 4
  const hovered = !!zoneInfo

  return (
    <>
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: SIZE,
          height: SIZE,
          marginLeft: -SIZE / 2,
          marginTop: -SIZE / 2,
          borderRadius: '50%',
          border: `1.5px solid ${hovered ? 'rgba(200,214,240,0.9)' : 'rgba(200,214,240,0.45)'}`,
          background: hovered ? 'rgba(170,200,255,0.07)' : 'transparent',
          transition: 'border-color 0.2s, background 0.2s',
          pointerEvents: 'none',
          zIndex: 100000,
          willChange: 'transform',
        }}
      />

      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: DOT,
          height: DOT,
          marginLeft: -DOT / 2,
          marginTop: -DOT / 2,
          borderRadius: '50%',
          background: hovered ? '#c8d6f0' : 'rgba(200,214,240,0.7)',
          transition: 'background 0.2s',
          pointerEvents: 'none',
          zIndex: 100001,
          willChange: 'transform',
        }}
      />

      {zoneInfo && (
        <div
          style={{
            position: 'fixed',
            left: zoneInfo.x,
            top: zoneInfo.y,
            transform: 'translate(-50%, -50%)',
            background: 'rgba(5, 5, 15, 0.82)',
            color: '#c8d6f0',
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.14em',
            padding: '5px 12px',
            borderRadius: '3px',
            border: '1px solid rgba(170, 200, 255, 0.3)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            zIndex: 9998,
          }}
        >
          {ZONE_TITLES[zoneInfo.zone] ?? 'projets'}
        </div>
      )}
    </>
  )
}
