import { ZONE_ORDER, ZONE_TITLES } from './ProjectCard'

// Navigation guidée mobile.
//  - vue d'ensemble (aucune zone) : indice « touchez un point »
//  - zone ouverte : stepper ‹ TITRE i/N › pour passer de zone en zone
// Le passage direct d'une zone à l'autre émet zoneclick avec { switch: true }
// pour que App.jsx réinitialise le focus au lieu de l'ignorer (cf. desktop).
export default function MobileNav({ focusedZone }) {
  const zone = focusedZone?.zone
  const index = zone ? ZONE_ORDER.indexOf(zone) : -1

  const goTo = (i) => {
    const target = ZONE_ORDER[(i + ZONE_ORDER.length) % ZONE_ORDER.length]
    window.dispatchEvent(new CustomEvent('zoneclick', {
      detail: { zone: target, position: null, switch: true },
    }))
  }

  // Vue d'ensemble : invite à toucher un hotspot
  if (index === -1) {
    return (
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 22px)',
          transform: 'translateX(-50%)',
          zIndex: 9996,
          fontFamily: 'monospace',
          fontSize: '0.64rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(200, 214, 240, 0.7)',
          background: 'rgba(7, 7, 18, 0.55)',
          border: '1px solid rgba(170, 200, 255, 0.18)',
          backdropFilter: 'blur(6px)',
          padding: '9px 16px',
          borderRadius: 999,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          animation: 'navHintPulse 2.4s ease-in-out infinite',
        }}
      >
        <style>{`@keyframes navHintPulse { 0%,100%{opacity:0.55} 50%{opacity:1} }`}</style>
        ◍ touchez un point
      </div>
    )
  }

  const btn = {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: '50%',
    border: '1px solid rgba(170, 200, 255, 0.25)',
    background: 'rgba(170, 200, 255, 0.06)',
    color: '#c8d6f0',
    fontSize: '1rem',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  // Zone ouverte : stepper en haut (le sheet occupe le bas)
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        fontFamily: 'monospace',
        background: 'rgba(7, 7, 18, 0.7)',
        border: '1px solid rgba(170, 200, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        padding: '7px 10px',
        borderRadius: 999,
        pointerEvents: 'auto',
      }}
    >
      <button style={btn} onClick={() => goTo(index - 1)} aria-label="Zone précédente">‹</button>
      <div style={{ textAlign: 'center', minWidth: 96 }}>
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#ff9944',
            whiteSpace: 'nowrap',
          }}
        >
          {ZONE_TITLES[zone]}
        </div>
        <div
          style={{
            fontSize: '0.54rem',
            letterSpacing: '0.16em',
            color: 'rgba(200, 214, 240, 0.5)',
            marginTop: '2px',
          }}
        >
          {index + 1} / {ZONE_ORDER.length}
        </div>
      </div>
      <button style={btn} onClick={() => goTo(index + 1)} aria-label="Zone suivante">›</button>
    </div>
  )
}
