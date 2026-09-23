import { stanzas, ENDING_TEXT } from "./poem.js";

export class UI {
  constructor() {
    this.intro = document.getElementById("intro");
    this.beginBtn = document.getElementById("begin-btn");
    this.hud = document.getElementById("hud");
    this.stanzaPanel = document.getElementById("stanza-panel");
    this.stanzaIndexEl = document.getElementById("stanza-index");
    this.stanzaLinesEl = document.getElementById("stanza-lines");
    this.dotsContainer = document.getElementById("progress-dots");
    this.outro = document.getElementById("outro");
    this.muteBtn = document.getElementById("mute-btn");

    this.activeStanza = -1;
    this._lineTimers = [];

    this._buildDots();
    this._buildStars(this.intro.querySelector(".stars-layer"));
    const gate = document.getElementById("gate");
    if (gate) this._buildStars(gate.querySelector(".stars-layer"), 40);

    document.querySelector(".outro-text").textContent = ENDING_TEXT;
  }

  _buildStars(layer, count = 60) {
    if (!layer) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 70}%`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      star.style.setProperty("--s", `${0.5 + Math.random() * 1.5}px`);
      frag.appendChild(star);
    }
    layer.appendChild(frag);
  }

  _buildDots() {
    stanzas.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.dataset.index = String(i);
      this.dotsContainer.appendChild(dot);
    });
    this._dots = Array.from(this.dotsContainer.children);
  }

  onBegin(cb) {
    const start = () => {
      this.intro.classList.add("hidden");
      setTimeout(() => (this.intro.hidden = true), 700);
      cb();
    };
    this.beginBtn.addEventListener("click", start, { once: true });
  }

  setActiveDot(index) {
    this._dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  showStanza(index) {
    if (this.activeStanza === index) return;
    this.activeStanza = index;
    this._lineTimers.forEach((t) => clearTimeout(t));
    this._lineTimers = [];

    const stanza = stanzas[index];
    this.stanzaIndexEl.textContent = `${index + 1} / ${stanzas.length}`;
    this.stanzaLinesEl.innerHTML = "";

    stanza.lines.forEach((line, i) => {
      const p = document.createElement("p");
      p.className = "stanza-line";
      p.textContent = line;
      this.stanzaLinesEl.appendChild(p);
      const timer = setTimeout(() => p.classList.add("visible"), 120 + i * 260);
      this._lineTimers.push(timer);
    });

    this.stanzaPanel.classList.add("visible");
    this.setActiveDot(index);
  }

  hideStanza() {
    if (this.activeStanza === -1) return;
    this.activeStanza = -1;
    this.stanzaPanel.classList.remove("visible");
  }

  showOutro() {
    this.outro.hidden = false;
    requestAnimationFrame(() => this.outro.classList.add("visible"));
  }

  hideOutro() {
    this.outro.classList.remove("visible");
    this.outro.hidden = true;
  }

  showMuteButton(onToggle) {
    this.muteBtn.hidden = false;
    let muted = false;
    this.muteBtn.addEventListener("click", () => {
      muted = !muted;
      this.muteBtn.innerHTML = muted ? "&#128263;" : "&#128266;";
      onToggle(muted);
    });
  }
}
