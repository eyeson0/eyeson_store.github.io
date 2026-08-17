/* ============================================================
   EYESON — CART.JS
   The "Eye Vault". Items live in localStorage. Adding a product
   launches a glowing orb that flies into the header eye, whose
   pupil pulses as the count rises.
   ============================================================ */

/* Read the whole vault */
function getCart() { return store.get("cart", []); }

/* Total item count (quantities included) */
function cartCount() { return getCart().reduce((n, i) => n + i.qty, 0); }

/* Cart total in NPR */
function cartTotal() { return getCart().reduce((n, i) => n + i.price * i.qty, 0); }

/* Refresh the number shown inside the iris of the header eye */
function updateVaultCount() {
  const el = document.getElementById("vaultCount");
  if (el) el.textContent = cartCount();
}

/* Add a product (merges same id + size + color) and play the orb animation */
function addToCart(productId, qty, size, color, sourceEl) {
  const product = getProduct(productId);
  if (!product) return;
  const cart = getCart();
  size = size || product.sizes[0];
  color = color || product.colors[0];
  const existing = cart.find((i) => i.id === productId && i.size === size && i.color === color);
  if (existing) existing.qty += qty || 1;
  else cart.push({ id: productId, name: product.name, price: product.price, image: product.image, qty: qty || 1, size, color });
  store.set("cart", cart);
  updateVaultCount();
  flyOrb(sourceEl);                 /* cinematic orb → header eye */
  toast("Added to your Eye Vault");
}

/* Remove an entry — the header eye gently blinks */
function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  store.set("cart", cart);
  updateVaultCount();
  const toggle = document.querySelector(".vault-btn");
  if (toggle) {
    toggle.style.opacity = "0.3";
    setTimeout(() => (toggle.style.opacity = "1"), 150);
  }
  if (typeof renderCart === "function") renderCart();
}

/* Change quantity of an entry */
function setQty(index, qty) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty = Math.max(1, qty);
  store.set("cart", cart);
  updateVaultCount();
  if (typeof renderCart === "function") renderCart();
}

/* The glowing orb that flies from the product into the eye icon */
function flyOrb(sourceEl) {
  const target = document.querySelector(".vault-btn");
  if (!target) return;
  const orb = document.createElement("div");
  orb.className = "fly-orb";
  const start = sourceEl ? sourceEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const end = target.getBoundingClientRect();
  orb.style.left = start.left + start.width / 2 - 32 + "px";
  orb.style.top = start.top + start.height / 2 - 32 + "px";
  document.body.appendChild(orb);
  requestAnimationFrame(() => {
    orb.style.left = end.left + end.width / 2 - 10 + "px";
    orb.style.top = end.top + end.height / 2 - 10 + "px";
    orb.style.width = "14px";
    orb.style.height = "14px";
    orb.style.opacity = "0.2";
  });
  /* On arrival: the pupil pulses and count animates */
  setTimeout(() => {
    orb.remove();
    target.classList.add("pulse");
    setTimeout(() => target.classList.remove("pulse"), 600);
  }, 800);
}

/* ---------- REUSABLE PRODUCT CARD RENDERER ----------
   One layout for every product across home, collections, search,
   wishlist and related products. Copy data — never CSS/JS. */
function productCard(p) {
  const inWish = store.get("wishlist", []).includes(p.id);
  return (
    '<article class="product-card reveal" data-id="' + p.id + '">' +
      '<div class="pc-media" data-goto="' + p.id + '">' +
        (p.badge ? '<span class="badge ' + p.badge + '">' + (p.badge === "sale" ? "-" + Math.round((1 - p.price / p.oldPrice) * 100) + "%" : p.badge.toUpperCase()) + "</span>" : "") +
        '<button class="pc-wish ' + (inWish ? "active" : "") + '" data-wish="' + p.id + '" aria-label="Toggle wishlist">' + (inWish ? "♥" : "♡") + "</button>" +
        imgFrame(p.image, p.name) +
        imgFrame(p.hoverImage, p.name, "pc-hover-img") +
        '<button class="pc-quick" data-quick="' + p.id + '">Quick View</button>' +
      "</div>" +
      '<div class="pc-body">' +
        '<a href="product.html?id=' + p.id + '"><h3 class="pc-name">' + esc(p.name) + "</h3></a>" +
        '<p class="pc-cat">' + esc(p.collection || p.category) + "</p>" +
        '<p class="pc-price">' + formatNPR(p.price) + (p.oldPrice ? '<span class="old">' + formatNPR(p.oldPrice) + "</span>" : "") + "</p>" +
        '<div class="swatches">' + p.colors.map((c) => '<span class="swatch" style="background:' + c + '"></span>').join("") + "</div>" +
        '<div class="sizes">' + p.sizes.map((s) => '<span class="size-chip">' + s + "</span>").join("") + "</div>" +
        '<p class="stock ' + p.stock + '">' + (p.stock === "in" ? "In Stock" : p.stock === "low" ? "Low Stock" : "Sold Out") + "</p>" +
        '<!-- Add to Eye Vault button -->' +
        '<button class="btn btn-outline btn-sm pc-add" data-add="' + p.id + '">Add to Eye Vault</button>' +
      "</div>" +
    "</article>"
  );
}

/* Delegate every card interaction (add / wish / quick view / navigate) */
function initProductCards(root) {
  (root || document).addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { addToCart(add.dataset.add, 1, null, null, add); return; }

    const wish = e.target.closest("[data-wish]");
    if (wish) { toggleWishlist(wish.dataset.wish, wish); return; }

    const quick = e.target.closest("[data-quick]");
    if (quick) { openQuickView(quick.dataset.quick); return; }

    const go = e.target.closest("[data-goto]");
    if (go) { location.href = "product.html?id=" + go.dataset.goto; }
  });
}

/* ---------- QUICK VIEW MODAL ---------- */
function openQuickView(id) {
  const p = getProduct(id);
  if (!p) return;
  let modal = document.getElementById("quickModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quickModal"; modal.className = "modal-overlay";
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });
  }
  modal.innerHTML =
    '<div class="modal-box"><button class="modal-close" data-close>✕</button>' +
      '<div class="m-img">' + imgFrame(p.image, p.name) + "</div>" +
      '<div class="m-body">' +
        '<p class="eyebrow">' + esc(p.collection || p.category) + "</p>" +
        "<h3>" + esc(p.name) + "</h3>" +
        '<p class="pc-price" style="font-size:1.3rem;margin:12px 0">' + formatNPR(p.price) + "</p>" +
        '<p class="text-soft" style="font-size:.9rem">' + esc(p.description) + "</p>" +
        '<div class="swatches">' + p.colors.map((c, i) => '<span class="swatch ' + (i === 0 ? "active" : "") + '" style="background:' + c + '"></span>').join("") + "</div>" +
        '<div class="sizes">' + p.sizes.map((s, i) => '<span class="size-chip ' + (i === 0 ? "active" : "") + '">' + s + "</span>").join("") + "</div>" +
        '<div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap">' +
          '<button class="btn btn-solid btn-sm" data-add="' + p.id + '">Add to Eye Vault</button>' +
          '<a class="btn btn-outline btn-sm" href="product.html?id=' + p.id + '">Full Details</a>' +
        "</div>" +
      "</div>" +
    "</div>";
  modal.classList.add("open");
  modal.querySelector("[data-close]").onclick = () => modal.classList.remove("open");
}
