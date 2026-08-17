/* ============================================================
   EYESON — UTILS.JS
   Small shared helpers used across every feature file.
   ============================================================ */

/* Format a price in NPR with the Rs prefix and thousand separators */
function formatNPR(value) {
  return "Rs. " + Number(value).toLocaleString("en-IN");
}

/* Find a product by its id (used by product pages and the cart) */
function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

/* Escape user/merchant strings before injecting into HTML */
function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* localStorage helpers that never throw (private mode safe) */
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem("eyeson_" + key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("eyeson_" + key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  remove(key) {
    try { localStorage.removeItem("eyeson_" + key); } catch { /* ignore */ }
  },
};

/* Build an image frame: shows the real photo when the file exists,
   otherwise an elegant branded fallback block. Replace the file with
   the same name and the photo appears automatically. */
function imgFrame(src, alt, cls) {
  return (
    '<div class="img-frame ' + (cls || "") + '">' +
      '<div class="fallback">' + esc(alt || "EYESON") + "</div>" +
      '<img class="img-real" src="' + esc(src) + '" alt="' + esc(alt || "") + '" loading="lazy" ' +
        'onerror="this.remove()" onload="this.style.opacity=1" style="opacity:0;transition:opacity .6s"/>' +
    "</div>"
  );
}

/* Render gold star rating ★★★★★ for a given count */
function stars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/* Show a toast message (auto-hides after 2.6s) */
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}
