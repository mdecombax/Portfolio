import { useGLTF } from '@react-three/drei'
import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { extraInteractive } from './interactiveRegistry'

const BASE = import.meta.env.BASE_URL

// Position de départ : sur l'étagère en verre du dessus (polySurface10_Vidrio),
// surface ≈ y -0.106, centrée en x -1.09 / z -0.20. Orienté face au lit (côté +X).
// Ajustable en direct via window.debug.robot.* (voir plus bas).
const START = {
  pos: [-1.05, -0.106, -0.15], // base posée sur l'étagère du dessus
  rotY: 1.76,                  // orientation (radians) — face vers le lit
  height: 0.32,                // hauteur cible du robot en unités world
}

export default function Robot() {
  const { scene } = useGLTF(`${BASE}robot.glb`)
  const groupRef = useRef()

  // Clone pour pouvoir réutiliser le GLB sans muter le cache de useGLTF
  const robot = useMemo(() => scene.clone(true), [scene])

  // Auto-scale vers START.height + recentrage horizontal, base posée à y=0 local
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(robot)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const s = START.height / size.y
    return {
      scale: s,
      // décale le modèle pour que sa base (box.min.y) soit à 0 et qu'il soit
      // centré en x/z, puis on positionne le groupe parent où on veut
      offset: [-center.x, -box.min.y, -center.z],
    }
  }, [robot])

  useEffect(() => {
    const meshes = []

    robot.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true
      child.material = child.material.clone()
      if (child.material.emissive) {
        // garde l'emissive d'origine du robot, on ajoute le halo de hover via intensity
        child.material.userData = { baseEmissive: child.material.emissive.clone() }
      }
      child.userData.zone = 'robot'
      meshes.push(child)
    })

    extraInteractive.meshes = meshes

    // Label/hover : centre world déterministe depuis START (expandByObject peu
    // fiable tant que les matrices monde ne sont pas à jour)
    extraInteractive.labelPos.robot = new THREE.Vector3(
      START.pos[0],
      START.pos[1] + START.height / 2 + 0.18,
      START.pos[2],
    )

    // --- Debug console : window.debug.robot ---
    if (typeof window !== 'undefined') {
      window.debug = window.debug || {}
      window.debug.robot = {
        pos: (x, y, z) => { if (groupRef.current) groupRef.current.position.set(x, y, z); window.debug.robot.log() },
        rot: (ry) => { if (groupRef.current) groupRef.current.rotation.y = ry; window.debug.robot.log() },
        scale: (s) => { if (groupRef.current) groupRef.current.scale.setScalar(s); window.debug.robot.log() },
        log: () => {
          const g = groupRef.current
          if (!g) return
          console.log('[robot] pos', g.position.toArray().map(v => +v.toFixed(3)),
                      'rotY', +g.rotation.y.toFixed(3),
                      'scale', +g.scale.x.toFixed(3))
        },
      }
    }

    return () => { extraInteractive.meshes = []; delete extraInteractive.labelPos.robot }
  }, [robot])

  return (
    <group
      ref={groupRef}
      position={START.pos}
      rotation={[0, START.rotY, 0]}
      scale={fit.scale}
    >
      <primitive object={robot} position={fit.offset} />
    </group>
  )
}

useGLTF.preload(`${import.meta.env.BASE_URL}robot.glb`)
