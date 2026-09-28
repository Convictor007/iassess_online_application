import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials are not configured");
  }

  const fromName = process.env.SMTP_FROM_NAME || "Assessor's Office";

  await getTransporter().sendMail({
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
