import { useEffect, useRef, useState } from 'react'

// Musique de fond. Les navigateurs bloquent l'autoplay audio tant que
// l'utilisateur n'a pas interagi : on démarre donc la lecture au premier
// clic / touche / toucher, puis on expose un bouton mute/unmute.
export default function BgMusic({ src = `${import.meta.env.BASE_URL}music.mp3`, volume = 0.4 }) {
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(false)
  const [started, setStarted] = useState(false)

  // Crée l'élément audio une seule fois
  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = volume
    audio.preload = 'auto'
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [src, volume])

  // Démarre au premier geste utilisateur (contourne le blocage autoplay)
  useEffect(() => {
    if (started) return

    const tryPlay = () => {
      const audio = audioRef.current
      if (!audio) return
      audio.play().then(() => {
        setStarted(true)
        remove()
      }).catch(() => {
        // Geste pas encore considéré comme valide : on réessaiera au prochain
      })
    }

    const remove = () => {
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('keydown', tryPlay)
      window.removeEventListener('touchstart', tryPlay)
    }

    window.addEventListener('pointerdown', tryPlay)
    window.addEventListener('keydown', tryPlay)
    window.addEventListener('touchstart', tryPlay)
    return remove
  }, [started])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const next = !muted
    audio.muted = next
    setMuted(next)
    // Si la lecture n'a jamais démarré (clic direct sur le bouton), on tente ici
    if (!started && !next) {
      audio.play().then(() => setStarted(true)).catch(() => {})
    }
  }

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? 'Activer la musique' : 'Couper la musique'}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 42,
        height: 42,
        borderRadius: '50%',
        border: '1px solid rgba(170, 200, 255, 0.3)',
        background: 'rgba(5, 5, 15, 0.55)',
        color: '#c8d6f0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        zIndex: 10001,
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,214,240,0.7)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(170,200,255,0.3)' }}
    >
      {muted || !started ? (
        // Icône muet
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        // Icône son actif
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  )
}
