import { Router } from "express";
import {
  authenticateUser,
  createSession,
  ensureDefaultChama,
  findSession,
  registerUser,
  revokeSession
} from "./auth-store.js";

export const authRouter = Router();
const sessionCookieName = "akibaSession";
const attempts = new Map();
const rateLimitWindowMs = 15 * 60 * 1000;

authRouter.get("/session", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const user = await findSession(readSessionCookie(req));
  if (!user?.adminAuthorized) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  const { adminAuthorized, ...publicUser } = user;
  res.json({ user: publicUser });
});

authRouter.post("/register", limitAuthAttempts, requireSameOrigin, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (name.length < 2 || name.length > 80) {
    res.status(400).json({ error: "Enter your name (2 to 80 characters)." });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (!isValidPassword(password)) {
    res.status(400).json({
      error: "Use a password with at least 12 characters, including a letter and a number."
    });
    return;
  }

  const user = await registerUser({ name, email, password });
  if (!user) {
    res.status(409).json({ error: "An account with this email already exists. Please log in." });
    return;
  }

  await startSession(res, user, true);
  res.status(201).json({ user });
});

authRouter.post("/login", limitAuthAttempts, requireSameOrigin, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!isValidEmail(email) || typeof password !== "string" || password.length > 128) {
    res.status(400).json({ error: "Enter your email address and password." });
    return;
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    res.status(401).json({ error: "The email or password is incorrect." });
    return;
  }

  await ensureDefaultChama(user);
  await startSession(res, user, true);
  res.json({ user });
});

authRouter.post("/logout", requireSameOrigin, async (req, res) => {
  const token = readSessionCookie(req);
  await revokeSession(token);
  clearSessionCookie(res);
  res.json({ message: "You are signed out." });
});

export async function getAuthenticatedUser(req) {
  return findSession(readSessionCookie(req));
}

export async function requireAuth(req, res, next) {
  const user = await getAuthenticatedUser(req);
  if (!user?.adminAuthorized) {
    if (req.path === "/dashboard.html") {
      res.redirect("/login.html");
    } else {
      res.status(401).json({ error: "Please sign in to continue." });
    }
    return;
  }
  await ensureDefaultChama(user);
  req.authenticatedUser = user;
  next();
}

async function startSession(res, user, adminAuthorized) {
  const session = await createSession(user.id, adminAuthorized);
  res.cookie(sessionCookieName, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge
  });
  res.set("Cache-Control", "no-store");
}

function clearSessionCookie(res) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
  });
}

function readSessionCookie(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== sessionCookieName) continue;
    return cookie.slice(separator + 1).trim();
  }
  return null;
}

function limitAuthAttempts(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    next();
    return;
  }
  if (current.count >= 8) {
    res.status(429).json({ error: "Too many sign-in attempts. Please wait and try again." });
    return;
  }
  current.count += 1;
  next();
}

function requireSameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (!origin) {
    next();
    return;
  }
  try {
    if (new URL(origin).host === req.get("host")) {
      next();
      return;
    }
  } catch {
    res.status(403).json({ error: "This request origin is not allowed." });
    return;
  }
  res.status(403).json({ error: "This request origin is not allowed." });
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= 12 &&
    value.length <= 128 &&
    /[a-zA-Z]/.test(value) &&
    /\d/.test(value)
  );
}
