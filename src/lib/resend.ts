import { Resend } from "resend";
import { formatCents } from "./types";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || "My Hair My Crown <onboarding@resend.dev>";

export async function sendBookingConfirmationEmail(params: {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  startTime: string;
  totalChargedCents: number;
  currency: string;
}) {
  const when = new Date(params.startTime).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await resend.emails.send({
    from: FROM,
    to: params.customerEmail,
    subject: `You're booked — ${params.serviceName} at My Hair My Crown`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1B1512;">
        <h1 style="font-size: 20px;">Your booking is confirmed 💇</h1>
        <p>Hi ${params.customerName}, your appointment is set.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #666;">Service</td><td style="padding: 6px 0; text-align: right;">${params.serviceName}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">When</td><td style="padding: 6px 0; text-align: right;">${when}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Amount paid</td><td style="padding: 6px 0; text-align: right;">${formatCents(params.totalChargedCents, params.currency)}</td></tr>
        </table>
        <p style="color: #666; font-size: 13px;">If you need to reschedule or cancel, just reply to this email.</p>
        <p style="color: #999; font-size: 12px;">My Hair My Crown</p>
      </div>
    `,
  });
}

export async function sendSalonNotificationEmail(params: {
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  startTime: string;
  servicePriceCents: number;
  currency: string;
}) {
  const notifyEmail = process.env.SALON_NOTIFICATION_EMAIL;
  if (!notifyEmail) return;

  const when = new Date(params.startTime).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await resend.emails.send({
    from: FROM,
    to: notifyEmail,
    subject: `New booking: ${params.serviceName} — ${when}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1B1512;">
        <h1 style="font-size: 20px;">New booking received</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #666;">Service</td><td style="padding: 6px 0; text-align: right;">${params.serviceName}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Customer</td><td style="padding: 6px 0; text-align: right;">${params.customerName}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0; text-align: right;">${params.customerEmail}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Phone</td><td style="padding: 6px 0; text-align: right;">${params.customerPhone ?? "—"}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">When</td><td style="padding: 6px 0; text-align: right;">${when}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">You'll receive</td><td style="padding: 6px 0; text-align: right;">${formatCents(params.servicePriceCents, params.currency)}</td></tr>
        </table>
      </div>
    `,
  });
}
