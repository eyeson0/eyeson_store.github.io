/* ============================================================
   EYESON — SEARCH.JS
   Fullscreen search overlay. Live results, never a dead end:
   no matches shows helpful suggestions instead.
   ============================================================ */

function initSearch() {
  const btn = document.getElementById("searchBtn");
  const overlay = document.getElementById("searchOverlay");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  if (!btn || !overlay) return;

  /* Open / close */
  btn.addEventListener("click", () => { overlay.classList.add("open"); setTimeout(() => input.focus(), 100); });
  document.getElementById("searchClose").addEventListener("click", () => overlay.classList.remove("open"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") overlay.classList.remove("open"); });

  /* Live search across name, category, collection and description */
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ""; return; }
    const matches = PRODUCTS.filter((p) =>
      (p.name + " " + p.category + " " + p.collection + " " + p.description).toLowerCase().includes(q)
    );
    if (matches.length) {
      results.innerHTML = matches.map((p) =>
        '<a class="search-result" href="product.html?id=' + p.id + '">' +
          '<div class="sr-img">' + imgFrame(p.image, p.name) + "</div>" +
          '<div><div class="sr-name">' + esc(p.name) + "</div>" +
          '<div class="sr-price">' + formatNPR(p.price) + "</div></div></a>"
      ).join("");
    } else {
      /* Friendly empty state — never a 404 */
      results.innerHTML =
        '<p class="eyebrow" style="margin-top:20px">No products found for “' + esc(input.value) + "”</p>" +
        '<p class="text-soft" style="margin-bottom:18px">You may also like:</p>' +
        PRODUCTS.slice(0, 3).map((p) =>
          '<a class="search-result" href="product.html?id=' + p.id + '">' +
            '<div class="sr-img">' + imgFrame(p.image, p.name) + "</div>" +
            '<div><div class="sr-name">' + esc(p.name) + "</div>" +
            '<div class="sr-price">' + formatNPR(p.price) + "</div></div></a>"
        ).join("");
    }
  });
}
