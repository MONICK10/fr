import * as THREE from "three";

// Sky color keyframes: [progress 0..1, hex color]
const STOPS = [
  { t: 0.0, color: 0x0b1026 },
  { t: 0.4, color: 0x3a3a6e },
  { t: 0.75, color: 0xe8875a },
  { t: 1.0, color: 0xf5c15c },
];

const _a = new THREE.Color();
const _b = new THREE.Color();
const _out = new THREE.Color();

export function skyColorAt(progress) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (p >= STOPS[i].t && p <= STOPS[i + 1].t) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const span = hi.t - lo.t || 1;
  const localT = (p - lo.t) / span;
  _a.setHex(lo.color);
  _b.setHex(hi.color);
  _out.copy(_a).lerp(_b, localT);
  return _out.clone();
}

// Is the sky bright enough that dark text should be used instead of white?
export function isSkyBright(progress) {
  return progress > 0.62;
}

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.color = skyColorAt(0);
    this.scene.background = this.color;
    this.scene.fog = new THREE.Fog(this.color.getHex(), 12, 60);
  }

  update(progress) {
    this.color = skyColorAt(progress);
    this.scene.background = this.color;
    this.scene.fog.color = this.color;

    document.documentElement.style.setProperty(
      "--sky-hex",
      `#${this.color.getHexString()}`
    );
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", `#${this.color.getHexString()}`);

    const bright = isSkyBright(progress);
    document.body.classList.toggle("sky-bright", bright);
  }
}
