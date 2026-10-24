import {
  getTransactionById,
  updateTransactionStatus,
  replaceRevisionDocuments,
} from "./_lib/repository.mjs";
import { verifyRevisionToken } from "./_lib/revision-token.mjs";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function tokenFromRequest(req) {
  if (typeof req.query?.token === "string" && req.query.token) return req.query.token;
  if (typeof req.body?.token === "string" && req.body.token) return req.body.token;
  return null;
}

/**
 * GET /api/revision?token=...
 * Validates a citizen revision link and returns the data the page needs
 * to render (marked checklist items + application summary).
 */
async function handleGet(req, res) {
  const payload = verifyRevisionToken(tokenFromRequest(req));
  if (!payload) {
    return res
      .status(400)
      .json({ error: "invalid", message: "This revision link is invalid or has expired." });
  }

  const txn = await getTransactionById(payload.trnId);
  if (!txn || txn.reference_number !== payload.referenceNumber) {
    return res.status(404).json({ error: "not_found", message: "Application not found." });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: txn.id,
      referenceNumber: txn.reference_number,
      status: txn.status,
      ownerName: txn.owner_name,
      requestorName: txn.requestor_name,
      barangay: txn.barangay,
      items: payload.items,
      expiresAt: payload.expiresAt,
      // Only accept uploads while the assessor has it in needs_revision.
      acceptsUploads: txn.status === "needs_revision",
    },
  });
}

/**
 * POST /api/revision
 * Body: { token, uploads: [{ key, fileName, fileUrl, blobPathname, mimeType }] }
 * Attaches the uploaded images as documents and flips status to under_review.
 */
async function handlePost(req, res) {
  const payload = verifyRevisionToken(tokenFromRequest(req));
  if (!payload) {
    return res
      .status(400)
      .json({ error: "invalid", message: "This revision link is invalid or has expired." });
  }

  const uploads = Array.isArray(req.body?.uploads) ? req.body.uploads : [];
  if (uploads.length === 0) {
    return res.status(400).json({ error: "no_uploads", message: "No files were provided." });
  }

  const allowedKeys = new Set(payload.items.map((it) => it.key));
  const uploadedKeys = new Set();
  const clean = [];
  for (const u of uploads) {
    const key = typeof u?.key === "string" ? u.key : "";
    const fileName = typeof u?.fileName === "string" ? u.fileName.slice(0, 200) : "";
    const fileUrl = typeof u?.fileUrl === "string" ? u.fileUrl : "";
    const blobPathname = typeof u?.blobPathname === "string" ? u.blobPathname : null;
    const mimeType = typeof u?.mimeType === "string" ? u.mimeType.slice(0, 100) : null;
    if (!allowedKeys.has(key) || uploadedKeys.has(key) || !fileName || !fileUrl) {
      return res.status(400).json({
        error: "bad_upload",
        message: "An upload is missing, duplicated, or does not match a requirement marked for revision.",
      });
    }
    uploadedKeys.add(key);
    clean.push({ key, fileName, fileUrl, blobPathname, mimeType });
  }

  if (uploadedKeys.size !== allowedKeys.size) {
    return res.status(400).json({
      error: "missing_uploads",
      message: "Please upload a file for every requirement marked for revision.",
    });
  }

  const txn = await getTransactionById(payload.trnId);
  if (!txn || txn.reference_number !== payload.referenceNumber) {
    return res.status(404).json({ error: "not_found", message: "Application not found." });
  }
  if (txn.status !== "needs_revision") {
    return res.status(409).json({
      error: "not_accepting",
      message:
        txn.status === "under_review"
          ? "Your revision was already submitted and is under review."
          : "This application is not accepting revisions right now.",
    });
  }

  await replaceRevisionDocuments(txn.id, clean);

  const changedBy = txn.requestor_email || "citizen";
  const notes = `Revised document(s) uploaded via secure revision link: ${clean
    .map((u) => u.key)
    .join(", ")}`;
  await updateTransactionStatus(txn.id, "under_review", changedBy, notes);

  return res.status(200).json({
    success: true,
    message: "Revision submitted. Your application is now under review.",
    status: "under_review",
  });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") return await handleGet(req, res);
    if (req.method === "POST") return await handlePost(req, res);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("api/revision error:", err?.message, err?.stack);
    return res.status(500).json({ error: "internal", message: "Internal server error." });
  }
}
