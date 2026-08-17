/* ============================================================
   EYESON — ANIMATIONS.JS
   Scroll reveals (IntersectionObserver), header scroll state,
   hero parallax, magnetic buttons, back-to-top.
   ============================================================ */

/* Reveal every .reveal / .reveal-left / .reveal-right on scroll */
function initReveals() {
  const els = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
  if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("visible")); return; }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); } }),
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

/* Scroll-linked effects, driven by requestAnimationFrame for 60 FPS.
   Only transform/opacity are touched — no layout reads inside the loop. */
function initHeaderScroll() {
  const header = document.getElementById("siteHeader");
  const top = document.getElementById("backTop");
  const heroLogo = document.querySelector(".hero-logo");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;

  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };

  const update = () => {
    ticking = false;
    const y = window.scrollY;

    /* Header becomes solid once we leave the very top */
    if (header) header.classList.toggle("scrolled", y > 40);
    if (top) top.classList.toggle("show", y > 600);

    /* Hero logo recede — only when the hero is on screen */
    if (heroLogo && !prefersReduced && y < window.innerHeight) {
      /* Clamp raw progress strictly to [0, 1] — never negative, never > 1 */
      const target = Math.min(1, Math.max(0, y / (window.innerHeight * 0.6)));
      /* Critically-damped smoothing: eases toward the target every frame
         with zero overshoot and zero bounce (luxury feel). */
      smoothTo(heroLogo, target);
    }
  };

  /* Frame-loop smoother — one shared loop, starts only while animating */
  const animating = new WeakMap();
  function smoothTo(el, target) {
    let current = parseFloat(el.dataset.p || "0");
    function step() {
      current += (target - current) * 0.14;              // exponential ease
      if (Math.abs(target - current) < 0.001) current = target; // settle exactly
      el.dataset.p = current.toFixed(4);
      el.style.setProperty("--p", current.toFixed(4));   // CSS does scale/translate/opacity
      if (current !== target) requestAnimationFrame(step);
      else animating.delete(el);
    }
    if (!animating.has(el)) { animating.set(el, true); requestAnimationFrame(step); }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();

  if (top) top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* Boot all global motion */
function initAnimations() {
  initReveals();
  initHeaderScroll();
}
