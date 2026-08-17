/* ============================================================
   EYESON — DATA.JS
   Single source of truth for products, categories, collections
   and reviews. Mirrored in the /json files for future backends.
   To add a product: copy one object and change its fields only.
   ============================================================ */

/* ---------- CATEGORIES (drive the mega menu & collections page) ---------- */
const CATEGORIES = [
  { id: "new-arrivals", name: "New Arrivals", image: "images/collections/new-arrivals.jpg" },
  { id: "men",          name: "Men",          image: "images/collections/men.jpg" },
  { id: "women",        name: "Women",        image: "images/collections/women.jpg" },
  { id: "hoodies",      name: "Hoodies",      image: "images/collections/hoodies.jpg" },
  { id: "tshirts",      name: "T-Shirts",     image: "images/collections/tshirts.jpg" },
  { id: "jackets",      name: "Jackets",      image: "images/collections/jackets.jpg" },
  { id: "joggers",      name: "Joggers",      image: "images/collections/joggers.jpg" },
  { id: "accessories",  name: "Accessories",  image: "images/collections/accessories.jpg" },
  { id: "caps",         name: "Caps",         image: "images/collections/caps.jpg" },
  { id: "oversized",    name: "Oversized",    image: "images/collections/oversized.jpg" },
  { id: "pants",        name: "Pants",        image: "images/collections/pants.jpg" },
  { id: "sale",         name: "Sale",         image: "images/collections/sale.jpg" },
];

/* ---------- FEATURED COLLECTION TABS ---------- */
const FEATURED = [
  { id: "trending",  name: "Trending" },
  { id: "best",      name: "Best Sellers" },
  { id: "limited",   name: "Limited Edition" },
  { id: "editors",   name: "Editor's Picks" },
  { id: "exclusive", name: "EYESON Exclusive" },
];

/* ---------- PRODUCTS ----------
   image/hoverImage: replace the file, keep the filename — no code change needed.
   tags: used by featured tabs (trending / best / limited / editors / exclusive). */
const PRODUCTS = [
  {
    id: "oversized-black-hoodie", name: "Oversized Black Hoodie", category: "hoodies", gender: "men",
    price: 6500, oldPrice: 8000, image: "images/products/product-1.jpg", hoverImage: "images/products/product-1b.jpg",
    colors: ["#000000", "#3a3a3a", "#f5f5f5"], sizes: ["S", "M", "L", "XL"], stock: "in",
    badge: "sale", tags: ["trending", "best", "new"],
    description: "Heavyweight 480 GSM fleece hoodie with dropped shoulders and a boxy silhouette. Cut for those who set the standard.",
    fabric: "100% combed cotton fleece, 480 GSM", modelHeight: "185 cm / wearing size L", collection: "Limitless Vol. 1",
  },
  {
    id: "essentials-white-tee", name: "Essentials White Tee", category: "tshirts", gender: "women",
    price: 2200, image: "images/products/product-2.jpg", hoverImage: "images/products/product-2b.jpg",
    colors: ["#ffffff", "#000000", "#d9d9d9"], sizes: ["XS", "S", "M", "L"], stock: "in",
    badge: "new", tags: ["trending", "new", "editors"],
    description: "A perfectly weighted heavyweight tee with a clean neckline that holds its shape wash after wash.",
    fabric: "100% organic cotton, 240 GSM", modelHeight: "174 cm / wearing size S", collection: "Limitless Vol. 1",
  },
  {
    id: "monolith-cargo-jacket", name: "Monolith Cargo Jacket", category: "jackets", gender: "men",
    price: 11500, oldPrice: 14000, image: "images/products/product-3.jpg", hoverImage: "images/products/product-3b.jpg",
    colors: ["#1a1a1a", "#4a4a4a"], sizes: ["S", "M", "L", "XL"], stock: "low",
    badge: "sale", tags: ["limited", "best"],
    description: "Structured cargo jacket in brushed cotton twill with matte hardware and concealed placket.",
    fabric: "Brushed cotton twill, water resistant finish", modelHeight: "188 cm / wearing size L", collection: "Monolith",
  },
  {
    id: "vision-jogger", name: "Vision Jogger", category: "joggers", gender: "men",
    price: 4800, image: "images/products/product-4.jpg", hoverImage: "images/products/product-4b.jpg",
    colors: ["#000000", "#5a5a5a", "#f5f5f5"], sizes: ["S", "M", "L", "XL"], stock: "in",
    badge: "", tags: ["trending", "exclusive"],
    description: "Tapered jogger with articulated knees and a gold-tipped drawcord. The everyday essential, elevated.",
    fabric: "Cotton-poly interlock, 320 GSM", modelHeight: "180 cm / wearing size M", collection: "Limitless Vol. 1",
  },
  {
    id: "editorial-trench", name: "Editorial Trench", category: "jackets", gender: "women",
    price: 15500, image: "images/products/product-5.jpg", hoverImage: "images/products/product-5b.jpg",
    colors: ["#0d0d0d", "#c9b89a"], sizes: ["XS", "S", "M", "L"], stock: "low",
    badge: "limited", tags: ["limited", "editors"],
    description: "A dramatic floor-grazing trench with sharp lapels and a belted waist. Pure magazine energy.",
    fabric: "Wool-blend gabardine", modelHeight: "176 cm / wearing size S", collection: "Editorial",
  },
  {
    id: "focus-cap", name: "Focus Cap", category: "accessories", gender: "unisex",
    price: 1500, image: "images/products/product-6.jpg", hoverImage: "images/products/product-6b.jpg",
    colors: ["#000000", "#f5f5f5"], sizes: ["One Size"], stock: "in",
    badge: "", tags: ["best", "new"],
    description: "Six-panel structured cap with tonal eye embroidery and a gold clasp.",
    fabric: "Cotton twill", modelHeight: "—", collection: "EYESON Icons",
  },
  {
    id: "noir-oversized-tee", name: "Noir Oversized Tee", category: "tshirts", gender: "men",
    price: 2600, image: "images/products/product-7.jpg", hoverImage: "images/products/product-7b.jpg",
    colors: ["#000000", "#2a2a2a"], sizes: ["M", "L", "XL", "XXL"], stock: "in",
    badge: "", tags: ["best", "exclusive"],
    description: "Garment-dyed oversized tee with a wide body and ribbed collar. Drape perfected.",
    fabric: "100% cotton, garment dyed, 260 GSM", modelHeight: "182 cm / wearing size L", collection: "EYESON Icons",
  },
  {
    id: "atelier-wide-pant", name: "Atelier Wide Pant", category: "pants", gender: "women",
    price: 7200, oldPrice: 9000, image: "images/products/product-8.jpg", hoverImage: "images/products/product-8b.jpg",
    colors: ["#1a1a1a", "#8a8a8a"], sizes: ["XS", "S", "M", "L"], stock: "in",
    badge: "sale", tags: ["sale", "editors"],
    description: "High-rise wide-leg pant with pressed creases and fluid movement.",
    fabric: "Tencel-linen blend", modelHeight: "175 cm / wearing size S", collection: "Atelier",
  },
];

/* ---------- MAIN COLLECTION LOOKS (homepage signature carousel) ---------- */
const MAIN_COLLECTION = [
  {
    product: "oversized-black-hoodie", modelImage: "images/collections/model-1.jpg",
    caption: "Look 01 — Nightfall",
  },
  {
    product: "monolith-cargo-jacket", modelImage: "images/collections/model-2.jpg",
    caption: "Look 02 — Monolith",
  },
  {
    product: "editorial-trench", modelImage: "images/collections/model-3.jpg",
    caption: "Look 03 — Editorial",
  },
  {
    product: "noir-oversized-tee", modelImage: "images/collections/model-4.jpg",
    caption: "Look 04 — Noir",
  },
  {
    product: "atelier-wide-pant", modelImage: "images/collections/model-5.jpg",
    caption: "Look 05 — Atelier",
  },
];

/* ---------- CUSTOMER REVIEWS ---------- */
const REVIEWS = [
  { name: "Aayush K.", location: "Kathmandu", rating: 5, verified: true,
    text: "The heavyweight hoodie is on another level. The fit, the fabric, the packaging — everything screams premium." },
  { name: "Priya S.", location: "Pokhara", rating: 5, verified: true,
    text: "EYESON finally brought luxury fashion to Nepal. My trench arrived perfectly pressed and the delivery was fast." },
  { name: "Daniel M.", location: "Bhaktapur", rating: 5, verified: true,
    text: "Bought the Vision Joggers in both colorways. The attention to detail — even the gold-tipped cords — is remarkable." },
  { name: "Sara L.", location: "Lalitpur", rating: 5, verified: true,
    text: "Cash on delivery was seamless and the quality exceeded every expectation. This is my wardrobe now." },
];

/* ---------- LOOKBOOK IMAGES ---------- */
const LOOKBOOK = [
  { image: "images/lookbook/lookbook-1.jpg", caption: "Chapter 01 — Concrete" },
  { image: "images/lookbook/lookbook-2.jpg", caption: "Chapter 02 — Silence" },
  { image: "images/lookbook/lookbook-3.jpg", caption: "Chapter 03 — Motion" },
  { image: "images/lookbook/lookbook-4.jpg", caption: "Chapter 04 — Vision" },
];

/* ---------- INSTAGRAM FEED ---------- */
const INSTAGRAM = [
  { image: "images/banners/banner-1.jpg" }, { image: "images/banners/banner-2.jpg" },
  { image: "images/banners/banner-3.jpg" }, { image: "images/banners/banner-4.jpg" },
  { image: "images/banners/banner-5.jpg" }, { image: "images/banners/banner-6.jpg" },
];
