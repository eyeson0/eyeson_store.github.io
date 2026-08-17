import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const config = {
  port: Number(process.env.PORT || 3000),
  production: process.env.NODE_ENV === "production",
  supabaseUrl: process.env.SUPABASE_URL,
  publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

for (const [name, value] of Object.entries({
  SUPABASE_URL: config.supabaseUrl,
  SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
  SUPABASE_SERVICE_ROLE_KEY: config.serviceRoleKey,
})) {
  if (!value || value.includes("your-")) {
    throw new Error(`${name} must be set in the server .env file.`);
  }
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.production,
  path: "/",
};
const REMEMBER_MS = 1000 * 60 * 60 * 24 * 30;
const RESET_MS = 1000 * 60 * 10;
const OTP_COOLDOWN_MS = 60 * 1000;
const otpRequests = new Map();

function publicClient() {
  return createClient(config.supabaseUrl, config.publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function normaliseEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  return email;
}

function normaliseUsername(value) {
  const username = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new HttpError(400, "Username must be 3–30 letters, numbers, or underscores.");
  }
  return username;
}

function validatePassword(password, confirmPassword) {
  if (typeof password !== "string" || password.length < 10 || password.length > 72) {
    throw new HttpError(400, "Use a password between 10 and 72 characters.");
  }
  if (password !== confirmPassword) {
    throw new HttpError(400, "Passwords do not match.");
  }
}

function validOtp(token) {
  const code = String(token || "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) {
    throw new HttpError(400, "Enter the complete 6-digit code.");
  }
  return code;
}

function profileForResponse(user, profile) {
  return {
    id: user.id,
    email: user.email,
    username: profile?.username || user.user_metadata?.username || null,
    name: profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "EYESON member",
    loggedIn: true,
  };
}

async function findProfileByUsername(username) {
  const { data, error } = await admin
    .from("profiles")
    .select("user_id, username, email, display_name")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new HttpError(500, "Account service is temporarily unavailable.");
  return data;
}

async function findProfileByUserId(userId) {
  const { data, error } = await admin
    .from("profiles")
    .select("user_id, username, email, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new HttpError(500, "Account service is temporarily unavailable.");
  return data;
}

async function resolveIdentifier(identifier) {
  const raw = String(identifier || "").trim();
  if (!raw) return null;
  if (raw.includes("@")) {
    try { return normaliseEmail(raw); } catch { return null; }
  }
  const username = raw.toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return null;
  const profile = await findProfileByUsername(username);
  return profile?.email || null;
}

function setSessionCookies(res, session, remember) {
  const options = remember ? { ...COOKIE_BASE, maxAge: REMEMBER_MS } : COOKIE_BASE;
  res.cookie("eyeson_access", session.access_token, options);
  res.cookie("eyeson_refresh", session.refresh_token, options);
  if (remember) res.cookie("eyeson_remember", "1", { ...COOKIE_BASE, maxAge: REMEMBER_MS });
  else res.clearCookie("eyeson_remember", COOKIE_BASE);
}

function setResetCookies(res, session) {
  const options = { ...COOKIE_BASE, maxAge: RESET_MS };
  res.cookie("eyeson_reset_access", session.access_token, options);
  res.cookie("eyeson_reset_refresh", session.refresh_token, options);
}

function clearSessionCookies(res) {
  res.clearCookie("eyeson_access", COOKIE_BASE);
  res.clearCookie("eyeson_refresh", COOKIE_BASE);
  res.clearCookie("eyeson_remember", COOKIE_BASE);
}

function clearResetCookies(res) {
  res.clearCookie("eyeson_reset_access", COOKIE_BASE);
  res.clearCookie("eyeson_reset_refresh", COOKIE_BASE);
}

function otpRequestKey(purpose, email) {
  return crypto
    .createHash("sha256")
    .update(`${config.serviceRoleKey}:${purpose}:${email}`)
    .digest("hex");
}

function requireOtpCooldown(purpose, email) {
  const now = Date.now();
  const key = otpRequestKey(purpose, email);
  const previous = otpRequests.get(key);
  if (previous && now - previous < OTP_COOLDOWN_MS) {
    const seconds = Math.ceil((OTP_COOLDOWN_MS - (now - previous)) / 1000);
    throw new HttpError(429, `Please wait ${seconds}s before requesting another code.`);
  }
  otpRequests.set(key, now);
  if (otpRequests.size > 1000) {
    for (const [requestKey, time] of otpRequests) {
      if (now - time > OTP_COOLDOWN_MS) otpRequests.delete(requestKey);
    }
  }
}

async function currentSession(req, res) {
  const accessToken = req.cookies.eyeson_access;
  const refreshToken = req.cookies.eyeson_refresh;
  if (!accessToken) return null;

  const client = publicClient();
  let { data, error } = await client.auth.getUser(accessToken);
  let user = data?.user || null;

  if (error && refreshToken) {
    const refreshed = await client.auth.refreshSession({ refresh_token: refreshToken });
    if (!refreshed.error && refreshed.data.session) {
      setSessionCookies(res, refreshed.data.session, req.cookies.eyeson_remember === "1");
      user = refreshed.data.user || null;
    }
  }
  if (!user) clearSessionCookies(res);
  return user;
}

async function requireSession(req, res) {
  const user = await currentSession(req, res);
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  return user;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

app.get("/api/auth/session", route(async (req, res) => {
  const user = await currentSession(req, res);
  if (!user) return res.json({ user: null });
  const profile = await findProfileByUserId(user.id);
  return res.json({ user: profileForResponse(user, profile) });
}));

app.post("/api/auth/signup", authLimiter, route(async (req, res) => {
  const username = normaliseUsername(req.body?.username);
  const email = normaliseEmail(req.body?.email);
  const displayName = String(req.body?.displayName || username).trim().slice(0, 80) || username;
  const password = req.body?.password;
  validatePassword(password, req.body?.confirmPassword);

  if (await findProfileByUsername(username)) {
    throw new HttpError(409, "That username is already in use.");
  }
  requireOtpCooldown("signup", email);

  const client = publicClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { username, full_name: displayName } },
  });
  if (error || !data.user || data.user.identities?.length === 0) {
    throw new HttpError(400, "Unable to create an account with these details.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: data.user.id,
    username,
    email,
    display_name: displayName,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    if (profileError.code === "23505") throw new HttpError(409, "That username is already in use.");
    throw new HttpError(500, "Unable to finish account setup. Please try again.");
  }
  return res.status(202).json({ message: "If the address can receive email, a verification code is on its way." });
}));

app.post("/api/auth/signup/resend", authLimiter, route(async (req, res) => {
  const email = normaliseEmail(req.body?.email);
  requireOtpCooldown("signup", email);
  const { error } = await publicClient().auth.resend({ type: "signup", email });
  if (error) throw new HttpError(400, "Unable to send a new code right now.");
  return res.status(202).json({ message: "A new code is on its way." });
}));

app.post("/api/auth/signup/verify", authLimiter, route(async (req, res) => {
  const email = normaliseEmail(req.body?.email);
  const token = validOtp(req.body?.token);
  const { data, error } = await publicClient().auth.verifyOtp({ email, token, type: "signup" });
  if (error || !data.session || !data.user) throw new HttpError(400, "That code is invalid or has expired.");
  setSessionCookies(res, data.session, Boolean(req.body?.remember));
  const profile = await findProfileByUserId(data.user.id);
  return res.json({ user: profileForResponse(data.user, profile) });
}));

app.post("/api/auth/login", authLimiter, route(async (req, res) => {
  const email = await resolveIdentifier(req.body?.identifier);
  const password = req.body?.password;
  if (!email || typeof password !== "string") {
    throw new HttpError(401, "Invalid username/email or password.");
  }
  const { data, error } = await publicClient().auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) throw new HttpError(401, "Invalid username/email or password.");
  setSessionCookies(res, data.session, Boolean(req.body?.remember));
  const profile = await findProfileByUserId(data.user.id);
  return res.json({ user: profileForResponse(data.user, profile) });
}));

app.post("/api/auth/logout", route(async (req, res) => {
  const accessToken = req.cookies.eyeson_access;
  const refreshToken = req.cookies.eyeson_refresh;
  if (accessToken && refreshToken) {
    const client = publicClient();
    await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    await client.auth.signOut({ scope: "local" });
  }
  clearSessionCookies(res);
  return res.status(204).end();
}));

app.post("/api/auth/reset/request", authLimiter, route(async (req, res) => {
  const email = await resolveIdentifier(req.body?.identifier);
  // The same response is used whether or not the account exists.
  if (email) {
    requireOtpCooldown("recovery", email);
    await publicClient().auth.resetPasswordForEmail(email);
  }
  return res.status(202).json({ message: "If an account matches those details, a reset code is on its way." });
}));

app.post("/api/auth/reset/verify", authLimiter, route(async (req, res) => {
  const email = await resolveIdentifier(req.body?.identifier);
  const token = validOtp(req.body?.token);
  if (!email) throw new HttpError(400, "That code is invalid or has expired.");
  const { data, error } = await publicClient().auth.verifyOtp({ email, token, type: "recovery" });
  if (error || !data.session) throw new HttpError(400, "That code is invalid or has expired.");
  setResetCookies(res, data.session);
  return res.json({ message: "Code verified." });
}));

app.post("/api/auth/reset/complete", authLimiter, route(async (req, res) => {
  const accessToken = req.cookies.eyeson_reset_access;
  const refreshToken = req.cookies.eyeson_reset_refresh;
  if (!accessToken || !refreshToken) throw new HttpError(401, "Your reset session has expired. Request a new code.");
  const password = req.body?.password;
  validatePassword(password, req.body?.confirmPassword);

  const client = publicClient();
  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData.user) throw new HttpError(401, "Your reset session has expired. Request a new code.");
  const { error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionError) throw new HttpError(401, "Your reset session has expired. Request a new code.");
  const { error: updateError } = await client.auth.updateUser({ password });
  if (updateError) throw new HttpError(400, "Unable to update your password. Please request a new code.");

  /* Supabase revokes every refresh token for this user from the verified
     recovery JWT, invalidating the old device sessions before fresh login. */
  const { error: revokeError } = await admin.auth.admin.signOut(accessToken, "global");
  if (revokeError) throw new HttpError(500, "Password changed, but session cleanup failed. Please sign in again.");
  const { data: newLogin, error: loginError } = await publicClient().auth.signInWithPassword({
    email: userData.user.email,
    password,
  });
  if (loginError || !newLogin.session || !newLogin.user) throw new HttpError(500, "Password changed. Please sign in with your new password.");

  clearResetCookies(res);
  setSessionCookies(res, newLogin.session, Boolean(req.body?.remember));
  const profile = await findProfileByUserId(newLogin.user.id);
  return res.json({ user: profileForResponse(newLogin.user, profile) });
}));

app.use((req, res, next) => {
  const containsDotfile = req.path.split("/").some((part) => part.startsWith(".") && part.length > 1);
  if (containsDotfile || req.path === "/package.json" || req.path.startsWith("/server/") || req.path.startsWith("/supabase/")) {
    return res.status(404).end();
  }
  return next();
});

app.use(express.static(projectRoot, {
  index: "index.html",
  dotfiles: "deny",
  maxAge: config.production ? "1h" : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
  },
}));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next(new HttpError(404, "Not found."));
  return res.sendFile(path.join(projectRoot, "index.html"));
});

app.use((error, req, res, next) => {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error("Authentication request failed", { path: req.path, status });
  if (res.headersSent) return next(error);
  const message = error instanceof HttpError ? error.message : "Something went wrong. Please try again.";
  return res.status(status).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`EYESON is running at http://localhost:${config.port}`);
});
