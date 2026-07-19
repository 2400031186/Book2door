import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

export async function sendOrderConfirmation({ to, orderNumber, grandTotal }) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email stub] Order confirmation for ${to}: ${orderNumber} (₹${grandTotal})`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'noreply@book2door.com',
    to,
    subject: `Order Confirmed — ${orderNumber}`,
    text: `Your Book2Door order ${orderNumber} has been placed. Total: ₹${grandTotal}`,
  });
}

export async function sendPaymentStatus({ to, orderNumber, status }) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email stub] Payment ${status} for ${to}: ${orderNumber}`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'noreply@book2door.com',
    to,
    subject: `Payment ${status} — ${orderNumber}`,
    text: `Payment for order ${orderNumber} has been ${status}.`,
  });
}
