const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587/25
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (!to) {
    console.warn("sendEmail skipped — no contact_email on file for this user");
    return false;
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("sendEmail skipped — SMTP_* env vars aren't configured yet");
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error(`sendEmail failed for ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendEmail };
