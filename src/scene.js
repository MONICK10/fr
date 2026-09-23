import * as THREE from "three";
import { curveOffsetAt, cameraZAt, PATH_START_Z } from "./layout.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.prefersReducedMotion = prefersReducedMotion;
    this.progress = 0;
    this.clock = new THREE.Clock();
    this.running = true;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 0.6, PATH_START_Z);

    this.renderer = this._createRenderer();

    this._addLights();
    this._addParticles();

    window.addEventListener("resize", () => this._onResize());
    window.addEventListener("orientationchange", () => this._onResize());
    document.addEventListener("visibilitychange", () => {
      this.running = document.visibilityState === "visible";
    });

    this.canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        this.contextLost = true;
      },
      false
    );
    this.canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost = false;
    });
  }

  _createRenderer() {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch (e) {
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  }

  static isWebGLAvailable() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  _addLights() {
    this.ambient = new THREE.AmbientLight(0x8fa3ff, 0.55);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xffe3b0, 0.9);
    this.keyLight.position.set(2, 4, 3);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.PointLight(0x7a8cff, 0.6, 40);
    this.rimLight.position.set(-4, 2, -2);
    this.scene.add(this.rimLight);
  }

  _addParticles() {
    const count = this.prefersReducedMotion ? 60 : 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 14 - 2;
      positions[i * 3 + 2] = -Math.random() * 100 + 6;
      speeds[i] = 0.05 + Math.random() * 0.12;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this._particleSpeeds = speeds;

    const material = new THREE.PointsMaterial({
      color: 0xfff3d6,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setProgress(progress) {
    this.progress = progress;
    const z = cameraZAt(progress);
    const offset = curveOffsetAt(z);
    this.camera.position.x = offset.x;
    this.camera.position.y = 0.6 + offset.y;
    this.camera.position.z = z;

    const lookZ = z - 8;
    const lookOffset = curveOffsetAt(lookZ);
    this.camera.lookAt(lookOffset.x, 0.5 + lookOffset.y, lookZ);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.renderer) this.renderer.setSize(w, h);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (!this.prefersReducedMotion && this.particles) {
      const pos = this.particles.geometry.attributes.position;
      for (let i = 0; i < this._particleSpeeds.length; i++) {
        let y = pos.getY(i) + this._particleSpeeds[i] * dt;
        if (y > 12) y = -2;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    return dt;
  }

  render() {
    if (!this.renderer || this.contextLost) return;
    this.renderer.render(this.scene, this.camera);
  }
}
