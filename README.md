# EYESON — LIMITLESS

Premium luxury fashion storefront with a Node server for secure Supabase-backed
authentication. Run `npm install` then `npm start`; do not use a static-only
host for authentication.

## How to customize (no code changes needed)

| What you want to change | What to do |
|---|---|
| Logo | Replace `images/logo/logo.png` (transparent PNG) — header, hero, footer, loading screen, auth pages and favicon all update automatically. Until the file exists, an elegant "EYESON" text fallback is shown. |
| Colors / fonts | Edit the variables in `css/theme.css` (`--primary`, `--accent`, fonts…). One change updates every page. |
| Any photo | Drop a file with the same name into `images/…` (e.g. `images/products/product-1.jpg`). Missing images show a branded placeholder until replaced. |
| Text on a page | Every heading/paragraph/button sits next to an HTML comment (`<!-- HERO TITLE -->`, `<!-- Shop Button -->`, …). Edit one line. |
| Add a product | Copy one object in `js/data.js` → `PRODUCTS`, change id/name/price/image. It instantly appears in grids, search, related products. |
| Add a category | Add one object to `CATEGORIES` in `js/data.js` and link `collections.html?category=your-id`. |
| Add a homepage carousel look | Add one object to `MAIN_COLLECTION` in `js/data.js`. |

## Pages

`index` · `collections` (dynamic `?category=`) · `product` (dynamic `?id=`) · `cart` (Eye Vault) ·
`checkout` ("Your Vision Collection") · `wishlist` · `login` / `register` / `account` ·
`order-tracking` · `about` · `contact` · `faq` · `shipping` · `returns` · `privacy` · `terms` · `404`

## Signature features

- Cinematic eye loading screen (plays once per session)
- Eye theme toggle — blinks, pupil follows cursor, eyelid animates the dark/light switch
- Eye Vault cart — item count inside the iris; a glowing orb flies into the eye on add
- Three-model Main Collection carousel — center in focus, sides blurred, auto-rotate, hover-to-focus, swipe
- Custom focus-ring cursor ("VIEW" on products, eye-shape on models)
- NPR pricing, COD / eSewa / Khalti / Fonepay / Visa / MasterCard checkout
- Search overlay with friendly no-results state; empty categories show "Coming Soon" — never a 404

## Structure

```
css/   theme (variables) · style (global) · header · footer · components (cards/modals)
       home (hero/carousel/lookbook) · pages (shop/product/cart/auth/…) · animations · responsive
js/    data (products/categories/reviews) · utils · components (shared header/footer)
       theme · cart · wishlist · search · loading · animations · carousel · main (page boot)
server/ Node authentication API · HTTP-only session cookies
supabase/migrations/ username profile table and RLS policy
images/ logo · hero · collections · campaign · products · lookbook · banners · icons · videos
```

See [AUTH-SETUP.md](AUTH-SETUP.md) for required Supabase and deployment setup.
