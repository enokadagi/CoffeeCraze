import nodemailer from 'nodemailer';

// Minimal, stable server-side email sender.
// Uses SMTP configuration from environment variables.
// If SMTP is not configured, it will throw to prevent silent failures.

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export type SendWholesaleInquiryEmailPayload = {
  to: string;
  businessName: string;
  businessType?: string;
  estimatedVolume?: string;
  location: string;
  contactPerson?: string;
  website?: string;
  userId?: string | null;
  userEmail?: string | null;
  docId?: string;
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const host = requireEnv('SMTP_HOST');
  const port = Number(requireEnv('SMTP_PORT'));
  const user = requireEnv('SMTP_USER');
  const pass = requireEnv('SMTP_PASS');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: user,
    to,
    subject,
    html,
  });
}

export async function sendWholesaleInquiryEmail(payload: SendWholesaleInquiryEmailPayload) {
  const {
    to,
    businessName,
    businessType,
    estimatedVolume,
    location,
    contactPerson,
    website,
    userId,
    userEmail,
    docId,
  } = payload;

  const subject = `Wholesale Inquiry: ${escapeHtml(businessName)}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#0e372b;">
    <h2 style="margin:0 0 12px;">Wholesale Inquiry Received</h2>
    <p style="margin:0 0 18px; opacity:0.9;">Internal tracking ID: <b>${escapeHtml(docId ?? '-')}</b></p>

    <table style="border-collapse:collapse; width:100%; max-width:720px;">
      <tr><td style="padding:8px 0; font-weight:600; width:180px; opacity:0.8;">Business Name</td><td style="padding:8px 0;">${escapeHtml(businessName)}</td></tr>
      <tr><td style="padding:8px 0; font-weight:600; opacity:0.8;">Business Type</td><td style="padding:8px 0;">${escapeHtml(businessType ?? '-')}</td></tr>
      <tr><td style="padding:8px 0; font-weight:600; opacity:0.8;">Estimated Volume</td><td style="padding:8px 0;">${escapeHtml(estimatedVolume ?? '-')}</td></tr>
      <tr><td style="padding:8px 0; font-weight:600; opacity:0.8;">Location</td><td style="padding:8px 0;">${escapeHtml(location)}</td></tr>
      <tr><td style="padding:8px 0; font-weight:600; opacity:0.8;">Contact Person</td><td style="padding:8px 0;">${escapeHtml(contactPerson ?? '-')}</td></tr>
      <tr><td style="padding:8px 0; font-weight:600; opacity:0.8;">Website</td><td style="padding:8px 0;">${escapeHtml(website ?? '-')}</td></tr>
      <tr><td style="padding:8px 0; font-weight:600; opacity:0.8;">User ID</td><td style="padding:8px 0;">${escapeHtml(userId ?? '-')}</td></tr>
      <tr><td style="padding:8px 0; font-weight:600; opacity:0.8;">User Email</td><td style="padding:8px 0;">${escapeHtml(userEmail ?? '-')}</td></tr>
    </table>

    <p style="margin:18px 0 0; opacity:0.8;">— CoffeeCraze Admin Console</p>
  </div>`;

  await sendMail({ to, subject, html });
}

