/* ============================================================
   EYESON — WISHLIST.JS
   Heart toggles persisted per product id; wishlist page renders
   from the same productCard layout. Smooth heart animation on
   every toggle, with a wishlist count in the header.
   ============================================================ */

function getWishlist() { return store.get("wishlist", []); }

/* Update the wishlist count badge in the header (next to heart icon) */
function updateWishlistCount() {
  const el = document.getElementById("wishCount");
  if (!el) return;
  const count = getWishlist().length;
  el.textContent = count;
  el.style.display = count > 0 ? "flex" : "none";
}

/* Toggle a product in / out of the wishlist and refresh the heart */
function toggleWishlist(id, btn) {
  const list = getWishlist();
  const i = list.indexOf(id);
  if (i > -1) { list.splice(i, 1); toast("Removed from wishlist"); }
  else { list.push(id); toast("Saved to wishlist"); }
  store.set("wishlist", list);
  updateWishlistCount();
  if (btn) {
    /* Smooth pop animation — scale up, color swap, scale back */
    btn.style.transform = "scale(0.7)";
    setTimeout(() => {
      btn.classList.toggle("active", i === -1);
      btn.textContent = i === -1 ? "♥" : "♡";
      btn.style.transform = "scale(1.2)";
      setTimeout(() => { btn.style.transform = ""; }, 180);
    }, 120);
  }
  /* Re-render the wishlist page grid if we are on it */
  if (typeof renderWishlistPage === "function") renderWishlistPage();
}
