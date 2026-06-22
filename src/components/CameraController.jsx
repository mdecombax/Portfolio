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

export default function CameraController({ focusedZone, onZoomReady }) {
  const { camera } = useThree()
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

  useFrame((_, delta) => {
    const controls = _.controls
    if (!controls) return

    const f = Math.min(LERP * delta * 60, 1)

    if (focused.current) {
      const view = ZONE_VIEWS[focusedZone?.zone]
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
