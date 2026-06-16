# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm run dev      # Serveur de développement (Vite, hot reload)
npm run build    # Build de production
npm run preview  # Prévisualiser le build de production
```

Pas de linter ni de tests configurés dans ce projet.

## Architecture

Portfolio 3D interactif — scène Three.js d'une chambre au coucher du soleil, chargée depuis un modèle GLB.

**Pile technique** : React 18 + Vite + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`) + postprocessing (`@react-three/postprocessing`)

**Flux de rendu** :
1. `index.html` définit le fond dégradé coucher de soleil (CSS pur, `overflow: hidden`)
2. `src/main.jsx` monte React en mode strict
3. `src/App.jsx` — composant racine :
   - `<Canvas>` R3F avec caméra fixe (`position: [5,2,5]`, `fov: 45`) et ombres activées
   - `<Lights>` — rig lumières coucher de soleil (ambiant chaud + directionnel orange + plusieurs pointLights dont une TV qui pulse via `useFrame`)
   - `<Room>` — le modèle GLB
   - `<ContactShadows>` au sol (`y: -2.1`)
   - `<EffectComposer>` avec `<Bloom>` (seuil luminance 0.7)
   - `<OrbitControls>` sans pan, distance limitée [3–10], angle polaire plafonné
4. `src/components/Room.jsx` — charge `public/room.glb` via `useGLTF`, calcule automatiquement scale + centrage avec `THREE.Box3`, rend un `<primitive>`

**Asset 3D** : `public/room.glb` — servi statiquement par Vite (déclaré dans `assetsInclude`). Vite expose les `.glb`/`.gltf` comme assets.

**Esthétique lumière** : palette coucher de soleil — ambiant `#ffaa55`, directionnelle `#ff8020`, rebonds `#ffb347` et `#ff5500`, contre-lumière `#ff3377`, TV froide `#aaccff` pulsante.

## Points d'extension prévus

D'après le concept du projet (voir mémoire) : ajout d'un personnage 3D, objets cliquables dans la chambre liés à des projets, et éventuellement des overlays UI HTML par-dessus le canvas.
