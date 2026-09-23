import * as THREE from "three";
import { stanzas } from "./poem.js";
import { photoWorldPosition, SEGMENT_LENGTH, curveOffsetAt } from "./layout.js";
import { withBase } from "./base.js";

const NEAR_RANGE = SEGMENT_LENGTH * 0.85; // distance at which a photo is "active"
const loader = new THREE.TextureLoader();

function placeholderTexture(hueSeed, label) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const hue = (hueSeed * 37) % 360;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, `hsl(${hue}, 35%, 30%)`);
  grad.addColorStop(1, `hsl(${(hue + 40) % 360}, 35%, 18%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 200px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, size / 2, size / 2);

  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("replace in /public/images", size / 2, size - 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Extra photos with no stanza of their own: just hung further out in space
// as ambient decoration, the same way you'd pin a couple of loose photos
// around the main ones on a wall.
const EXTRA_PHOTOS = [
  { image: "/images/extra-01.jpg", z: -2.5 * SEGMENT_LENGTH, side: 1, xReach: 5.6, y: 1.6 },
  { image: "/images/extra-02.jpg", z: -6.5 * SEGMENT_LENGTH, side: -1, xReach: 5.9, y: -1.3 },
];

export class PhotoField {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.extras = [];
    this.usingPlaceholder = [];
    this._buildAll();
    this._buildExtras();
  }

  _buildFrame({ image, position, rotationY, tilt, width, height, placeholderLabel, placeholderHue }) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotationY;
    group.rotation.z = tilt;

    const borderPad = 0.16 * (width / 2.6);

    // drop shadow, slightly behind and offset
    const shadowGeo = new THREE.PlaneGeometry(
      width + borderPad * 2.6,
      height + borderPad * 2.6
    );
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0.06, -0.08, -0.02);
    group.add(shadow);

    // white printed-photo border
    const frameGeo = new THREE.PlaneGeometry(width + borderPad * 2, height + borderPad * 2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xfaf7f0,
      roughness: 0.85,
      metalness: 0,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.01;
    group.add(frame);

    // the photo itself
    const photoGeo = new THREE.PlaneGeometry(width, height);
    const photoMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0,
      transparent: true,
      opacity: 0.98,
    });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    group.add(photo);

    loader.load(
      withBase(image),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        photoMat.map = tex;
        photoMat.needsUpdate = true;
      },
      undefined,
      () => {
        const tex = placeholderTexture(placeholderHue, placeholderLabel);
        photoMat.map = tex;
        photoMat.needsUpdate = true;
      }
    );

    this.scene.add(group);

    return { group, photoMat, frameMat, frameBaseColor: frameMat.color.clone() };
  }

  _buildAll() {
    stanzas.forEach((stanza, index) => {
      const pos = photoWorldPosition(index);
      const side = index % 2 === 0 ? -1 : 1;
      const tilt = THREE.MathUtils.degToRad(Math.random() * 12 - 6);

      const frame = this._buildFrame({
        image: stanza.image,
        position: pos,
        rotationY: side * 0.35,
        tilt,
        width: 2.6,
        height: 2.6,
        placeholderLabel: String(index + 1).padStart(2, "0"),
        placeholderHue: index,
      });

      this.usingPlaceholder[index] = false;

      this.items.push({
        index,
        ...frame,
        baseY: pos.y,
        baseRotZ: tilt,
        floatSeed: Math.random() * Math.PI * 2,
        z: pos.z,
        nearness: 0,
      });
    });
  }

  _buildExtras() {
    EXTRA_PHOTOS.forEach((extra, i) => {
      const offset = curveOffsetAt(extra.z);
      const pos = new THREE.Vector3(offset.x + extra.side * extra.xReach, offset.y + extra.y, extra.z);
      const tilt = THREE.MathUtils.degToRad(Math.random() * 16 - 8);

      const frame = this._buildFrame({
        image: extra.image,
        position: pos,
        rotationY: extra.side * 0.5,
        tilt,
        width: 1.9,
        height: 1.9,
        placeholderLabel: "+",
        placeholderHue: 20 + i * 11,
      });

      this.extras.push({
        ...frame,
        baseY: pos.y,
        baseRotZ: tilt,
        floatSeed: Math.random() * Math.PI * 2,
        z: extra.z,
      });
    });
  }

  _updateFloatAndDistance(entry, cameraZ, time, reducedMotion) {
    const dist = Math.abs(cameraZ - entry.z);
    const nearness = THREE.MathUtils.clamp(1 - dist / NEAR_RANGE, 0, 1);

    if (!reducedMotion) {
      const floatY = Math.sin(time * 0.7 + entry.floatSeed) * 0.12;
      entry.group.position.y = entry.baseY + floatY;
      entry.group.rotation.z = entry.baseRotZ + Math.sin(time * 0.2 + entry.floatSeed) * 0.02;
    }

    // brighten when near, keeping each material's own hue
    const brightness = 0.55 + nearness * 0.55;
    entry.photoMat.opacity = 0.85 + nearness * 0.15;
    entry.photoMat.color.setScalar(Math.min(brightness, 1));
    const frameBrightness = Math.min(0.78 + nearness * 0.22, 1);
    entry.frameMat.color.copy(entry.frameBaseColor).multiplyScalar(frameBrightness);

    return nearness;
  }

  /** Returns array of { index, nearness (0..1) } for the 9 stanza photos */
  updateByCameraZ(cameraZ, time, reducedMotion) {
    for (const item of this.items) {
      item.nearness = this._updateFloatAndDistance(item, cameraZ, time, reducedMotion);
    }
    for (const extra of this.extras) {
      this._updateFloatAndDistance(extra, cameraZ, time, reducedMotion);
    }
    return this.items;
  }
}
