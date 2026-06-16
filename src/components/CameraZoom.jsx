import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const MIN_DIST = 3
const MAX_DIST = 10
const SENSITIVITY = 0.01
const SMOOTHING = 0.005 // identique à Bruno Simon

export default function CameraZoom() {
  const { camera } = useThree()
  const targetDist = useRef(null)
  const smoothedDist = useRef(null)

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault()

      // Normalisation cross-browser du delta (équivalent normalize-wheel)
      let delta = e.deltaY
      if (e.deltaMode === 1) delta *= 16   // line → pixels
      if (e.deltaMode === 2) delta *= 600  // page → pixels

      if (targetDist.current !== null) {
        targetDist.current += delta * SENSITIVITY
        targetDist.current = Math.max(MIN_DIST, Math.min(MAX_DIST, targetDist.current))
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  useFrame((state, delta) => {
    const controls = state.controls
    const target = controls?.target ?? new THREE.Vector3()
    const actualDist = camera.position.distanceTo(target)

    // Init depuis la distance réelle au premier frame
    if (targetDist.current === null) targetDist.current = actualDist
    if (smoothedDist.current === null) smoothedDist.current = actualDist

    // Lerp formule Bruno Simon : smoothing * deltaMs (delta en secondes ici)
    const factor = Math.min(SMOOTHING * delta * 1000, 1)
    smoothedDist.current += (targetDist.current - smoothedDist.current) * factor

    // Repositionner la caméra le long du vecteur target→camera, distance = smoothedDist
    const dir = camera.position.clone().sub(target).normalize()
    camera.position.copy(target).addScaledVector(dir, smoothedDist.current)
  })

  return null
}
