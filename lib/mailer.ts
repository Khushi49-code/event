// 📁 FILE PATH: lib/mailer.ts   (નવી ફાઇલ)
import nodemailer from 'nodemailer';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function sendOtpEmail(to: string, name: string, otp: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST / SMTP_USER / SMTP_PASS .env.local માં ખૂટે છે');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `EventFlux <${user}>`,
    to,
    subject: `${otp} is your EventFlux verification code`,
    text: `Hi ${name},\n\nYour EventFlux verification code is ${otp}.\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#111827">EventFlux</h2>
        <p style="color:#374151">Hi ${esc(name)}, use this code to verify your email:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#2563eb;margin:16px 0">${otp}</p>
        <p style="color:#6b7280;font-size:13px">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
      </div>`,
  });
}