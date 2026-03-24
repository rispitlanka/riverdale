import nodemailer from "nodemailer";

function env(name: string): string | undefined {
  const v = process.env[name];
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (trimmed === "") return undefined;
  // Allow users to keep inline comments in .env values: VALUE  # comment
  const withoutInlineComment = trimmed.split(" #")[0].trim();
  return withoutInlineComment !== "" ? withoutInlineComment : undefined;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const v = value.toLowerCase();
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return fallback;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

let cachedTransporter: nodemailer.Transporter | null = null;

export function getSmtpTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = env("SMTP_HOST");
  const port = parsePort(env("SMTP_PORT"), 587);
  const secure = parseBool(env("SMTP_SECURE"), port === 465);
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASSWORD");

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP configuration. Please set SMTP_HOST, SMTP_USER, SMTP_PASSWORD (and optionally SMTP_PORT, SMTP_SECURE)."
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function sendOrderPlacedEmail(params: {
  toEmail: string;
  customerName: string;
  orderRef: string;
}) {
  const from = env("SMTP_FROM");
  if (!from) {
    throw new Error("Missing SMTP_FROM configuration.");
  }

  const transporter = getSmtpTransporter();

  const subject = `Order received${params.orderRef ? ` (${params.orderRef})` : ""}`;

  const text = `Hi ${params.customerName || "there"},

Thanks for your order${params.orderRef ? ` (${params.orderRef})` : ""}.

Our Team will contact you on your order and the process will continue. Thank you.
`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5;">
      <p>Hi ${escapeHtml(params.customerName || "there")},</p>
      <p>Thanks for your order${params.orderRef ? ` <strong>(${escapeHtml(params.orderRef)})</strong>` : ""}.</p>
      <p><strong>Our Team will contact you on your order and the process will continue thank you</strong></p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: params.toEmail,
    subject,
    text,
    html,
  });
}

export async function sendStripePaymentLinkEmail(params: {
  toEmail: string;
  customerName: string;
  orderRef: string;
  amountLabel: string;
  paymentUrl: string;
  expiresInMinutes: number;
}) {
  const from = env("SMTP_FROM");
  if (!from) {
    throw new Error("Missing SMTP_FROM configuration.");
  }

  const transporter = getSmtpTransporter();
  const subject = `Pay for your order${params.orderRef ? ` (${params.orderRef})` : ""}`;

  const text = `Hi ${params.customerName || "there"},

Please complete payment for your order${params.orderRef ? ` (${params.orderRef})` : ""}.

Amount: ${params.amountLabel}

Secure payment link (expires in ${params.expiresInMinutes} minutes):
${params.paymentUrl}

If the link expires, contact us and we can send a new one.

Thank you,
Riverdale Pawn Brokers
`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5;">
      <p>Hi ${escapeHtml(params.customerName || "there")},</p>
      <p>Please complete payment for your order${params.orderRef ? ` <strong>(${escapeHtml(params.orderRef)})</strong>` : ""}.</p>
      <p><strong>Amount:</strong> ${escapeHtml(params.amountLabel)}</p>
      <p>This secure payment link expires in <strong>${params.expiresInMinutes} minutes</strong>.</p>
      <p><a href="${escapeHtml(params.paymentUrl)}" style="display:inline-block;margin:12px 0;padding:12px 20px;background:#9A0156;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Pay now</a></p>
      <p style="font-size:12px;color:#666;">If the button does not work, copy this link:<br/><span style="word-break:break-all;">${escapeHtml(params.paymentUrl)}</span></p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: params.toEmail,
    subject,
    text,
    html,
  });
}

export async function sendPaymentReceivedEmail(params: {
  toEmail: string;
  customerName: string;
  orderRef: string;
}) {
  const from = env("SMTP_FROM");
  if (!from) {
    throw new Error("Missing SMTP_FROM configuration.");
  }

  const transporter = getSmtpTransporter();
  const subject = `Payment received${params.orderRef ? ` (${params.orderRef})` : ""}`;

  const text = `Hi ${params.customerName || "there"},

We have received your payment for order${params.orderRef ? ` ${params.orderRef}` : ""}.

Thank you for your business.

Riverdale Pawn Brokers
`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5;">
      <p>Hi ${escapeHtml(params.customerName || "there")},</p>
      <p>We have received your payment for order${params.orderRef ? ` <strong>${escapeHtml(params.orderRef)}</strong>` : ""}.</p>
      <p>Thank you for your business.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: params.toEmail,
    subject,
    text,
    html,
  });
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

