import { buildEmailHtml } from "./lib/email-template.mjs";
import { buildOnlineEmailHtml } from "./lib/email-template-online.mjs";
import { sendEmail } from "./lib/mailer.mjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;

  if (!body.referenceNumber || !body.requestorEmail || !body.requestorName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const categoryLabel =
    body.transactionCategory === "assessment"
      ? "Assessment Transaction"
      : "Certification Request";

  try {
    // Use separate template for online submissions
    const isOnline = body.submissionMethod === "online";
    const html = isOnline ? buildOnlineEmailHtml(body) : buildEmailHtml(body);
    const prefix = isOnline ? "[Online]" : "[Walk-in]";

    await sendEmail({
      to: body.requestorEmail,
      subject: `${prefix} Application Received - ${body.referenceNumber} | ${categoryLabel}`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
