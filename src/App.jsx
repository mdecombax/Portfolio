import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useRef, useState, useEffect } from 'react'

import Room from './components/Room'
import Cursor from './components/Cursor'
import CameraController from './components/CameraController'
import ProjectCard from './components/ProjectCard'
import BgMusic from './components/BgMusic'
import LoadingScreen from './components/LoadingScreen'

function Lights() {
  const screenRef = useRef()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    if (screenRef.current) {
      screenRef.current.intensity = 1.2 + Math.sin(t.current * 2.1) * 0.08
    }
  })

  return (
    <>
      {/* Ambiance générale — blanc chaud doux, peu saturé */}
      <ambientLight intensity={1.1} color="#fff1e0" />

      {/* Remplissage ciel froid léger pour casser la dominante jaune */}
      <hemisphereLight intensity={0.6} color="#dce8ff" groundColor="#ffd9b3" />

      {/* Lumière clé principale depuis la fenêtre (haut-droite) — chaude mais douce */}
      <directionalLight
        position={[3, 5, -2]}
        intensity={3.2}
        color="#ffd9a8"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Rebond chaud subtil sur le sol / murs */}
      <pointLight
        position={[1.5, -0.2, 1.5]}
        intensity={1.8}
        color="#ffcc99"
        distance={7}
        decay={1.4}
      />

      {/* Halo doré tamisé depuis le fond (fenêtre arrière) */}
      <pointLight
        position={[0.4, 1.5, -2]}
        intensity={2.2}
        color="#ff9d5c"
        distance={6}
        decay={1.6}
      />

      {/* Contre-lumière rose discrète pour colorer les ombres */}
      <pointLight
        position={[-2, 0.5, -1]}
        intensity={0.8}
        color="#ff6699"
        distance={5}
        decay={1.8}
      />

      {/* Lueur de l'écran TV — froide pour contraster avec le chaud */}
      <pointLight
        ref={screenRef}
        position={[-1.8, 0.6, 0.2]}
        intensity={1.2}
        color="#aaccff"
        distance={3}
        decay={2}
      />
    </>
  )
}

export default function App() {
  // focusedZone : pilote Room (ouverture tiroir) + ProjectCard
  // camFocus : pilote CameraController. Pour le tiroir il est différé jusqu'à
  // la fin de l'animation d'ouverture (événement 'draweropened').
  const [focusedZone, setFocusedZone] = useState(null)
  const [camFocus, setCamFocus] = useState(null)
  const [zoomReady, setZoomReady] = useState(false)
  const focusedRef = useRef(null)

  useEffect(() => {
    const onZoneClick = (e) => {
      setFocusedZone(prev => {
        if (!e.detail) {
          focusedRef.current = null
          setCamFocus(null)
          return null
        }
        if (!prev) {
          focusedRef.current = e.detail
          // Le tiroir attend la fin de son animation avant de bouger la caméra
          if (e.detail.zone !== 'drawer') setCamFocus(e.detail)
          return e.detail
        }
        return prev
      })
      setZoomReady(false)
    }
    const onDrawerOpened = () => {
      // La caméra ne suit que si on est toujours focus sur le tiroir
      if (focusedRef.current?.zone === 'drawer') setCamFocus(focusedRef.current)
    }
    const onEscape = (e) => {
      if (e.key === 'Escape') {
        focusedRef.current = null
        setFocusedZone(null)
        setCamFocus(null)
        setZoomReady(false)
      }
    }
    window.addEventListener('zoneclick', onZoneClick)
    window.addEventListener('draweropened', onDrawerOpened)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('zoneclick', onZoneClick)
      window.removeEventListener('draweropened', onDrawerOpened)
      window.removeEventListener('keydown', onEscape)
    }
  }, [])

  return (
    <>
      <Cursor />
      <BgMusic src={`${import.meta.env.BASE_URL}music.mp3`} volume={0.4} />
      <Canvas
        camera={{ position: [5, 2, 5], fov: 45 }}
        gl={{ antialias: true, toneMappingExposure: 1, alpha: true }}
        style={{ background: 'transparent' }}
        shadows
      >
        <Suspense fallback={null}>
          <Lights />

          <Room focusedZone={focusedZone} />
          <ProjectCard focusedZone={focusedZone} zoomReady={zoomReady} />

          <ContactShadows
            position={[0, -2.1, 0]}
            opacity={0.5}
            scale={8}
            blur={2.5}
            far={3}
          />

          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.8}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.6}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>

        <OrbitControls
          makeDefault
          enableZoom={false}
          minDistance={0.5}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2.2}
          screenSpacePanning
          enableDamping
          dampingFactor={0.04}
        />
        <CameraController focusedZone={camFocus} onZoomReady={() => setZoomReady(true)} />
      </Canvas>

      <LoadingScreen />
    </>
  )
}
