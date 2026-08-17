/* ============================================================
   EYESON — LOADING.JS
   Minimal cinematic loader: two horizontal lines slide apart
   (one up, one down) to reveal the EYESON wordmark, then the
   screen dissolves into the page. Plays once per session.
   ============================================================ */

function initLoadingScreen() {
  /* Skip the cinematic on repeat navigations within the session */
  if (sessionStorage.getItem("eyeson_loaded")) return;

  const screen = document.createElement("div");
  screen.id = "loading-screen";
  screen.innerHTML =
    '<div class="loader-reveal" aria-hidden="true">' +
      '<div class="loader-line top"></div>' +
      '<div class="loader-text">EYESON</div>' +
      '<div class="loader-line bottom"></div>' +
    "</div>";
  document.body.appendChild(screen);
  document.body.style.overflow = "hidden";

  /* Total cinematic ≈ 2.4s, then dissolve */
  setTimeout(() => {
    screen.classList.add("done");
    document.body.style.overflow = "";
    sessionStorage.setItem("eyeson_loaded", "1");
    setTimeout(() => screen.remove(), 900);
  }, 2400);
}
