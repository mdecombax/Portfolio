import { useGLTF, useVideoTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { extraInteractive } from './interactiveRegistry'

// Distance d'ouverture du tiroir, en unités locales de group1 (profondeur ≈ 1.69)
const DRAWER_OPEN = 1.15

// Préfixe d'URL des assets (gère le base Vite, ex. '/Portfolio/' en prod)
const BASE = import.meta.env.BASE_URL

export default function Room({ focusedZone, isMobile = false }) {
  const { scene } = useGLTF(`${BASE}room.glb`)
  const { camera, raycaster, pointer } = useThree()
  const tvTexture = useVideoTexture(`${BASE}tv.mp4`, { loop: true, muted: true, autoplay: true, crossOrigin: 'anonymous' })
  const hoveredZoneRef = useRef(null)
  const labelPos = useRef({})
  const interactiveMeshes = useRef([])
  // Tiroirs : façade + poignée à glisser ensemble le long de +X local
  const drawerParts = useRef([])
  const drawerOpen = useRef(false)
  const drawerProgress = useRef(0)
  const focusedRef = useRef(null)
  // Ref (pas dep d'effet) pour éviter de relancer la lourde init au changement
  // de breakpoint, ce qui dupliquerait l'intérieur des tiroirs.
  const isMobileRef = useRef(isMobile)
  useEffect(() => { isMobileRef.current = isMobile }, [isMobile])

  const { scale, position } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z)
    const s = 4 / maxDim
    return {
      scale: s,
      position: [-center.x * s, -center.y * s, -center.z * s],
    }
  }, [scene])

  useEffect(() => {
    const meshes = []
    const zoneBoxes = {}

    // Marque un mesh comme cliquable : clone matériau, prépare l'emissive de hover,
    // assigne la zone et accumule la box par zone (pour positionner le label).
    const addToZone = (child, zone) => {
      child.material = child.material.clone()
      if (child.material.emissive) {
        child.material.emissive.set(0xaaccff)
        child.material.emissiveIntensity = 0
      }
      child.userData.zone = zone
      meshes.push(child)
      if (!zoneBoxes[zone]) zoneBoxes[zone] = new THREE.Box3()
      zoneBoxes[zone].expandByObject(child)
    }

    const daftPunkTex = new THREE.TextureLoader().load(`${BASE}daftpunk.jpg`)
    daftPunkTex.flipY = true

    scene.traverse((child) => {
      if (!child.isMesh) return

      if (child.name === 'pPlane13_DB_0') {
        child.material = child.material.clone()
        child.material.map = daftPunkTex
        child.material.color.set(0xffffff)
        child.material.needsUpdate = true
      }

      // Écran TV : vidéo en boucle
      if (child.name === 'polySurface3_TV_Shinji_0') {
        tvTexture.flipY = true
        child.material = child.material.clone()
        child.material.map = tvTexture
        child.material.emissiveMap = tvTexture
        child.material.emissive.set(0xffffff)
        child.material.emissiveIntensity = 0.6
        child.material.needsUpdate = true
      }

      // Ampoules au-dessus de la TV : blanc pur + ei élevé → halo bloom
      if (child.name === 'Bombillo_Luz_0' || child.name === 'Bombillo_Foco_0') {
        child.material = child.material.clone()
        child.material.color.set(0xffe8b0)
        child.material.emissive.set(0xffcc55)
        child.material.emissiveIntensity = 0.4
        child.material.roughness = 0.95
      }

      let node = child
      while (node) {
        if (node.name === 'pCube37') { addToZone(child, 'screen'); break }
        if (node.name === 'pCube231') { addToZone(child, 'phone'); break }
        // group1 = table de chevet gauche (BlackWood + poignées toriques)
        if (node.name === 'group1') { addToZone(child, 'drawer'); break }
        node = node.parent
      }
    })

    // Éloigner la chaise de l'écran
    // Silla world: [0.918, -0.917, -1.564] — pCube37 world: [-1.023, -0.132, -1.176]
    // Direction screen→chair normalisée ≈ [0.981, 0, -0.196] ; déplacement de 0.6 unité
    const silla = scene.getObjectByName('Silla')
    if (silla?.parent) {
      const currentWorld = new THREE.Vector3()
      silla.getWorldPosition(currentWorld)
      const dir = new THREE.Vector3(0.981, 0, -0.196)
      const newWorld = currentWorld.clone().addScaledVector(dir, 0.3)
      silla.parent.worldToLocal(newWorld)
      silla.position.copy(newWorld)
    }


    interactiveMeshes.current = meshes

    // Tiroirs coulissants : haut = pCube229 + pTorus1, bas = pCube230 + pTorus2.
    // factor décale légèrement l'amplitude pour un effet en cascade. Le glissement
    // suit la normale réelle de la façade (axe X local du bloc, légèrement incliné)
    // et non X monde, sinon le tiroir sort de travers et laisse une fente sur le bord.
    const drawerDefs = [
      { front: 'pCube229', parts: ['pCube229', 'pTorus1'], factor: 1.0 },
      { front: 'pCube230', parts: ['pCube230', 'pTorus2'], factor: 0.82 },
    ]
    drawerParts.current = []
    for (const { front, parts, factor } of drawerDefs) {
      const frontNode = scene.getObjectByName(front)
      if (!frontNode) continue
      frontNode.updateMatrix()
      // Direction de sortie = axe X local de la façade, exprimé dans le repère de group1
      const dir = new THREE.Vector3().setFromMatrixColumn(frontNode.matrix, 0).normalize()
      for (const name of parts) {
        const node = scene.getObjectByName(name)
        if (node) drawerParts.current.push({ node, rest: node.position.clone(), dir, factor })
      }
    }

    // Les tiroirs du GLB sont des blocs pleins. On masque chaque bloc et on le
    // remplace par un caisson creux (façade + fond + 2 côtés + plancher, dessus
    // ouvert) construit dans l'espace cube unitaire [-0.5, 0.5] du node. Enfants
    // du node → ils suivent automatiquement le coulissement.
    const buildDrawerInterior = (groupName) => {
      const group = scene.getObjectByName(groupName)
      if (!group) return
      const block = group.children.find((c) => c.isMesh)
      if (!block) return

      const woodMat = block.material.clone()
      if (woodMat.emissive) woodMat.emissiveIntensity = 0
      block.visible = false

      // Plancher / intérieur plus sombre pour creuser visuellement la cavité
      const innerMat = woodMat.clone()
      innerMat.color = woodMat.color.clone().multiplyScalar(0.4)
      innerMat.roughness = 1
      if (innerMat.emissive) innerMat.emissive.set(0x000000)

      const t = 0.06
      const panels = [
        { size: [t, 1, 1], pos: [0.5 - t / 2, 0, 0], mat: woodMat },        // façade (+X, poignée)
        { size: [t, 1, 1], pos: [-0.5 + t / 2, 0, 0], mat: woodMat },       // fond
        { size: [1, 1, t], pos: [0, 0, -0.5 + t / 2], mat: woodMat },       // côté -Z
        { size: [1, 1, t], pos: [0, 0, 0.5 - t / 2], mat: woodMat },        // côté +Z
        { size: [1, 0.22, 1], pos: [0, -0.27, 0], mat: innerMat },          // plancher (surface ≈ -0.16)
      ]
      for (const p of panels) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(...p.size), p.mat)
        m.position.set(...p.pos)
        m.castShadow = true
        m.receiveShadow = true
        group.add(m)
      }
    }
    buildDrawerInterior('pCube229')
    buildDrawerInterior('pCube230')

    // Position de label par zone (centroïde de la box, légèrement remontée)
    const positions = {}
    for (const [zone, b] of Object.entries(zoneBoxes)) {
      const c = new THREE.Vector3()
      b.getCenter(c)
      c.y += 0.25
      positions[zone] = c
    }
    labelPos.current = positions

    let downX = 0
    let downY = 0

    const onMouseDown = (e) => {
      downX = e.clientX
      downY = e.clientY
    }

    const onMouseUp = (e) => {
      // Sur mobile, la navigation passe par les hotspots / stepper, pas le raycast
      if (isMobileRef.current) return
      const dx = e.clientX - downX
      const dy = e.clientY - downY
      if (dx * dx + dy * dy > 25) return

      const canvas = document.querySelector('canvas')
      const rect = canvas
        ? canvas.getBoundingClientRect()
        : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera({ x: nx, y: ny }, camera)
      const hits = raycaster.intersectObjects(
        [...interactiveMeshes.current, ...extraInteractive.meshes],
        false,
      )

      if (hits.length > 0) {
        const zone = hits[0].object.userData.zone
        const lp = labelPos.current[zone] ?? extraInteractive.labelPos[zone]
        window.dispatchEvent(new CustomEvent('zoneclick', {
          detail: { zone, position: lp ? lp.clone() : null },
        }))
      } else {
        window.dispatchEvent(new CustomEvent('zoneclick', { detail: null }))
      }
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [scene, tvTexture])

  // Le tiroir s'ouvre quand sa zone est focus, se referme sinon
  useEffect(() => {
    focusedRef.current = focusedZone
    drawerOpen.current = focusedZone?.zone === 'drawer'
  }, [focusedZone])

  useFrame((state, delta) => {
    // Animation du tiroir : progression lissée vers ouvert (1) / fermé (0)
    const target = drawerOpen.current ? 1 : 0
    const prev = drawerProgress.current
    const f = Math.min(0.12 * delta * 60, 1)
    drawerProgress.current = THREE.MathUtils.lerp(prev, target, f)
    // Easing easeOutCubic pour un glissement qui ralentit en fin de course
    const p = drawerProgress.current
    const eased = 1 - Math.pow(1 - p, 3)
    drawerParts.current.forEach(({ node, rest, dir, factor }) => {
      node.position.copy(rest).addScaledVector(dir, eased * DRAWER_OPEN * factor)
    })
    // Tiroir complètement ouvert : on signale pour enchaîner le mouvement caméra
    if (target === 1 && prev < 0.985 && drawerProgress.current >= 0.985) {
      window.dispatchEvent(new Event('draweropened'))
    }

    // Survol : raycast au pointeur — desktop uniquement (pas de hover tactile).
    let zone = null
    if (!isMobileRef.current) {
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(
        [...interactiveMeshes.current, ...extraInteractive.meshes],
      )
      zone = hits.length > 0 ? hits[0].object.userData.zone : null

      if (zone !== hoveredZoneRef.current) {
        hoveredZoneRef.current = zone

        let detail = null
        // Position du label = point d'impact réel du raycast (toujours sur la zone,
        // sous le curseur). Les centroïdes Box3 (labelPos) sont peu fiables et
        // plaçaient les tips de phone/drawer au niveau du bureau.
        if (zone && hits.length > 0) {
          const projected = hits[0].point.clone().project(camera)
          detail = {
            zone,
            x: (projected.x * 0.5 + 0.5) * window.innerWidth,
            y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
          }
        }
        window.dispatchEvent(new CustomEvent('hoveredzone', { detail }))
      }
    }

    // Halo des zones cliquables (room.glb + robot) :
    //  - zone en focus → éteint (panel ouvert)
    //  - zone survolée → plein éclat
    //  - au repos → pulsation d'invite permanente (signale que c'est cliquable)
    const hovered = focusedRef.current ? null : zone
    const focusedZone = focusedRef.current?.zone
    const pulse = 0.22 + 0.14 * Math.sin(state.clock.elapsedTime * 2)
    const applyGlow = (mesh) => {
      if (!mesh.material.emissive) return
      const z = mesh.userData.zone
      const target = z === focusedZone ? 0 : z === hovered ? 0.7 : pulse
      mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        mesh.material.emissiveIntensity,
        target,
        0.12
      )
    }
    interactiveMeshes.current.forEach(applyGlow)
    extraInteractive.meshes.forEach(applyGlow)
  })

  return <primitive object={scene} scale={scale} position={position} />
}

useGLTF.preload(`${import.meta.env.BASE_URL}room.glb`)
