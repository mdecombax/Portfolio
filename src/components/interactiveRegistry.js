// Registre partagé pour les objets cliquables qui ne font PAS partie de room.glb
// (ex. le robot, chargé séparément). Room lit ce registre pour les inclure dans
// ses raycasts de clic/survol et pour positionner le label/panel de leur zone.
//
// - meshes   : tableau de THREE.Mesh préparés (material cloné, emissive prête,
//              userData.zone défini). Room concatène ce tableau à interactiveMeshes.
// - labelPos : { [zone]: THREE.Vector3 } centre world remonté, pour le hover label
//              et le fallback de position du panel.
export const extraInteractive = {
  meshes: [],
  labelPos: {},
}
