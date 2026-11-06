import nodemailer from "nodemailer";

export function getPublicBaseUrl(req) {
  const configuredUrl = process.env.AKIBA_PUBLIC_URL?.trim();
  if (!configuredUrl && process.env.NODE_ENV === "production") {
    throw new Error("AKIBA_PUBLIC_URL must be configured for production email links.");
  }
  const value = configuredUrl || `${req.protocol}://${req.get("host")}`;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("AKIBA_PUBLIC_URL must be an absolute HTTP or HTTPS URL.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:")
  ) {
    throw new Error("AKIBA_PUBLIC_URL must be a public HTTPS origin in production.");
  }
  return url.origin;
}

export function assertEmailDeliveryConfigured() {
  getSmtpConfiguration();
}

export async function sendEmailVerification({ email, name, token, publicBaseUrl }) {
  const configuration = getSmtpConfiguration();
  const verificationUrl = new URL("/login.html", publicBaseUrl);
  verificationUrl.searchParams.set("verify", token);
  const displayName = escapeHtml(name);
  const url = verificationUrl.toString();
  const transporter = nodemailer.createTransport(configuration.transport);

  await transporter.sendMail({
    from: configuration.from,
    to: email,
    subject: "Verify your Akiba email address",
    text: `Hello ${name},\n\nVerify your email address to activate your Akiba account:\n${url}\n\nThis link expires in 24 hours. If you did not create an Akiba account, you can ignore this message.`,
    html: `<p>Hello ${displayName},</p><p>Verify your email address to activate your Akiba account.</p><p><a href="${url}">Verify my email address</a></p><p>This link expires in 24 hours. If you did not create an Akiba account, you can ignore this message.</p>`
  });
}

function getSmtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.AKIBA_EMAIL_FROM?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  if (!host || !from) {
    throw new Error("Configure SMTP_HOST and AKIBA_EMAIL_FROM before sending verification emails.");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid port number.");
  }
  if (Boolean(user) !== Boolean(password)) {
    throw new Error("Configure both SMTP_USER and SMTP_PASSWORD, or leave both empty.");
  }

  return {
    from,
    transport: {
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      ...(user ? { auth: { user, pass: password } } : {})
    }
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
