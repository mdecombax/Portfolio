import { useProgress } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'

// Écran d'accueil / chargement. Suit la progression réelle des assets 3D
// (GLB, textures, vidéo) via le LoadingManager par défaut de three, exposé
// hors-Canvas par useProgress. Quand tout est prêt, on remplace le compteur
// par un bouton « Entrer » : son clic compte comme geste utilisateur, ce qui
// débloque aussi l'autoplay de la musique de fond.
export default function LoadingScreen() {
  const { progress, active } = useProgress()
  const [ready, setReady] = useState(false)
  const [entering, setEntering] = useState(false)
  const [gone, setGone] = useState(false)
  // Progression affichée, lissée pour éviter les sauts brusques
  const [shown, setShown] = useState(0)
  const rafRef = useRef()

  // Lissage de la barre vers la valeur cible
  useEffect(() => {
    const tick = () => {
      setShown(prev => {
        const next = prev + (progress - prev) * 0.12
        return Math.abs(progress - next) < 0.4 ? progress : next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [progress])

  // Prêt quand le chargement est terminé et la barre quasiment pleine
  useEffect(() => {
    if (!active && progress >= 100 && shown > 99) {
      const id = setTimeout(() => setReady(true), 250)
      return () => clearTimeout(id)
    }
  }, [active, progress, shown])

  const handleEnter = () => {
    setEntering(true)
    setTimeout(() => setGone(true), 900)
  }

  if (gone) return null

  const pct = Math.round(shown)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10002,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.2rem',
        // Dégradé coucher de soleil : nuit violacée en haut → braise en bas
        background:
          'radial-gradient(120% 120% at 50% 120%, #ff7a3d 0%, #d6457a 28%, #6e3a86 58%, #241a4a 82%, #0c0a1e 100%)',
        color: '#fff3e6',
        fontFamily: 'monospace',
        opacity: entering ? 0 : 1,
        pointerEvents: entering ? 'none' : 'auto',
        transition: 'opacity 0.9s ease',
      }}
    >
      {/* Voile sombre subtil pour ancrer le texte */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(80% 80% at 50% 45%, rgba(0,0,0,0) 40%, rgba(8,6,22,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.6rem',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textShadow: '0 2px 24px rgba(0,0,0,0.4)',
          }}
        >
          Martin Decombarieu
        </h1>
        <p
          style={{
            margin: '-0.8rem 0 0',
            fontSize: '0.85rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            opacity: 0.75,
          }}
        >
          Portfolio
        </p>

        {/* Bloc chargement (disparaît) / bouton (apparaît) avec fondu croisé */}
        <div
          style={{
            position: 'relative',
            marginTop: '1rem',
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Barre + pourcentage */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.8rem',
              opacity: ready ? 0 : 1,
              transform: ready ? 'translateY(-8px)' : 'none',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              pointerEvents: ready ? 'none' : 'auto',
            }}
          >
            <div
              style={{
                width: 'clamp(180px, 40vw, 280px)',
                height: 3,
                borderRadius: 3,
                background: 'rgba(255,243,230,0.18)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 3,
                  background:
                    'linear-gradient(90deg, #ffd9a8, #ff8a5c, #ff5f8d)',
                  boxShadow: '0 0 12px rgba(255,150,100,0.8)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                letterSpacing: '0.18em',
                opacity: 0.8,
              }}
            >
              {pct}%
            </span>
          </div>

          {/* Bouton Entrer */}
          <button
            onClick={handleEnter}
            disabled={!ready}
            style={{
              position: 'absolute',
              padding: '0.85rem 2.6rem',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#fff3e6',
              background: 'rgba(20, 12, 30, 0.35)',
              border: '1px solid rgba(255, 220, 190, 0.55)',
              borderRadius: 999,
              cursor: ready ? 'pointer' : 'default',
              backdropFilter: 'blur(6px)',
              opacity: ready ? 1 : 0,
              transform: ready ? 'none' : 'translateY(8px)',
              transition:
                'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s, background 0.25s, border-color 0.25s, box-shadow 0.25s',
              pointerEvents: ready ? 'auto' : 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 160, 110, 0.22)'
              e.currentTarget.style.borderColor = 'rgba(255, 235, 215, 0.9)'
              e.currentTarget.style.boxShadow =
                '0 0 28px rgba(255, 140, 90, 0.45)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(20, 12, 30, 0.35)'
              e.currentTarget.style.borderColor = 'rgba(255, 220, 190, 0.55)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Entrer
          </button>
        </div>
      </div>
    </div>
  )
}
