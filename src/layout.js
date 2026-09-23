import * as THREE from "three";

export const STANZA_COUNT = 9;
export const SEGMENT_LENGTH = 10; // world units between photos along the path
export const PATH_START_Z = 4; // camera starting Z (in front of first photo)
export const PATH_END_Z = -(STANZA_COUNT - 1) * SEGMENT_LENGTH - 6;

// Gentle left/right drift + slight vertical breathing of the path itself,
// driven purely by Z so camera and photos can share the same curve.
export function curveOffsetAt(z) {
  const x = Math.sin(z * 0.045) * 2.2;
  const y = Math.sin(z * 0.03 + 1.4) * 0.6;
  return { x, y };
}

export function cameraZAt(progress) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  return THREE.MathUtils.lerp(PATH_START_Z, PATH_END_Z, p);
}

export function photoWorldPosition(index) {
  const z = -index * SEGMENT_LENGTH;
  const side = index % 2 === 0 ? -1 : 1; // 0-based: photo1(left), photo2(right)...
  const offset = curveOffsetAt(z);
  const x = offset.x + side * 3.4;
  const y = offset.y + (Math.sin(index * 1.7) * 0.4);
  return new THREE.Vector3(x, y, z);
}
