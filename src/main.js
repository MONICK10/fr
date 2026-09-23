import "@fontsource/playfair-display/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/300.css";
import "./style.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SceneManager } from "./scene.js";
import { PhotoField } from "./photos.js";
import { Sky } from "./sky.js";
import { UI } from "./ui.js";
import { stanzas } from "./poem.js";
import { STANZA_COUNT } from "./layout.js";
import { initGate } from "./gate.js";

gsap.registerPlugin(ScrollTrigger);

// Set to true to enable background music. It will only start after the
// visitor taps "Tap to begin" (iOS blocks autoplay before a tap).
const ENABLE_MUSIC = false;

const NEAR_SHOW_THRESHOLD = 0.32;
const OUTRO_PROGRESS = 0.985;

const ui = new UI();

initGate(() => {
  if (!SceneManager.isWebGLAvailable()) {
    startFallback();
  } else {
    startExperience();
  }
});

function setupScrollSpacer() {
  const spacer = document.getElementById("scroll-spacer");
  spacer.style.height = `${(STANZA_COUNT + 1) * 100}vh`;
}

function setupMusic() {
  if (!ENABLE_MUSIC) return null;
  const audio = new Audio("/music.mp3");
  audio.loop = true;
  audio.volume = 0.5;
  ui.showMuteButton((muted) => {
    audio.muted = muted;
  });
  return audio;
}

function startExperience() {
  setupScrollSpacer();

  const canvas = document.getElementById("scene-canvas");
  const sceneManager = new SceneManager(canvas);
  const photoField = new PhotoField(sceneManager.scene);
  const sky = new Sky(sceneManager.scene);
  const music = setupMusic();

  let outroShown = false;

  ui.onBegin(() => {
    if (music) {
      music.play().catch(() => {});
    }
  });

  ScrollTrigger.create({
    trigger: "#scroll-spacer",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      const progress = self.progress;
      sceneManager.setProgress(progress);
      sky.update(progress);

      const items = photoField.updateByCameraZ(
        sceneManager.camera.position.z,
        performance.now() / 1000,
        sceneManager.prefersReducedMotion
      );

      let nearest = items[0];
      for (const item of items) {
        if (item.nearness > nearest.nearness) nearest = item;
      }

      if (progress >= OUTRO_PROGRESS) {
        if (!outroShown) {
          outroShown = true;
          ui.hideStanza();
          ui.showOutro();
        }
      } else {
        if (outroShown) {
          outroShown = false;
          ui.hideOutro();
        }
        if (nearest.nearness >= NEAR_SHOW_THRESHOLD) {
          ui.showStanza(nearest.index);
        } else {
          ui.hideStanza();
        }
      }
    },
  });

  function loop() {
    requestAnimationFrame(loop);
    if (!sceneManager.running) return;
    sceneManager.tick();
    photoField.updateByCameraZ(
      sceneManager.camera.position.z,
      performance.now() / 1000,
      sceneManager.prefersReducedMotion
    );
    sceneManager.render();
  }
  loop();
}

function startFallback() {
  document.getElementById("scene-canvas").hidden = true;
  document.getElementById("hud").hidden = true;
  document.getElementById("scroll-spacer").hidden = true;

  const container = document.createElement("div");
  container.className = "fallback";

  stanzas.forEach((stanza, i) => {
    const card = document.createElement("section");
    card.className = `fallback-card ${i % 2 === 0 ? "left" : "right"}`;

    const img = document.createElement("img");
    img.className = "fallback-photo";
    img.loading = "lazy";
    img.alt = `Photo ${i + 1}`;
    img.src = stanza.image;
    img.onerror = () => {
      img.style.background = `hsl(${(i * 37) % 360}, 35%, 25%)`;
    };

    const text = document.createElement("div");
    text.className = "fallback-text";
    const idx = document.createElement("div");
    idx.className = "stanza-index";
    idx.textContent = `${i + 1} / ${stanzas.length}`;
    text.appendChild(idx);
    stanza.lines.forEach((line) => {
      const p = document.createElement("p");
      p.className = "stanza-line visible";
      p.textContent = line;
      text.appendChild(p);
    });

    card.appendChild(img);
    card.appendChild(text);
    container.appendChild(card);
  });

  const outro = document.createElement("p");
  outro.className = "outro-text visible fallback-outro";
  outro.textContent = document.querySelector(".outro-text").textContent;
  container.appendChild(outro);

  document.getElementById("app").appendChild(container);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in-view");
      });
    },
    { threshold: 0.25 }
  );
  container.querySelectorAll(".fallback-card").forEach((el) => observer.observe(el));

  ui.onBegin(() => {});
  document.body.classList.add("fallback-mode");
}
