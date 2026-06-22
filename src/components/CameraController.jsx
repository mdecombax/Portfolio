import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const MIN_DIST = 0.5
const MAX_DIST = 10
const SENSITIVITY = 0.01
const LERP = 0.055

const HOME_CAM = new THREE.Vector3(5, 2, 5)
const HOME_TARGET = new THREE.Vector3(0, 0, 0)
const HOME_DIST = HOME_CAM.distanceTo(HOME_TARGET)

// Vue d'ensemble mobile : caméra reculée car le FOV horizontal est plus étroit
// en portrait (sinon la chambre déborde sur les côtés).
const MOBILE_HOME_CAM = HOME_CAM.clone().multiplyScalar(1.28)

function makeZoneView(camPos, target) {
  const dir = new THREE.Vector3().subVectors(target, camPos).normalize()
  // Évite le gimbal lock (regard vertical) en changeant le vecteur up
  const up = Math.abs(dir.y) > 0.98
    ? new THREE.Vector3(0, 0, -1)
    : new THREE.Vector3(0, 1, 0)
  const m = new THREE.Matrix4().lookAt(camPos, target, up)
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(m)
  return { camPos, target, quaternion }
}

const ZONE_VIEWS = {
  screen: makeZoneView(
    new THREE.Vector3(-0.206, -0.032, -1.046),
    new THREE.Vector3(-0.936, -0.137, -0.965),
  ),
  phone: makeZoneView(
    new THREE.Vector3(0.660, 0.501, -0.797),
    new THREE.Vector3(0.660, 0.001, -0.798),
  ),
  // Table de chevet gauche (group1) ≈ [-1.05, -0.89, 1.50], façade vers +X.
  // Vue en plongée : caméra relevée et cible abaissée pour regarder dans les
  // tiroirs ouverts (dessus ouvert) plutôt que de face.
  drawer: makeZoneView(
    new THREE.Vector3(0.250, -0.380, 1.500),
    new THREE.Vector3(-1.050, -1.000, 1.500),
  ),
  // Robot sur l'étagère en verre du dessus (centre ≈ [-1.05, 0.05, -0.15]),
  // orienté face au lit. La caméra est « pannée » vers la gauche (camPos+target
  // décalés de camera_left * 0.25 ≈ [0.046, 0, 0.246]) pour que le robot se cale
  // à droite du cadre et laisser la place à la pop-up à gauche.
  robot: makeZoneView(
    new THREE.Vector3(-0.314, 0.100, -0.034),
    new THREE.Vector3(-1.004, 0.000, 0.096),
  ),
}

// Vues mobiles calibrées depuis les boîtes englobantes world RÉELLES de chaque
// zone (window.debug.zones) + un fit géométrique (fov/aspect portrait) : l'objet
// est centré, occupe ~50-72% de la largeur et remonte au-dessus du bottom-sheet.
// Re-calibration : window.debug.zones() pour les centres, window.__camOverride
// = {camPos:[...],target:[...]} pour prévisualiser une vue en direct.
const MOBILE_ZONE_VIEWS = {
  // Écran / bureau — vue de face-droite, moniteur centré
  screen: makeZoneView(
    new THREE.Vector3(1.713, 0.452, -0.041),
    new THREE.Vector3(-1.045, -0.510, -1.176),
  ),
  // Téléphone sur le lit — plongée pour lire l'écran du smartphone
  phone: makeZoneView(
    new THREE.Vector3(1.318, 0.730, -0.636),
    new THREE.Vector3(0.986, -0.600, -0.902),
  ),
  // Robot sur l'étagère — vue de face, centré
  robot: makeZoneView(
    new THREE.Vector3(0.990, 0.703, -0.428),
    new THREE.Vector3(-1.050, -0.125, -0.150),
  ),
  // Tiroir ouvert — plongée dans la cavité (boîte mesurée tiroir sorti)
  drawer: makeZoneView(
    new THREE.Vector3(0.598, 2.026, 1.565),
    new THREE.Vector3(-0.935, -1.023, 1.504),
  ),
}

export default function CameraController({ focusedZone, onZoomReady, isMobile = false }) {
  const { camera } = useThree()
  const dbgTarget = useRef(new THREE.Vector3())
  const targetDist = useRef(null)
  const smoothedDist = useRef(null)
  const focused = useRef(false)
  const returningHome = useRef(false)
  const zoomReadyFired = useRef(false)

  useEffect(() => {
    const wasFocused = focused.current
    focused.current = !!focusedZone
    zoomReadyFired.current = false
    if (!focusedZone && wasFocused) {
      returningHome.current = true
    }
  }, [focusedZone])

  useEffect(() => {
    const onWheel = (e) => {
      if (focused.current || returningHome.current) return
      e.preventDefault()
      let delta = e.deltaY
      if (e.deltaMode === 1) delta *= 16
      if (e.deltaMode === 2) delta *= 600
      if (targetDist.current !== null) {
        targetDist.current = Math.max(MIN_DIST, Math.min(MAX_DIST, targetDist.current + delta * SENSITIVITY))
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  // Calibration mobile : logue la vue courante pour ajuster MOBILE_ZONE_VIEWS
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.debug = window.debug || {}
    window.debug.camlog = () => {
      const p = camera.position
      const t = dbgTarget.current
      console.log(
        '[cam] camPos', [p.x, p.y, p.z].map((v) => +v.toFixed(3)),
        'target', [t.x, t.y, t.z].map((v) => +v.toFixed(3)),
      )
    }
  }, [camera])

  useFrame((_, delta) => {
    const controls = _.controls
    if (!controls) return
    dbgTarget.current.copy(controls.target)

    // Override de calibration : { camPos:[x,y,z], target:[x,y,z] } figé pour preview
    const ov = typeof window !== 'undefined' && window.__camOverride
    if (ov) {
      controls.enabled = false
      camera.position.set(ov.camPos[0], ov.camPos[1], ov.camPos[2])
      controls.target.set(ov.target[0], ov.target[1], ov.target[2])
      camera.lookAt(controls.target)
      return
    }

    const f = Math.min(LERP * delta * 60, 1)
    const views = isMobile ? MOBILE_ZONE_VIEWS : ZONE_VIEWS

    if (focused.current) {
      const view = views[focusedZone?.zone]
      if (!view) return
      controls.enabled = false

      // Position et rotation simultanées, slerp quaternion pour éviter le gimbal lock
      camera.position.lerp(view.camPos, f)
      camera.quaternion.slerp(view.quaternion, f)
      controls.target.lerp(view.target, f)

      if (!zoomReadyFired.current && camera.position.distanceTo(view.camPos) < 0.05) {
        // Snap à la position exacte pour éviter toute rotation résiduelle
        camera.position.copy(view.camPos)
        camera.quaternion.copy(view.quaternion)
        controls.target.copy(view.target)
        zoomReadyFired.current = true
        onZoomReady?.()
      }
      return
    }

    // Mobile : pas d'orbite libre. On maintient (ou ramène à) la vue d'ensemble.
    if (isMobile) {
      controls.enabled = false
      returningHome.current = false
      camera.position.lerp(MOBILE_HOME_CAM, f)
      controls.target.lerp(HOME_TARGET, f)
      camera.lookAt(controls.target)
      return
    }

    // Retour à la vue d'ensemble après unfocus
    if (returningHome.current) {
      controls.enabled = false
      if (camera.position.distanceTo(HOME_CAM) < 0.05) {
        camera.position.copy(HOME_CAM)
        controls.target.copy(HOME_TARGET)
        targetDist.current = HOME_DIST
        smoothedDist.current = HOME_DIST
        controls.enabled = true
        returningHome.current = false
      } else {
        camera.position.lerp(HOME_CAM, f)
        controls.target.lerp(HOME_TARGET, f)
        camera.lookAt(controls.target)
        return
      }
    }

    // Mode orbite normal + scroll zoom
    controls.enabled = true
    const actualDist = camera.position.distanceTo(controls.target)
    if (targetDist.current === null) targetDist.current = actualDist
    if (smoothedDist.current === null) smoothedDist.current = actualDist

    const dFactor = Math.min(0.005 * delta * 1000, 1)
    smoothedDist.current += (targetDist.current - smoothedDist.current) * dFactor

    const dir = camera.position.clone().sub(controls.target).normalize()
    camera.position.copy(controls.target).addScaledVector(dir, smoothedDist.current)
  })

  return null
}
