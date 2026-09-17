import { buildStatusEmailHtml } from "./lib/email-template-status.mjs";
import { sendEmail } from "./lib/mailer.mjs";
import { getFullTransaction } from "./lib/repository.mjs";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
}

function verifyAuth(req) {
  const key = req.headers["x-api-key"];
  if (!MOBILE_API_KEY || key !== MOBILE_API_KEY) {
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require API key for sending status emails (assessor/admin only)
  if (!verifyAuth(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body;
  const { referenceNumber, status, notes } = body;

  if (!referenceNumber || !status) {
    return res.status(400).json({ error: "Missing required fields: referenceNumber, status" });
  }

  const validStatuses = ["under_review", "approved", "needs_revision", "rejected", "processing", "completed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const txn = await getFullTransaction(referenceNumber);
    if (!txn) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (!txn.requestor_email) {
      return res.status(400).json({ error: "No email address found for this application" });
    }

    const html = buildStatusEmailHtml({
      referenceNumber: txn.reference_number,
      requestorName: txn.requestor_name,
      newStatus: status,
      notes,
    });

    const statusLabels = {
      under_review: "Documents Under Review",
      approved: "Documents Approved",
      needs_revision: "Documents Need Revision",
      rejected: "Application Rejected",
      processing: "Application Under Processing",
      completed: "Application Completed",
    };

    await sendEmail({
      to: txn.requestor_email,
      subject: `[${statusLabels[status]}] - ${referenceNumber} | Municipal Assessor's Office`,
      html,
    });

    return res.status(200).json({ success: true, message: `Status email sent: ${status}` });
  } catch (error) {
    console.error("Send status email error:", error);
    return res.status(500).json({ error: error.message || "Failed to send status email" });
  }
}
