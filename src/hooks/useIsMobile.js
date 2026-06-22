import { useState, useEffect } from 'react'

// Détection « mobile tactile » : pointeur grossier (doigt) ET écran étroit.
// Combine les deux pour éviter de basculer un laptop tactile ou une tablette
// large en mode mobile. Réévalué au resize / changement d'orientation.
const QUERY = '(pointer: coarse)'

function detect(maxWidth) {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia?.(QUERY).matches ?? false
  return coarse && window.innerWidth < maxWidth
}

export default function useIsMobile(maxWidth = 820) {
  const [isMobile, setIsMobile] = useState(() => detect(maxWidth))

  useEffect(() => {
    const update = () => setIsMobile(detect(maxWidth))
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [maxWidth])

  return isMobile
}
