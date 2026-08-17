/* ============================================================
   EYESON — CAROUSEL.JS
   The signature three-model Main Collection carousel.
   Center model in focus; sides blurred and faded; auto-rotate,
   arrows, progress bars, swipe gestures. Product details update
   IMMEDIATELY on every switch (with an elegant fade).
   ============================================================ */

function initMainCollection() {
  const stage = document.getElementById("mcStage");
  if (!stage || typeof MAIN_COLLECTION === "undefined") return;

  let index = 0;
  let timer = null;
  const n = MAIN_COLLECTION.length;

  /* ---- Build the models (prepend so the arrow buttons survive) ---- */
  stage.insertAdjacentHTML(
    "afterbegin",
    MAIN_COLLECTION.map((look, i) =>
      '<div class="mc-model" data-i="' + i + '" role="button" tabindex="0" aria-label="' + esc(look.caption) + '">' +
        imgFrame(look.modelImage, look.caption) +
      "</div>"
    ).join("")
  );
  const models = Array.from(stage.querySelectorAll(".mc-model"));

  /* ---- Fill the three detail blocks from the focused look ---- */
  function fillDetails() {
    const look = MAIN_COLLECTION[index];
    const p = getProduct(look.product) || PRODUCTS[index % PRODUCTS.length];
    if (!p) return;
    const set = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    set("mcLeft",
      "<h5>Collection</h5><p>" + esc(p.collection) + "</p>" +
      '<p class="mc-price">' + formatNPR(p.price) + "</p>" +
      '<!-- Shop Now button --><a class="btn btn-solid btn-sm" href="product.html?id=' + p.id + '" style="margin-top:16px">Shop Now</a>');
    set("mcCenter",
      "<h5>Product</h5><p><strong>" + esc(p.name) + "</strong> — " + esc(look.caption) + "</p>" +
      "<h5>Fabric</h5><p>" + esc(p.fabric) + "</p>" +
      "<h5>Sizes</h5><p>" + p.sizes.join(" · ") + "</p>" +
      '<h5>Colors</h5><div class="swatches">' + p.colors.map((c) => '<span class="swatch" style="background:' + c + '"></span>').join("") + "</div>" +
      "<h5>Description</h5><p class='text-soft'>" + esc(p.description) + "</p>");
    set("mcRight",
      "<h5>Fabric Details</h5><p>" + esc(p.fabric) + "</p>" +
      "<h5>Model Height</h5><p>" + esc(p.modelHeight) + "</p>" +
      "<h5>Available Colors</h5><p>" + p.colors.length + " colors</p>");
    /* Visible product tag right under the center model */
    const tag = document.getElementById("mcTag");
    if (tag) {
      tag.innerHTML =
        '<span class="mc-tag-name">' + esc(p.name) + "</span>" +
        '<span class="mc-tag-price">' + formatNPR(p.price) + "</span>";
    }
  }

  /* ---- Position every model relative to the focused index ---- */
  function layout() {
    models.forEach((el, i) => {
      el.classList.remove("is-center", "is-left", "is-right");
      let d = i - index;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      if (d === 0) el.classList.add("is-center");
      else if (d < 0) el.classList.add("is-left");
      else el.classList.add("is-right");
    });

    /* Details fade: out → swap → in. The swap ALWAYS runs (guarded),
       so the panel can never get stuck on the previous product. */
    const details = document.getElementById("mcDetails");
    const tag = document.getElementById("mcTag");
    [details, tag].forEach((el) => el && el.classList.add("fading"));
    setTimeout(() => {
      fillDetails();
      [details, tag].forEach((el) => el && el.classList.remove("fading"));
    }, 300);

    /* Pagination 1 / N + progress bars */
    const count = document.getElementById("mcCount");
    if (count) count.textContent = index + 1 + " / " + n;
    document.querySelectorAll(".mc-bar").forEach((b, i) =>
      b.classList.toggle("active", i === index));
  }

  function go(step) { index = (index + step + n) % n; layout(); restart(); }
  function focus(i) { if (i !== index || true) { index = i; layout(); restart(); } }
  function restart() { clearInterval(timer); timer = setInterval(() => go(1), 6000); }

  /* ---- Controls ---- */
  const prev = document.getElementById("mcPrev");
  const next = document.getElementById("mcNext");
  if (prev) prev.addEventListener("click", () => go(-1));
  if (next) next.addEventListener("click", () => go(1));

  models.forEach((el) => {
    const i = +el.dataset.i;
    el.addEventListener("click", () => focus(i));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") focus(i); });
  });

  document.querySelectorAll(".mc-bar").forEach((b, i) =>
    b.addEventListener("click", () => focus(i)));

  /* Swipe gestures for mobile */
  let startX = null;
  stage.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    startX = null;
  });

  /* Pause while exploring; stop when scrolled away */
  stage.addEventListener("mouseenter", () => clearInterval(timer));
  stage.addEventListener("mouseleave", restart);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((en) =>
      en[0].isIntersecting ? restart() : clearInterval(timer),
      { threshold: 0.15 }).observe(stage);
  }

  /* First paint */
  fillDetails();
  layout();
  restart();
}
