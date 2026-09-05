import {
  createTransaction,
  getFullTransaction,
  listTransactions,
  updateTransactionStatus,
} from "./lib/repository.mjs";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY;

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
          copies: c.copies,
          fee: c.fee || 0,
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
      });

      return res.status(200).json({ success: true, referenceNumber, id: trnId });
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
    const { id, status } = body;

    if (!id || !status) {
      return res.status(400).json({ error: "id and status are required" });
    }

    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      const updated = await updateTransactionStatus(Number(id), status, "api");
      if (!updated) {
        return res.status(404).json({ error: "Application not found" });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("PATCH /api/applications error:", err?.message, err?.stack);
      return res.status(500).json({ error: "Failed to update application", detail: err?.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
