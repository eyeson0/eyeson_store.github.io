/* ============================================================
   EYESON — COMPONENTS.JS
   Renders the shared header, footer, search overlay, loading
   screen, cookie banner, back-to-top and custom cursor on every
   page. Pages only include <div id="header"></div> / <div id="footer"></div>.
   ============================================================ */

/* ---------- SVG ICON LIBRARY (inline, no external requests) ---------- */
const ICONS = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7.5-4.6-9.3-9.4C1.4 7 3.4 4 6.6 4c2 0 3.5 1 4.4 2.6L12 8l1-1.4C13.9 5 15.4 4 17.4 4c3.2 0 5.2 3 3.9 6.6C19.5 15.4 12 20 12 20z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.6 4.4-5.5 8-5.5s6.5 1.9 8 5.5"/></svg>',
  /* The signature eye — used by BOTH the theme toggle and the Eye Vault cart.
     #iris / #pupil groups are animated from theme.js and cart.js. */
  eye: (cls) =>
    '<svg class="' + (cls || "") + '" viewBox="0 0 44 26" fill="none">' +
      '<path d="M1 13C6 4.5 13.5 1 22 1s16 3.5 21 12c-5 8.5-12.5 12-21 12S6 21.5 1 13z" stroke="currentColor" stroke-width="1.6"/>' +
      '<g class="iris">' +
        '<circle id="iris" cx="22" cy="13" r="7.5" fill="currentColor" opacity="0.16"/>' +
        '<circle class="pupil" cx="22" cy="13" r="3.6" fill="currentColor"/>' +
      "</g>" +
      '<path class="eyelid" d="M1 13C6 4.5 13.5 1 22 1s16 3.5 21 12c-5 8.5-12.5 12-21 12S6 21.5 1 13z" fill="currentColor"/>' +
    "</svg>",
};

/* ---------- HEADER ---------- */
function renderHeader() {
  const mount = document.getElementById("header");
  if (!mount) return;
  const page = document.body.dataset.page || "";
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : store.get("user", null);
  const link = (href, label, id) =>
    '<li class="nav-item"><a class="nav-link ' + (page === id ? "active" : "") + '" href="' + href + '">' + label + "</a></li>";

  mount.innerHTML =
    '<header class="site-header" id="siteHeader">' +
      '<div class="header-inner">' +
        /* Left: burger (mobile) + primary nav */
        '<nav aria-label="Primary">' +
          '<ul class="nav-left">' +
            link("index.html", "Home", "home") +
            link("collections.html?category=new-arrivals", "New Arrivals", "new") +
            link("collections.html?category=men", "Men", "men") +
            link("collections.html?category=women", "Women", "women") +
            /* Collections mega menu */
            '<li class="nav-item">' +
              '<a class="nav-link ' + (page === "collections" ? "active" : "") + '" href="collections.html">Collections ▾</a>' +
              '<div class="mega-menu">' +
                '<div><h4>Clothing</h4>' +
                  '<a href="collections.html?category=hoodies">Hoodies</a>' +
                  '<a href="collections.html?category=tshirts">T-Shirts</a>' +
                  '<a href="collections.html?category=jackets">Jackets</a>' +
                  '<a href="collections.html?category=joggers">Joggers</a>' +
                  '<a href="collections.html?category=pants">Pants</a></div>' +
                '<div><h4>Styles</h4>' +
                  '<a href="collections.html?category=oversized">Oversized</a>' +
                  '<a href="collections.html?category=caps">Caps</a>' +
                  '<a href="collections.html?category=accessories">Accessories</a>' +
                  '<a href="collections.html?category=sale">Sale</a></div>' +
                '<div><h4>Brand</h4>' +
                  '<a href="about.html">About EYESON</a>' +
                  '<a href="contact.html">Contact</a>' +
                  '<a href="order-tracking.html">Track Order</a>' +
                  '<a href="faq.html">FAQ</a></div>' +
              "</div></li>" +
            link("about.html", "About", "about") +
            link("contact.html", "Contact", "contact") +
          "</ul>" +
          '<button class="icon-btn menu-toggle" id="menuToggle" aria-label="Open menu"><span></span><span></span><span></span></button>' +
        "</nav>" +
        /* Center: official logo image — dual-layer for the CSS theme crossfade */
        '<a class="logo-link" href="index.html" aria-label="EYESON home">' +
          '<span class="logo-dual">' +
            '<img class="lg-black" src="images/logo/logo-black.png" alt="EYESON" onerror="this.parentElement.innerHTML=\'<span class=&quot;logo-fallback&quot;>EYESON</span>\'"/>' +
            '<img class="lg-white" src="images/logo/logo-white.png" alt=""/>' +
          "</span>" +
        "</a>" +
        /* Right: icon rail */
        '<div class="header-icons">' +
          '<button class="icon-btn" id="searchBtn" aria-label="Search">' + ICONS.search + "</button>" +
          '<a class="icon-btn wish-btn" href="wishlist.html" aria-label="Wishlist">' + ICONS.heart + '<span class="wish-count" id="wishCount" style="display:none">0</span></a>' +
          (user && user.loggedIn
            ? '<a class="icon-btn" href="account.html" aria-label="Account">' + ICONS.user + "</a>"
            : '<a class="icon-btn" href="login.html" aria-label="Account">' + ICONS.user + "</a>") +
          /* Eye Vault (cart) — count lives inside the iris */
          '<a class="icon-btn vault-btn" href="cart.html" aria-label="Eye Vault">' + ICONS.eye("vault-eye") + '<span class="iris-count" id="vaultCount">0</span></a>' +
          /* Eye theme toggle */
          '<button class="icon-btn eye-toggle" id="themeToggle" aria-label="Toggle dark mode">' + ICONS.eye("toggle-eye") + "</button>" +
        "</div>" +
      "</div>" +
    "</header>" +
    /* Search overlay */
    '<div class="search-overlay" id="searchOverlay">' +
      '<button class="search-close" id="searchClose" aria-label="Close search">✕</button>' +
      '<div class="search-box">' +
        '<input type="search" id="searchInput" placeholder="Search EYESON…" autocomplete="off"/>' +
        '<p class="search-hint">Try "hoodie", "trench", "jogger"</p>' +
        '<div class="search-results" id="searchResults"></div>' +
      "</div>" +
    "</div>" +
    /* Mobile navigation */
    '<nav class="mobile-nav" id="mobileNav" aria-label="Mobile">' +
      '<button class="mobile-close" id="mobileClose" aria-label="Close menu">✕</button>' +
      '<a href="index.html">Home</a><a href="collections.html?category=new-arrivals">New Arrivals</a>' +
      '<a href="collections.html?category=men">Men</a><a href="collections.html?category=women">Women</a>' +
      '<a href="collections.html?category=hoodies">Hoodies</a><a href="collections.html?category=tshirts">T-Shirts</a>' +
      '<a href="collections.html?category=jackets">Jackets</a><a href="collections.html?category=joggers">Joggers</a>' +
      '<a href="collections.html?category=accessories">Accessories</a><a href="collections.html?category=sale">Sale</a>' +
      '<a href="about.html">About</a><a href="contact.html">Contact</a>' +
    "</nav>";

  /* Wire the 3-dot burger: tap → full-screen menu, tap a link → navigate & close */
  const burger = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  const closeBtn = document.getElementById("mobileClose");
  if (burger && mobileNav) {
    burger.addEventListener("click", () => mobileNav.classList.add("open"));
    if (closeBtn) closeBtn.addEventListener("click", () => mobileNav.classList.remove("open"));
    mobileNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => mobileNav.classList.remove("open")));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") mobileNav.classList.remove("open");
    });
  }
}

/* ---------- FOOTER ---------- */
function renderFooter() {
  const mount = document.getElementById("footer");
  if (!mount) return;
  mount.innerHTML =
    '<footer class="site-footer">' +
      '<div class="container">' +
        /* Centered logo */
        '<div class="footer-logo"><a href="index.html"><span class="logo-dual">' +
          '<img class="lg-black" src="images/logo/logo-black.png" alt="EYESON" onerror="this.parentElement.innerHTML=\'<span class=&quot;logo-fallback&quot;>EYESON</span>\'"/>' +
          '<img class="lg-white" src="images/logo/logo-white.png" alt=""/>' +
        "</span></a></div>" +
        '<div class="footer-grid">' +
          "<div><h4>Quick Links</h4>" +
            '<a href="index.html">Home</a><a href="collections.html?category=new-arrivals">New Arrivals</a>' +
            '<a href="about.html">About</a><a href="contact.html">Contact</a></div>' +
          "<div><h4>Collections</h4>" +
            '<a href="collections.html?category=hoodies">Hoodies</a><a href="collections.html?category=tshirts">T-Shirts</a>' +
            '<a href="collections.html?category=jackets">Jackets</a><a href="collections.html?category=joggers">Joggers</a>' +
            '<a href="collections.html?category=accessories">Accessories</a></div>' +
          "<div><h4>Customer Service</h4>" +
            '<a href="order-tracking.html">Track Order</a><a href="faq.html">FAQ</a>' +
            '<a href="shipping.html">Shipping</a><a href="returns.html">Returns</a></div>' +
          "<div><h4>Legal</h4>" +
            '<a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a>' +
            '<a href="login.html">Login</a><a href="register.html">Create Account</a></div>' +
        "</div>" +
        /* Socials */
        '<div class="footer-social">' +
          '<a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>' +
          '<a href="https://tiktok.com" target="_blank" rel="noopener">TikTok</a>' +
          '<a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a>' +
          '<a href="https://youtube.com" target="_blank" rel="noopener">YouTube</a></div>' +
        /* Payment & delivery partners */
        '<div class="footer-payments">' +
          ["Cash on Delivery", "eSewa", "Khalti", "Fonepay", "Visa", "MasterCard", "NPR"]
            .map((p) => '<span class="pay-chip">' + p + "</span>").join("") + "</div>" +
        '<div class="footer-legal">' +
          "<span>© 2026 EYESON — Limitless.</span><span>Designed for those who lead, not follow.</span>" +
          "<span style='color:var(--accent)'>Build 15 — Aug 16</span>" +
        "</div>" +
      "</div>" +
    "</footer>";
}

/* ---------- GLOBAL CHROME (cookie banner, back-to-top, cursor) ---------- */
function renderChrome() {
  /* Back to top */
  const top = document.createElement("button");
  top.className = "back-top"; top.id = "backTop"; top.setAttribute("aria-label", "Back to top"); top.innerHTML = "↑";
  document.body.appendChild(top);

  /* Cookie banner (shown once, consent stored) */
  if (!store.get("cookies-accepted", false)) {
    const cookie = document.createElement("div");
    cookie.className = "cookie-banner"; cookie.id = "cookieBanner";
    cookie.innerHTML =
      "<p>We use cookies to sharpen your EYESON experience.</p>" +
      '<button class="btn btn-sm" id="cookieAccept">Accept</button>';
    document.body.appendChild(cookie);
    setTimeout(() => cookie.classList.add("show"), 1800);
    cookie.querySelector("#cookieAccept").addEventListener("click", () => {
      store.set("cookies-accepted", true);
      cookie.classList.remove("show");
    });
  }

  /* Custom cursor intentionally removed — the site now uses the native
     browser cursor everywhere, with CSS hover states on controls. */
}
