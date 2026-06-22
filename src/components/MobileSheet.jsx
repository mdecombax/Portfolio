import { ZONE_PANELS } from './ProjectCard'

// Panneau remontant du bas, version tactile du ProjectCard 3D.
// Différences clés avec le desktop :
//  - les descriptions sont TOUJOURS visibles (pas de :hover sur mobile)
//  - liens ouverts au tap (onClick), zone de toucher généreuse
//  - stopPropagation des pointers pour ne pas réveiller la caméra/orbite
export default function MobileSheet({ focusedZone, zoomReady }) {
  const open = !!focusedZone && zoomReady
  const panel = focusedZone ? ZONE_PANELS[focusedZone.zone] : null

  const close = () => window.dispatchEvent(new CustomEvent('zoneclick', { detail: null }))
  const openUrl = (url) => window.open(url, '_blank', 'noopener,noreferrer')
  const stop = (e) => e.stopPropagation()

  return (
    <div
      onPointerDown={stop}
      onPointerUp={stop}
      onTouchStart={stop}
      onTouchEnd={stop}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9997,
        // Glisse hors écran quand fermé
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
        background: 'rgba(7, 7, 18, 0.94)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(170, 200, 255, 0.22)',
        borderTopLeftRadius: '18px',
        borderTopRightRadius: '18px',
        boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.5)',
        fontFamily: 'monospace',
        color: '#c8d6f0',
        maxHeight: '62dvh',
        display: 'flex',
        flexDirection: 'column',
        // Évite le chevauchement avec la barre système / notch en bas
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Poignée de préhension */}
      <div
        onClick={close}
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '10px 0 6px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(200, 214, 240, 0.35)' }} />
      </div>

      {/* En-tête : titre de zone + bouton fermer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 20px 12px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.22em',
            color: '#ff9944',
            textTransform: 'uppercase',
          }}
        >
          {panel?.title}
        </span>
        <button
          onClick={close}
          aria-label="Fermer"
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid rgba(170, 200, 255, 0.25)',
            background: 'rgba(170, 200, 255, 0.06)',
            color: '#c8d6f0',
            fontSize: '0.9rem',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Liste scrollable des projets */}
      <div
        style={{
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '0 20px 8px',
        }}
      >
        {panel?.items.map((item, i) => (
          <div
            key={item.id}
            onClick={() => openUrl(item.url)}
            style={{
              padding: '13px 0',
              borderBottom: i < panel.items.length - 1 ? '1px solid rgba(170, 200, 255, 0.1)' : 'none',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontSize: '0.92rem',
                letterSpacing: '0.04em',
                color: '#dce6ff',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
              }}
            >
              {item.label}
              <span style={{ fontSize: '0.78rem', color: '#ff9944' }}>↗</span>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.01em',
                lineHeight: 1.4,
                marginTop: '4px',
                color: 'rgba(200, 214, 240, 0.6)',
              }}
            >
              {item.desc}
            </div>
            {item.caseStudy && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  openUrl(item.caseStudy.url)
                }}
                style={{
                  marginTop: '7px',
                  fontSize: '0.66rem',
                  letterSpacing: '0.01em',
                  color: 'rgba(255, 153, 68, 0.85)',
                }}
              >
                ↗ {item.caseStudy.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
