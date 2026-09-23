// A simple "who has the password can come in" gate. This is NOT real
// security — the password lives in this file and anyone can read it via
// view-source. It's just a polite lock so a random link-guesser can't
// wander in, and once unlocked on a device it stays unlocked there.

const PASSWORD = "panda10";
const STORAGE_KEY = "mahi-poem-unlocked";

function alreadyUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function rememberUnlocked() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch (e) {
    // ignore storage failures (private browsing etc.) — gate simply
    // reappears next visit, which is a fine fallback.
  }
}

export function initGate(onUnlock) {
  const gate = document.getElementById("gate");

  if (alreadyUnlocked()) {
    gate.hidden = true;
    onUnlock();
    return;
  }

  document.body.classList.add("locked");

  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-input");
  const error = document.getElementById("gate-error");

  const unlock = () => {
    rememberUnlocked();
    document.body.classList.remove("locked");
    gate.classList.add("hidden");
    setTimeout(() => {
      gate.hidden = true;
    }, 700);
    onUnlock();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value.trim().toLowerCase();
    if (value === PASSWORD) {
      unlock();
    } else {
      error.textContent = "That's not it — try again.";
      input.value = "";
      input.focus();
      gate.classList.add("shake");
      setTimeout(() => gate.classList.remove("shake"), 400);
    }
  });

  input.focus({ preventScroll: true });
}
