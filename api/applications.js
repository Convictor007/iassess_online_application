import {
  createTransaction,
  getFullTransaction,
  listTransactions,
  updateTransactionStatus,
} from "./_lib/repository.mjs";
import { buildStatusEmailHtml } from "./_lib/email-template-status.mjs";
import { buildOnlineEmailHtml } from "./_lib/email-template-online.mjs";
import { buildEmailHtml } from "./_lib/email-template.mjs";
import { sendEmail } from "./_lib/mailer.mjs";
import { getCertificationFee } from "./_lib/constants.mjs";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY;

async function notifyAssessorsOfOnlineApplication({ applicationId, referenceNumber }) {
  const mobileApiUrl = process.env.IASSESS_MOBILE_API_URL?.trim().replace(/\/+$/, "");
  const sharedSecret = process.env.PUSH_NOTIFICATION_SHARED_SECRET?.trim();
  if (!mobileApiUrl || !sharedSecret) {
    console.error("New-application push was not attempted: IASSESS_MOBILE_API_URL or PUSH_NOTIFICATION_SHARED_SECRET is not configured.", {
      applicationId,
      referenceNumber,
    });
    return;
  }

  const endpoint = `${mobileApiUrl}/api/notifications/new-application`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-iassess-push-secret": sharedSecret,
      },
      body: JSON.stringify({ applicationId, referenceNumber }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      console.error("New-application push request failed.", {
        applicationId,
        status: response.status,
        code: result?.code,
        message: result?.message,
      });
      return;
    }

    const result = await response.json().catch(() => null);
    console.info("New-application push sent.", {
      applicationId,
      sent: result?.sent ?? 0,
      failed: result?.failed ?? 0,
    });
  } catch (error) {
    console.error("New-application push request failed.", {
      applicationId,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeout);
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
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

  // POST /api/applications — submit new application (no auth required, called from frontend)
  if (req.method === "POST") {
    const body = req.body;
    if (!body) {
      return res.status(400).json({ error: "No body provided" });
    }

    const {
      referenceNumber, transactionCategory, assessmentType, certificationSelections,
      submissionMethod,
      ownerName, taxDeclarations, titleNo, lotNo, blockNo, streetName, barangay,
      requestorName, requestorAddress, requestorContact, requestorEmail, purpose,
      documents,
    } = body;

    if (!referenceNumber || !transactionCategory || !ownerName || !requestorName || !requestorEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const validSubmissionMethods = ["walk_in", "online", null];
    const submissionMethodValue = validSubmissionMethods.includes(submissionMethod) ? submissionMethod : null;

    try {
      const trnId = await createTransaction({
        reference_number: referenceNumber,
        category: transactionCategory,
        submission_method: submissionMethodValue,
        assessment_type: assessmentType || undefined,
        certifications: (certificationSelections || []).map(c => ({
          cert_type: c.type,
          copies: c.copies || 1,
          // Prefer client fee if provided; otherwise resolve from current Balatan schedule
          fee: typeof c.fee === "number" ? c.fee : getCertificationFee(c.type),
          notes: c.customNote || c.notes || null,
        })),
        property: {
          owner_name: ownerName,
          title_no: titleNo,
          lot_no: lotNo,
          block_no: blockNo,
          street_name: streetName,
          barangay,
          tax_declarations: taxDeclarations || [],
        },
        requestor: {
          name: requestorName,
          address: requestorAddress,
          contact_number: requestorContact,
          email: requestorEmail,
          purpose,
        },
        documents: (documents || []).map(d => ({
          doc_type: d.doc_type,
          file_name: d.file_name,
          file_url: d.file_url,
          blob_pathname: d.blob_pathname || null,
          mime_type: d.mime_type || null,
          file_size: d.file_size || null,
        })),
      });

      if (submissionMethodValue === "online") {
        await notifyAssessorsOfOnlineApplication({
          applicationId: Number(trnId),
          referenceNumber,
        });
      }

      // Server-side confirmation email — client fire-and-forget can fail silently.
      let emailSent = false;
      let emailError = null;
      try {
        const isOnline = submissionMethodValue === "online";
        const html = isOnline
          ? buildOnlineEmailHtml({
              referenceNumber,
              transactionCategory,
              assessmentType,
              certificationSelections,
              submissionMethod: submissionMethodValue,
              requestorName,
              requestorEmail,
              requestorContact,
              requestorAddress,
              purpose,
              propertyName: ownerName,
              taxDeclarations,
              titleNo,
              lotNo,
              blockNo,
              streetName,
              barangay,
            })
          : buildEmailHtml({
              referenceNumber,
              transactionCategory,
              assessmentType,
              certificationSelections,
              submissionMethod: submissionMethodValue,
              requestorName,
              requestorEmail,
              requestorContact,
              requestorAddress,
              purpose,
              propertyName: ownerName,
              taxDeclarations,
              titleNo,
              lotNo,
              blockNo,
              streetName,
              barangay,
            });
        const categoryLabel =
          transactionCategory === "assessment" ? "Assessment Transaction" : "Certification Request";
        const prefix = isOnline ? "[Online]" : "[Walk-in]";
        await sendEmail({
          to: requestorEmail,
          subject: `${prefix} Application Received - ${referenceNumber} | ${categoryLabel}`,
          html,
        });
        emailSent = true;
      } catch (emailErr) {
        emailError = emailErr?.message || "email failed";
        console.error("POST /api/applications confirmation email failed:", emailError);
      }

      return res.status(200).json({ success: true, referenceNumber, id: trnId, emailSent, emailError });
    } catch (err) {
      console.error("POST /api/applications error:", err?.message, err?.stack);
      return res.status(500).json({ error: "Failed to submit application", detail: err?.message });
    }
  }

  // All methods below require API key
  if (!verifyAuth(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET /api/applications — list, search, or track
  if (req.method === "GET") {
    try {
      const { status, search, reference_number } = req.query;

      // Track by reference number (public-facing)
      if (reference_number) {
        const txn = await getFullTransaction(reference_number);
        if (!txn) {
          return res.status(404).json({ error: "Application not found" });
        }
        return res.status(200).json({ success: true, data: txn });
      }

      // List with filters
      const rows = await listTransactions({ status, search });
      return res.status(200).json({ success: true, data: rows || [] });
    } catch (err) {
      console.error("GET /api/applications error:", err?.message, err?.stack);
      return res.status(500).json({ error: "Internal server error", detail: err?.message });
    }
  }

  // PATCH /api/applications — update application status
  if (req.method === "PATCH") {
    const body = req.body;
    if (!body) {
      return res.status(400).json({ error: "No body provided" });
    }
    const { id, status, notes } = body;

    if (!id || !status) {
      return res.status(400).json({ error: "id and status are required" });
    }

    const validStatuses = ["pending", "under_review", "approved", "needs_revision", "rejected", "processing", "completed", "cancelled", "expired"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      const updated = await updateTransactionStatus(Number(id), status, "api", notes);
      if (!updated) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Send status update email for online submissions
      try {
        const txn = await getFullTransaction(String(id));
        if (txn?.requestor_email && txn?.submission_method === "online") {
          const statusLabels = {
            under_review: "Documents Under Review",
            approved: "Documents Approved",
            needs_revision: "Documents Need Revision",
            rejected: "Application Rejected",
            processing: "Application Under Processing",
            completed: "Application Completed",
          };
          if (statusLabels[status]) {
            const html = buildStatusEmailHtml({
              referenceNumber: txn.reference_number,
              requestorName: txn.requestor_name,
              newStatus: status,
              notes,
            });
            await sendEmail({
              to: txn.requestor_email,
              subject: `[${statusLabels[status]}] - ${txn.reference_number} | Municipal Assessor's Office`,
              html,
            }).catch(e => console.error("Status email failed:", e.message));
          }
        }
      } catch (emailErr) {
        console.error("Status email error (non-blocking):", emailErr.message);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("PATCH /api/applications error:", err?.message, err?.stack);
      return res.status(500).json({ error: "Failed to update application", detail: err?.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
