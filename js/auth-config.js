/* ============================================================
   EYESON — PUBLIC AUTH CONFIG

   The browser never receives a Supabase key or secret. Authentication
   requests go to the same-origin Node server, which owns the HTTP-only
   session cookies and reads its Supabase configuration from server/.env.

   Leave this empty when the site and server share one domain (recommended).
   ============================================================ */

var EYESON_AUTH_API_BASE = "";
