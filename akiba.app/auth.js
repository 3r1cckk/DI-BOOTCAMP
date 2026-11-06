import { Router } from "express";
import {
  authenticateUser,
  createSession,
  createEmailVerification,
  ensureDefaultChama,
  findSession,
  registerUser,
  revokeSession,
  verifyEmailToken
} from "./auth-store.js";
import {
  assertEmailDeliveryConfigured,
  getPublicBaseUrl,
  sendEmailVerification
} from "./email.js";

export const authRouter = Router();
const sessionCookieName = "akibaSession";
const attempts = new Map();
const emailResendAttempts = new Map();
const rateLimitWindowMs = 15 * 60 * 1000;

authRouter.get("/session", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const user = await findSession(readSessionCookie(req));
  if (!user?.adminAuthorized || !user.emailVerified) {
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

  const inviteToken = req.body && Object.hasOwn(req.body, "inviteToken")
    ? req.body.inviteToken
    : undefined;
  if (inviteToken !== undefined && (typeof inviteToken !== "string" || !inviteToken)) {
    res.status(400).json({ error: "This invite link is invalid." });
    return;
  }
  let publicBaseUrl;
  try {
    assertEmailDeliveryConfigured();
    publicBaseUrl = getPublicBaseUrl(req);
  } catch (error) {
    res.status(503).json({ error: error.message });
    return;
  }

  const registration = await registerUser({ name, email, password, inviteToken });
  if (registration === "invitation_unavailable") {
    res.status(410).json({ error: "This invite link has expired or has already been used." });
    return;
  }
  if (!registration) {
    res.status(409).json({ error: "An account with this email already exists. Please log in." });
    return;
  }

  try {
    await sendEmailVerification({
      email,
      name,
      token: registration.verificationToken,
      publicBaseUrl
    });
  } catch (error) {
    console.error("Could not send an Akiba verification email:", error);
    res.status(503).json({
      error: "Your account was created, but the verification email could not be sent. Please request a new email after the mail service is available."
    });
    return;
  }
  res.status(202).json({
    message: "Check your inbox for a verification link. It expires in 24 hours."
  });
});

authRouter.post("/verification/resend", limitAuthAttempts, requireSameOrigin, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Enter the email address you registered with." });
    return;
  }
  const inviteToken = req.body?.inviteToken;
  if (inviteToken !== undefined && (typeof inviteToken !== "string" || !inviteToken)) {
    res.status(400).json({ error: "This invite link is invalid." });
    return;
  }
  if (!allowVerificationResend(email)) {
    res.status(429).json({ error: "Please wait before requesting another verification email." });
    return;
  }

  let publicBaseUrl;
  try {
    assertEmailDeliveryConfigured();
    publicBaseUrl = getPublicBaseUrl(req);
  } catch (error) {
    res.status(503).json({ error: error.message });
    return;
  }

  const verification = await createEmailVerification({ email, inviteToken });
  if (verification === "invitation_unavailable") {
    res.status(410).json({ error: "This invite link has expired or has already been used." });
    return;
  }
  if (verification) {
    try {
      await sendEmailVerification({
        email,
        name: verification.name,
        token: verification.verificationToken,
        publicBaseUrl
      });
    } catch (error) {
      console.error("Could not resend an Akiba verification email:", error);
      res.status(503).json({ error: "The verification email could not be sent. Please try again later." });
      return;
    }
  }
  res.status(202).json({
    message: "If an unverified account exists for that address, a new verification email has been sent."
  });
});

authRouter.post("/verify-email", requireSameOrigin, async (req, res) => {
  const user = await verifyEmailToken(req.body?.token);
  if (user === "invitation_unavailable") {
    res.status(410).json({
      error: "This invite link has expired. Ask the chama manager for a new invitation, then request a new verification email."
    });
    return;
  }
  if (user === "invalid") {
    res.status(410).json({ error: "This verification link is invalid, expired, or already used." });
    return;
  }
  await startSession(res, user, true);
  res.json({ message: "Your email is verified.", user });
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
  if (!user.emailVerified) {
    res.status(403).json({
      code: "email_not_verified",
      error: "Verify your email address before signing in. You can resend the verification link below."
    });
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
  res.set("Cache-Control", "no-store");
  res.json({ message: "You are signed out." });
});

export async function getAuthenticatedUser(req) {
  return findSession(readSessionCookie(req));
}

export async function requireAuth(req, res, next) {
  const user = await getAuthenticatedUser(req);
  if (!user?.adminAuthorized || !user.emailVerified) {
    if (req.path === "/dashboard.html") {
      res.set("Cache-Control", "no-store");
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

function allowVerificationResend(email) {
  const now = Date.now();
  for (const [key, attempt] of emailResendAttempts) {
    if (attempt.resetAt <= now) emailResendAttempts.delete(key);
  }
  const attempt = emailResendAttempts.get(email);
  if (!attempt || attempt.resetAt <= now) {
    emailResendAttempts.set(email, { count: 1, resetAt: now + rateLimitWindowMs });
    return true;
  }
  if (attempt.count >= 3) return false;
  attempt.count += 1;
  return true;
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
