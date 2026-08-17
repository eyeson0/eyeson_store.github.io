# EYESON — Email Verification Setup (Supabase)

The site uses [Supabase Auth](https://supabase.com) for real 4-digit email
verification codes. Codes are generated, hashed, and verified entirely on
Supabase's servers — never in the browser.

## 1. Create the project

1. Sign up at <https://supabase.com> and create a free project.
2. When the project is ready, open **Project Settings → API**.
3. Copy the **Project URL** and the **anon public** key.

## 2. Configure email OTP

In the Supabase dashboard:

1. **Authentication → Providers → Email** — make sure Email is enabled.
2. **Authentication → Emails → Email OTP** (or Authentication → Sign In /
   Providers → Email → **Confirm email**) — enable OTP login.
3. Set the OTP length to **4 digits** (Authentication → Settings, or the
   email template settings depending on dashboard version).
4. Leave "Confirm email" ON — only verified accounts can sign in.

Optional: connect a custom SMTP (Authentication → SMTP) so codes come from
`noreply@eyeson.com.np` instead of Supabase's default sender.

## 3. Add your credentials

Open `js/auth-config.js` and paste your values:

```js
var SUPABASE_URL = "https://comxfumkvvsgdzfkylbl.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_L40_zSHfpqxiuWHcurgxeA__0xLsS48";
```

Until this is filled in, the login/register pages show a friendly setup
notice and the rest of the site works normally.

## 4. How the flow works

**Login** (`login.html`)
1. User enters email → Supabase sends a 4-digit code.
2. User types the code into the four boxes (auto-advance, paste support).
3. Supabase verifies (server-side, expiry enforced) → session created →
   redirected to `account.html`.

**Register** (`register.html`)
1. User enters name + email → account created, code sent.
2. Same 4-digit verification. Only after verifying is the account confirmed
   and the session created.

**Other details**
- Wrong code → inline error + shake animation.
- Expired code → "Code expired. Please request a new one."
- **Resend Code** → 60-second cooldown with live countdown.
- Session persists across refresh/navigation (Supabase manages it).
- **Sign Out** (account page) ends the session; cart, wishlist, and theme
  are preserved.
- No passwords exist anywhere in this flow; no codes are ever stored in
  the browser.
