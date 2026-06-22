import { Html } from '@react-three/drei'
import { ZONE_ORDER } from './ProjectCard'

// Ancres world des points cliquables, posées sur chaque objet de la scène.
// Valeurs dérivées des centres de zone (cf. commentaires Room.jsx / Robot.jsx),
// à affiner à l'œil si besoin via window.debug.camlog.
const HOTSPOTS = {
  screen: [-1.02, 0.06, -1.10],
  phone: [0.66, 0.07, -0.80],
  robot: [-1.05, 0.24, -0.15],
  drawer: [-0.72, -0.55, 1.50],
}

// Marqueurs tactiles affichés en vue d'ensemble. Chaque point émet zoneclick
// au tap. Rendu dans le Canvas (drei <Html>) pour suivre la projection 3D.
export default function MobileHotspots({ visible }) {
  if (!visible) return null

  const tap = (zone) =>
    window.dispatchEvent(new CustomEvent('zoneclick', {
      detail: { zone, position: null },
    }))

  return (
    <>
      {ZONE_ORDER.map((zone) => (
        <Html
          key={zone}
          position={HOTSPOTS[zone]}
          center
          zIndexRange={[90, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <button
            onClick={() => tap(zone)}
            aria-label={`Ouvrir ${zone}`}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              background: 'transparent',
              cursor: 'pointer',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <style>{`
              @keyframes hsPulse {
                0%   { transform: scale(0.85); opacity: 0.9; }
                70%  { transform: scale(2.1); opacity: 0; }
                100% { transform: scale(2.1); opacity: 0; }
              }
            `}</style>
            {/* Anneau de pulsation */}
            <span
              style={{
                position: 'absolute',
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '1.5px solid rgba(170, 200, 255, 0.9)',
                animation: 'hsPulse 1.8s ease-out infinite',
              }}
            />
            {/* Cœur plein */}
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: '#c8d6f0',
                boxShadow: '0 0 10px rgba(170, 200, 255, 0.9)',
              }}
            />
          </button>
        </Html>
      ))}
    </>
  )
}
