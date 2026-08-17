/* ============================================================
   EYESON — THEME.JS
   Eye-shaped dark/light toggle. The eye blinks naturally, its
   pupil follows the cursor, and switching themes plays an
   open/close eyelid animation before the theme swaps.
   ============================================================ */

/* Apply the saved (or default) theme immediately — called on every page */
function initTheme() {
  const saved = store.get("theme", "light");
  document.documentElement.setAttribute("data-theme", saved);
  syncToggleState(saved);
}

/* Keep the toggle eye visually in sync (closed lid = dark mode) */
function syncToggleState(theme) {
  const toggle = document.getElementById("themeToggle");
  if (toggle) toggle.classList.toggle("closed", theme === "dark");
}

/* Full switch: close/open the eye, then flip the CSS variables */
function toggleTheme() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";

  /* 1 — eyelid closes (0.7s) while the page still holds its theme */
  toggle.classList.add("closed");
  setTimeout(() => {
    /* 2 — theme swaps behind the closed lid */
    document.documentElement.setAttribute("data-theme", next);
    store.set("theme", next);
    /* 3 — the eye reopens with a warm iris glow */
    toggle.classList.remove("closed");
    toggle.classList.add("opening");
    setTimeout(() => toggle.classList.remove("opening"), 800);
  }, 700);
}

/* Natural blinking every 8–12 seconds + pupil cursor-follow */
function initEyeLife() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  /* Random-interval blink */
  (function blinkLoop() {
    setTimeout(() => {
      if (!toggle.classList.contains("closed")) {
        toggle.classList.add("closed");
        setTimeout(() => toggle.classList.remove("closed"), 180);
      }
      blinkLoop();
    }, 8000 + Math.random() * 4000);
  })();

  /* Pupil subtly follows the cursor */
  const pupil = toggle.querySelector(".pupil");
  const eyeBox = () => toggle.getBoundingClientRect();
  document.addEventListener("mousemove", (e) => {
    if (!pupil) return;
    const r = eyeBox();
    const dx = Math.max(-2.4, Math.min(2.4, (e.clientX - (r.left + r.width / 2)) / 90));
    const dy = Math.max(-1.6, Math.min(1.6, (e.clientY - (r.top + r.height / 2)) / 90));
    pupil.setAttribute("transform", "translate(" + dx + " " + dy + ")");
  });

  toggle.addEventListener("click", toggleTheme);
  toggle.addEventListener("mouseenter", () => {
    toggle.style.filter = "drop-shadow(0 0 10px var(--glow))";
  });
  toggle.addEventListener("mouseleave", () => { toggle.style.filter = ""; });
}
