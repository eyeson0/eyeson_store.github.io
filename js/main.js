/* ============================================================
   EYESON — MAIN.JS
   Application boot + renderers for each page's dynamic content.
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  /* Resolve the HTTP-only cookie session before rendering account-aware UI. */
  if (typeof EyesonAuth !== "undefined") await EyesonAuth.restoreSession();
  /* Global chrome on every page */
  initTheme();
  renderHeader();
  renderFooter();
  renderChrome();
  initEyeLife();
  initSearch();
  initProductCards(document);
  initAnimations();
  initLoadingScreen();
  updateVaultCount();
  updateWishlistCount();
  guardBrokenLinks();

  /* Page-specific rendering */
  const page = document.body.dataset.page;
  if (page === "home") renderHome();
  if (page === "collections") renderCollectionsPage();
  if (page === "product") renderProductPage();
  if (page === "cart") renderCart();
  if (page === "checkout") renderCheckout();
  if (page === "wishlist") renderWishlistPage();
  if (page === "account") renderAccount();
  if (page === "tracking") renderTracking();

  /* Page-enter transition */
  document.body.classList.add("page-fade");
});

/* ============================================================
   HOME PAGE
   ============================================================ */
function renderHome() {
  /* New Arrivals grid */
  const na = document.getElementById("newArrivals");
  if (na) na.innerHTML = PRODUCTS.filter((p) => p.tags.includes("new") || p.badge === "new" || p.badge === "sale").map(productCard).join("");

  /* Shop by Category cards */
  const cats = document.getElementById("categoryGrid");
  if (cats) cats.innerHTML = ["tshirts", "oversized", "hoodies", "jackets", "joggers", "pants", "caps", "accessories"]
    .map((id) => {
      const c = CATEGORIES.find((x) => x.id === id);
      return (
        '<a class="category-card reveal" href="collections.html?category=' + c.id + '">' +
          imgFrame(c.image, c.name) +
          '<div class="cat-label"><h3>' + c.name + '</h3><div class="cat-underline"></div><span class="shop-link">Shop Now →</span></div>' +
        "</a>"
      );
    }).join("");

  /* Featured collections (tabs reuse the same grid) */
  const ftabs = document.getElementById("featuredTabs");
  const fgrid = document.getElementById("featuredGrid");
  if (ftabs && fgrid) {
    ftabs.innerHTML = FEATURED.map((f, i) =>
      '<button class="pdp-tab ' + (i === 0 ? "active" : "") + '" data-featured="' + f.id + '">' + f.name + "</button>"
    ).join("");
    const loadFeatured = (tag) => {
      const items = PRODUCTS.filter((p) => p.tags.includes(tag));
      fgrid.innerHTML = (items.length ? items : PRODUCTS.slice(0, 4)).map(productCard).join("");
      initReveals();
    };
    loadFeatured("trending");
    ftabs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-featured]");
      if (!b) return;
      ftabs.querySelectorAll(".pdp-tab").forEach((t) => t.classList.remove("active"));
      b.classList.add("active");
      loadFeatured(b.dataset.featured);
    });
  }

  /* Lookbook */
  const lb = document.getElementById("lookbookGrid");
  if (lb) lb.innerHTML =
    LOOKBOOK.slice(0, 2).map((l) =>
      '<div class="lb-item reveal">' + imgFrame(l.image, l.caption) + '<span class="lb-caption">' + l.caption + "</span></div>"
    ).join("") +
    '<div class="lb-item lb-quote reveal"><p class="eyebrow">The Lookbook</p>' +
      '<h2 class="headline-md">Fashion is what you buy.<br/>Style is what you do with it.</h2></div>' +
    LOOKBOOK.slice(2).map((l) =>
      '<div class="lb-item reveal">' + imgFrame(l.image, l.caption) + '<span class="lb-caption">' + l.caption + "</span></div>"
    ).join("");

  /* Customer reviews carousel */
  const rTrack = document.getElementById("reviewsTrack");
  if (rTrack) {
    rTrack.innerHTML = REVIEWS.map((r) =>
      '<div class="review-slide">' +
        '<div class="review-stars">' + stars(r.rating) + "</div>" +
        '<p class="review-text">“' + esc(r.text) + "”</p>" +
        '<div class="review-user">' +
          '<div class="avatar-fallback">' + esc(r.name[0]) + "</div>" +
          '<span class="review-name">' + esc(r.name) + " · " + esc(r.location) + "</span>" +
          (r.verified ? '<span class="verified">✓ Verified Buyer</span>' : "") +
        "</div>" +
      "</div>"
    ).join("");
    let ri = 0;
    const move = () => { rTrack.style.transform = "translateX(-" + ri * 100 + "%)"; };
    const prevB = document.getElementById("revPrev"), nextB = document.getElementById("revNext");
    if (prevB) prevB.addEventListener("click", () => { ri = (ri - 1 + REVIEWS.length) % REVIEWS.length; move(); });
    if (nextB) nextB.addEventListener("click", () => { ri = (ri + 1) % REVIEWS.length; move(); });
    setInterval(() => { ri = (ri + 1) % REVIEWS.length; move(); }, 7000);
  }

  /* Instagram feed with popup */
  const ig = document.getElementById("instaGrid");
  if (ig) {
    ig.innerHTML = INSTAGRAM.map((p) =>
      '<div class="insta-item reveal" data-ig="' + p.image + '" role="button" tabindex="0">' + imgFrame(p.image, "Instagram") + "</div>"
    ).join("");
    ig.addEventListener("click", (e) => {
      const item = e.target.closest("[data-ig]");
      if (!item) return;
      let modal = document.getElementById("igModal");
      if (!modal) { modal = document.createElement("div"); modal.id = "igModal"; modal.className = "modal-overlay"; document.body.appendChild(modal); }
      modal.innerHTML = '<div class="modal-box" style="grid-template-columns:1fr"><button class="modal-close" data-close>✕</button><div style="aspect-ratio:1">' + imgFrame(item.dataset.ig, "Instagram") + "</div></div>";
      modal.classList.add("open");
      modal.querySelector("[data-close]").onclick = () => modal.classList.remove("open");
      modal.onclick = (ev) => { if (ev.target === modal) modal.classList.remove("open"); };
    });
  }

  /* Newsletter */
  const nl = document.getElementById("newsletterForm");
  if (nl) nl.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = nl.querySelector("input").value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast("Please enter a valid email"); return; }
    nl.querySelector("button").classList.add("sent");
    toast("Welcome to the inner circle");
    nl.reset();
  });

  /* Signature carousel boots last */
  initMainCollection();
}

/* ============================================================
   COLLECTIONS PAGE (dynamic category from ?category=)
   ============================================================ */
function renderCollectionsPage() {
  const params = new URLSearchParams(location.search);
  const catId = params.get("category") || "all";
  const cat = CATEGORIES.find((c) => c.id === catId);
  const title = cat ? cat.name : "All Products";
  document.title = "EYESON — " + title;
  document.getElementById("collTitle").textContent = title;
  document.getElementById("collCrumb").innerHTML =
    '<a href="index.html">Home</a> / <a href="collections.html">Collections</a> / <span>' + title + "</span>";

  /* Category chips */
  const chips = document.getElementById("collChips");
  chips.innerHTML =
    '<a class="size-chip ' + (catId === "all" ? "active" : "") + '" href="collections.html?category=all">All</a>' +
    CATEGORIES.map((c) =>
      '<a class="size-chip ' + (c.id === catId ? "active" : "") + '" href="collections.html?category=' + c.id + '">' + c.name + "</a>"
    ).join("");

  const grid = document.getElementById("collGrid");
  let items = catId === "all" ? PRODUCTS.slice()
    : PRODUCTS.filter((p) => p.category === catId || p.gender === catId || (catId === "sale" && p.oldPrice) || (catId === "new-arrivals" && p.tags.includes("new")));

  /* Smart filters + sorting + live re-render */
  const applyFilters = () => {
    const max = +document.getElementById("priceRange").value;
    document.getElementById("priceLabel").textContent = formatNPR(max);
    const sizes = [...document.querySelectorAll(".filter-size:checked")].map((s) => s.value);
    let list = items.filter((p) => p.price <= max && (!sizes.length || p.sizes.some((s) => sizes.includes(s))));
    const sort = document.getElementById("sortSel").value;
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    document.getElementById("collCount").textContent = list.length + " products";
    grid.style.opacity = 0;
    setTimeout(() => {
      /* Coming Soon state — never an error */
      grid.innerHTML = list.length
        ? list.map(productCard).join("")
        : '<div class="coming-soon" style="grid-column:1/-1"><div class="eye-decoration">◉</div>' +
          '<h2 class="headline-md">Coming Soon</h2><p class="text-soft" style="margin:16px 0 28px">This collection is still in the atelier. Stay focused.</p>' +
          '<a class="btn btn-solid" href="collections.html?category=all">Continue Shopping</a></div>';
      grid.style.opacity = 1;
      initReveals();
    }, 250);
  };

  document.getElementById("sortSel").addEventListener("change", applyFilters);
  document.getElementById("priceRange").addEventListener("input", applyFilters);
  document.querySelectorAll(".filter-size").forEach((s) => s.addEventListener("change", applyFilters));
  applyFilters();
}

/* ============================================================
   PRODUCT PAGE (dynamic from ?id=)
   ============================================================ */
function renderProductPage() {
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id) || PRODUCTS[0]; /* graceful fallback — never a 404 */
  document.title = "EYESON — " + p.name;

  const gallery = document.getElementById("pdpGallery");
  const imgs = [p.image, p.hoverImage, p.image];
  gallery.innerHTML =
    '<div class="pdp-main" id="pdpMain" title="Hover to zoom">' + imgFrame(p.image, p.name) + "</div>" +
    '<div class="pdp-thumbs">' +
      imgs.map((src, i) =>
        '<button class="' + (i === 0 ? "active" : "") + '" data-thumb="' + src + '">' + imgFrame(src, p.name) + "</button>"
      ).join("") +
    "</div>";

  /* Thumbnail switching + click-to-zoom */
  gallery.addEventListener("click", (e) => {
    const t = e.target.closest("[data-thumb]");
    if (t) {
      gallery.querySelectorAll(".pdp-thumbs button").forEach((b) => b.classList.remove("active"));
      t.classList.add("active");
      document.getElementById("pdpMain").innerHTML = imgFrame(t.dataset.thumb, p.name);
    }
    if (e.target.closest("#pdpMain")) document.getElementById("pdpMain").classList.toggle("zoomed");
  });

  /* Info column */
  const info = document.getElementById("pdpInfo");
  info.innerHTML =
    '<p class="eyebrow">' + esc(p.collection) + "</p>" +
    "<h1>" + esc(p.name) + "</h1>" +
    '<p class="pc-price" style="font-size:1.6rem;margin:14px 0">' + formatNPR(p.price) +
      (p.oldPrice ? ' <span class="old">' + formatNPR(p.oldPrice) + "</span>" : "") + "</p>" +
    '<p class="pdp-desc">' + esc(p.description) + "</p>" +
    '<p class="eyebrow" style="margin-top:20px">Color</p><div class="swatches" id="pdpColors">' +
      p.colors.map((c, i) => '<span class="swatch ' + (i === 0 ? "active" : "") + '" data-color="' + c + '" style="background:' + c + '"></span>').join("") + "</div>" +
    '<p class="eyebrow" style="margin-top:16px">Size</p><div class="sizes" id="pdpSizes">' +
      p.sizes.map((s, i) => '<span class="size-chip ' + (i === 0 ? "active" : "") + '" data-size="' + s + '">' + s + "</span>").join("") + "</div>" +
    '<div class="pdp-actions">' +
      '<!-- Add to Eye Vault button --><button class="btn btn-solid" id="pdpAdd">Add to Eye Vault</button>' +
      '<button class="btn btn-outline" id="pdpWish">' + (getWishlist().includes(p.id) ? "♥ Saved" : "♡ Wishlist") + "</button>" +
    "</div>" +
    /* Tabs: fabric / size guide / shipping / reviews */
    '<div class="pdp-panel"><div class="pdp-tabs">' +
      '<button class="pdp-tab active" data-tab="fabric">Fabric</button>' +
      '<button class="pdp-tab" data-tab="size">Size Guide</button>' +
      '<button class="pdp-tab" data-tab="ship">Shipping</button>' +
      '<button class="pdp-tab" data-tab="reviews">Reviews</button>' +
    '</div><div class="pdp-tab-body" id="pdpTabBody"></div></div>';

  /* Selection state */
  let selColor = p.colors[0], selSize = p.sizes[0];
  info.addEventListener("click", (e) => {
    const sw = e.target.closest("[data-color]");
    if (sw) { selColor = sw.dataset.color; info.querySelectorAll("#pdpColors .swatch").forEach((s) => s.classList.remove("active")); sw.classList.add("active"); }
    const sz = e.target.closest("[data-size]");
    if (sz) { selSize = sz.dataset.size; info.querySelectorAll("#pdpSizes .size-chip").forEach((s) => s.classList.remove("active")); sz.classList.add("active"); }
  });

  document.getElementById("pdpAdd").addEventListener("click", (e) => addToCart(p.id, 1, selSize, selColor, e.currentTarget));
  document.getElementById("pdpWish").addEventListener("click", (e) => {
    toggleWishlist(p.id);
    e.currentTarget.textContent = getWishlist().includes(p.id) ? "♥ Saved" : "♡ Wishlist";
  });

  /* Tab content templates */
  const tabs = {
    fabric: '<table class="fabric-table"><tr><th>Fabric</th><td>' + esc(p.fabric) + "</td></tr>" +
      "<tr><th>Model</th><td>" + esc(p.modelHeight) + "</td></tr>" +
      "<tr><th>Care</th><td>Machine wash cold, hang dry, warm iron inside out.</td></tr></table>",
    size: '<table class="size-guide-table"><tr><th>Size</th><th>Chest</th><th>Length</th><th>Sleeve</th></tr>' +
      "<tr><td>S</td><td>102 cm</td><td>68 cm</td><td>60 cm</td></tr>" +
      "<tr><td>M</td><td>108 cm</td><td>71 cm</td><td>62 cm</td></tr>" +
      "<tr><td>L</td><td>114 cm</td><td>74 cm</td><td>64 cm</td></tr>" +
      "<tr><td>XL</td><td>120 cm</td><td>77 cm</td><td>66 cm</td></tr></table>",
    ship: "<p>Free shipping inside Kathmandu Valley on orders above Rs. 5,000. Nationwide delivery in 2–5 days via our courier partners. Cash on Delivery, eSewa, Khalti, Fonepay, Visa and MasterCard accepted. Easy 14-day returns.</p>",
    reviews: REVIEWS.map((r) =>
      '<div style="border-bottom:1px solid var(--line);padding:16px 0">' +
        '<div class="review-stars">' + stars(r.rating) + "</div>" +
        "<p>“" + esc(r.text) + "”</p>" +
        '<p class="review-name" style="margin-top:8px">' + esc(r.name) + ' <span class="verified">✓ Verified</span></p></div>'
    ).join(""),
  };
  const body = document.getElementById("pdpTabBody");
  body.innerHTML = tabs.fabric;
  info.querySelector(".pdp-tabs").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]");
    if (!t) return;
    info.querySelectorAll(".pdp-tab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    body.innerHTML = tabs[t.dataset.tab];
  });

  /* Related products + recently viewed */
  const related = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category);
  document.getElementById("relatedGrid").innerHTML = (related.length ? related : PRODUCTS.filter((x) => x.id !== p.id).slice(0, 4)).map(productCard).join("");
  const viewed = store.get("recently-viewed", []);
  const next = [p.id, ...viewed.filter((v) => v !== p.id)].slice(0, 6);
  store.set("recently-viewed", next);
  document.getElementById("recentGrid").innerHTML =
    next.filter((v) => v !== p.id).map((v) => productCard(getProduct(v))).filter(Boolean).map((h) => h.replace('class="product-card', 'style="grid-column:span 1" class="product-card')).join("");
  initReveals();
}

/* ============================================================
   CART / EYE VAULT PAGE
   ============================================================ */
function renderCart() {
  const wrap = document.getElementById("cartWrap");
  const cart = getCart();
  if (!cart.length) {
    wrap.innerHTML =
      '<div class="coming-soon"><div class="eye-decoration">◉</div>' +
      '<h2 class="headline-md">Your Eye Vault is empty</h2>' +
      '<p class="text-soft" style="margin:16px 0 28px">Nothing has caught your eye yet.</p>' +
      '<a class="btn btn-solid" href="collections.html?category=all">Continue Shopping</a></div>';
    return;
  }
  wrap.innerHTML =
    '<div class="cart-layout"><div>' +
      cart.map((item, i) =>
        '<div class="cart-item">' +
          '<a class="ci-img" href="product.html?id=' + item.id + '">' + imgFrame(item.image, item.name) + "</a>" +
          "<div><div class='ci-name'>" + esc(item.name) + "</div>" +
            '<div class="ci-meta">Size ' + esc(item.size) + " · <span class='swatch' style='display:inline-block;vertical-align:middle;background:" + item.color + "'></span></div>" +
            '<div class="ci-qty" style="margin-top:10px"><button data-dec="' + i + '">−</button><span>' + item.qty + '</span><button data-inc="' + i + '">+</button></div>' +
            '<a class="ci-remove" href="#" data-rm="' + i + '">Remove</a></div>' +
          '<div class="ci-price" style="font-weight:800">' + formatNPR(item.price * item.qty) + "</div>" +
        "</div>"
      ).join("") +
    "</div>" +
    /* Order summary */
    '<aside class="summary-card">' +
      '<h3 class="headline-md" style="font-size:1.2rem">Summary</h3>' +
      '<div class="summary-row"><span>Subtotal</span><span>' + formatNPR(cartTotal()) + "</span></div>" +
      '<div class="summary-row"><span>Shipping</span><span>' + (cartTotal() >= 5000 ? "Free" : formatNPR(200)) + "</span></div>" +
      (cartTotal() < 5000 ? '<p class="free-ship-note">Add ' + formatNPR(5000 - cartTotal()) + " more for free valley shipping</p>" : '<p class="free-ship-note">✓ Free shipping unlocked</p>') +
      '<div class="summary-row total"><span>Total</span><span>' + formatNPR(cartTotal() + (cartTotal() >= 5000 ? 0 : 200)) + "</span></div>" +
      '<a class="btn btn-solid" style="width:100%;margin-top:20px" href="checkout.html">Proceed to Checkout</a>' +
      '<a class="btn btn-outline" style="width:100%;margin-top:12px" href="collections.html?category=all">Continue Shopping</a>' +
    "</aside></div>";

  /* Use onclick (not addEventListener) so re-renders never stack duplicate handlers */
  wrap.onclick = (e) => {
    const rm = e.target.closest("[data-rm]"); if (rm) { e.preventDefault(); removeFromCart(+rm.dataset.rm); return; }
    const inc = e.target.closest("[data-inc]"); if (inc) { setQty(+inc.dataset.inc, getCart()[+inc.dataset.inc].qty + 1); return; }
    const dec = e.target.closest("[data-dec]"); if (dec) { setQty(+dec.dataset.dec, getCart()[+dec.dataset.dec].qty - 1); }
  };
}

/* ============================================================
   CHECKOUT PAGE — "Your Vision Collection"
   ============================================================ */
function renderCheckout() {
  const wrap = document.getElementById("checkoutWrap");
  const cart = getCart();
  const shipping = cartTotal() >= 5000 ? 0 : 200;
  wrap.innerHTML =
    '<div class="checkout-steps"><span class="step active">1 · Details</span><span class="step">2 · Payment</span><span class="step">3 · Confirmation</span></div>' +
    '<div class="checkout-layout"><form id="checkoutForm">' +
      "<h3 class='eyebrow'>Contact</h3>" +
      '<div class="field"><label>Full Name</label><input required placeholder="Your name"/></div>' +
      '<div class="field"><label>Email</label><input type="email" required placeholder="you@example.com"/></div>' +
      '<div class="field"><label>Phone</label><input required placeholder="98XXXXXXXX"/></div>' +
      '<div class="field"><label>Delivery Address</label><textarea required rows="3" placeholder="Street, city"></textarea></div>' +
      "<h3 class='eyebrow' style='margin-top:26px'>Payment Method</h3><div class='payment-methods'>" +
        ["Cash on Delivery", "eSewa", "Khalti", "Fonepay", "Visa / MasterCard"].map((m, i) =>
          '<label class="pay-option ' + (i === 0 ? "active" : "") + '"><input type="radio" name="pay" value="' + m + '" ' + (i === 0 ? "checked" : "") + " style='display:none'/>" + m + "</label>"
        ).join("") + "</div>" +
      '<button class="btn btn-solid" type="submit" style="margin-top:30px;width:100%">Place Order</button>' +
    "</form>" +
    '<aside class="summary-card"><h3 class="headline-md" style="font-size:1.2rem;margin-bottom:16px">Your Order</h3>' +
      cart.map((i) => '<div class="summary-row"><span>' + esc(i.name) + " × " + i.qty + "</span><span>" + formatNPR(i.price * i.qty) + "</span></div>").join("") +
      '<div class="summary-row"><span>Shipping</span><span>' + (shipping ? formatNPR(shipping) : "Free") + "</span></div>" +
      '<div class="summary-row total"><span>Total</span><span>' + formatNPR(cartTotal() + shipping) + "</span></div>" +
    "</aside></div>";

  /* Payment chip selection */
  wrap.querySelectorAll(".pay-option").forEach((o) =>
    o.addEventListener("click", () => { wrap.querySelectorAll(".pay-option").forEach((x) => x.classList.remove("active")); o.classList.add("active"); })
  );

  /* Place order — stores a trackable order and confirms elegantly */
  document.getElementById("checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const order = {
      id: "ESN-" + Date.now().toString().slice(-6),
      items: cart, total: cartTotal() + shipping,
      date: new Date().toISOString(), status: "processing",
    };
    const orders = store.get("orders", []); orders.push(order); store.set("orders", orders);
    store.set("cart", []); updateVaultCount();
    wrap.innerHTML =
      '<div class="coming-soon"><div class="eye-decoration">◉</div>' +
      '<p class="eyebrow">Order ' + order.id + "</p>" +
      '<h2 class="headline-md">Thank you.<br/>Your vision is on its way.</h2>' +
      '<p class="text-soft" style="margin:18px 0 30px">A confirmation email is on its way. Total ' + formatNPR(order.total) + "</p>" +
      '<a class="btn btn-solid" href="order-tracking.html">Track Order</a> ' +
      '<a class="btn btn-outline" href="index.html" style="margin-left:10px">Back Home</a></div>';
  });
}

/* ============================================================
   WISHLIST PAGE
   ============================================================ */
function renderWishlistPage() {
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;
  const list = getWishlist().map(getProduct).filter(Boolean);
  grid.innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="coming-soon" style="grid-column:1/-1"><div class="eye-decoration">♡</div>' +
      '<h2 class="headline-md">Your wishlist is empty</h2>' +
      '<p class="text-soft" style="margin:16px 0 28px">Keep an eye on the pieces you love.</p>' +
      '<a class="btn btn-solid" href="collections.html?category=all">Discover Products</a></div>';
}

/* ============================================================
   ACCOUNT PAGE
   ============================================================ */
function renderAccount() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("acctName");
  if (!nameEl) return;
  if (!user || !user.loggedIn) { location.href = "login.html?next=checkout.html"; return; }
  nameEl.textContent = user.name || user.email;
  const orders = store.get("orders", []);
  const tbody = document.getElementById("acctOrders");
  tbody.innerHTML = orders.length
    ? orders.map((o) =>
        "<tr><td>" + o.id + "</td><td>" + new Date(o.date).toLocaleDateString() + "</td><td>" + formatNPR(o.total) +
        '</td><td><a href="order-tracking.html?id=' + o.id + '" style="color:var(--accent)">Track</a></td></tr>'
      ).join("")
    : '<tr><td colspan="4" class="text-soft">No orders yet — your first vision awaits.</td></tr>';
}

/* ============================================================
   ORDER TRACKING PAGE
   ============================================================ */
function renderTracking() {
  const input = document.getElementById("trackInput");
  const timeline = document.getElementById("trackTimeline");
  const orders = store.get("orders", []);
  const params = new URLSearchParams(location.search);
  let order = orders.find((o) => o.id === params.get("id")) || orders[orders.length - 1] || null;

  const draw = () => {
    if (!order) {
      timeline.innerHTML = '<p class="text-soft center">No order found yet. Place your first order to begin tracking.</p>';
      return;
    }
    const steps = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"];
    const stage = { processing: 1, shipped: 2, out: 3, delivered: 4 }[order.status] ?? 1;
    timeline.innerHTML =
      '<p class="eyebrow center">Order ' + order.id + " · " + formatNPR(order.total) + "</p>" +
      '<div class="track-timeline">' + steps.map((s, i) =>
        '<div class="track-step ' + (i <= stage ? "done" : "") + '"><div class="track-dot">' + (i <= stage ? "✓" : "") + "</div><div><h4>" + s + "</h4><p>" +
        (i <= stage ? new Date(order.date).toLocaleString() : "Pending") + "</p></div></div>"
      ).join("") + "</div>";
  };
  draw();
  document.getElementById("trackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    order = orders.find((o) => o.id === input.value.trim().toUpperCase()) || order;
    draw();
  });
}

/* ============================================================
   AUTH HELPERS (used by login/register/account pages)
   Server-backed: an HTTP-only cookie session is the source of truth.
   Cart, wishlist, and order-display data are independent of authentication.
   ============================================================ */

/* Kept for older page integrations; authentication state only lives in memory
   after the server confirms its HTTP-only cookie session. */
function eyesonLogin(email, name) {
  return { email: email, name: name || email.split("@")[0], loggedIn: true };
}

/* Clear the server session — cart, wishlist, and theme remain untouched. */
function eyesonLogout() {
  if (typeof EyesonAuth === "undefined") { location.href = "index.html"; return; }
  EyesonAuth.signOut().finally(function () { location.href = "index.html"; });
}

/* Check the in-memory reflection of the server-validated session. */
function isUserLoggedIn() {
  return typeof EyesonAuth !== "undefined" && EyesonAuth.isLoggedIn();
}

/* User profile data is never read from localStorage. */
function getCurrentUser() {
  return typeof EyesonAuth !== "undefined" ? EyesonAuth.getUser() : null;
}

/* ============================================================
   BROKEN LINK PROTECTION
   Check known pages to prevent navigating to missing ones.
   ============================================================ */
const KNOWN_PAGES = [
  "index.html", "collections.html", "product.html", "cart.html",
  "checkout.html", "wishlist.html", "account.html", "login.html",
  "register.html", "about.html", "contact.html", "faq.html",
  "order-tracking.html", "shipping.html", "returns.html",
  "privacy.html", "terms.html", "404.html",
];
function guardBrokenLinks() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return;
    /* Extract just the page filename from a potentially complex path */
    const page = href.split("?")[0].split("#")[0];
    const filename = page.substring(page.lastIndexOf("/") + 1);
    if (filename && !KNOWN_PAGES.includes(filename)) {
      e.preventDefault();
      location.href = "index.html";
    }
  });
}
