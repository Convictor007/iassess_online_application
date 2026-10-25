import {
  ASSESSMENT_LABELS,
  CERTIFICATION_LABELS,
} from "./constants.mjs";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTransactionLabel(payload) {
  return payload.transactionCategory === "assessment"
    ? "Assessment Transaction"
    : "Certification Request";
}

function getServiceClass(payload) {
  return payload.transactionCategory === "assessment"
    ? "Highly Technical (10 Working Days)"
    : "Processing Schedule to Follow";
}

function getSubTypeLabel(payload) {
  if (payload.transactionCategory === "assessment" && payload.assessmentType) {
    return ASSESSMENT_LABELS[payload.assessmentType] ?? "";
  }
  if ((payload.certificationSelections ?? []).length > 0) {
    return payload.certificationSelections
      .map((s) => CERTIFICATION_LABELS[s.type] ?? s.type)
      .join(", ");
  }
  return "";
}

function buildPropertyDetails(payload) {
  const rows = [
    ["Property Owner", payload.propertyName],
    ["Tax Declaration No.", (payload.taxDeclarations ?? []).filter(Boolean).join(", ") || "-"],
    ["Title No.", payload.titleNo || "-"],
    ["Lot No.", payload.lotNo || "-"],
    ["Block No.", payload.blockNo || "-"],
    ["Street Name", payload.streetName || "-"],
    ["Barangay", payload.barangay || "-"],
  ];

  return rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding: 4px 0; font-size: 12px; color: #374151; width: 160px;">${escapeHtml(label)}</td>
        <td style="padding: 4px 0; font-size: 12px; color: #111827; font-weight: 600;">${escapeHtml(value)}</td>
      </tr>
    `,
    )
    .join("");
}

function buildUploadedDocs(payload) {
  const docs = payload.documents ?? {};
  const entries = Object.entries(docs);
  if (entries.length === 0) return "";

  return entries
    .map(
      ([type, doc]) => `
      <tr>
        <td style="padding: 3px 0; font-size: 11px; color: #374151;">&#8226; ${escapeHtml(type.replace(/_/g, " "))}</td>
        <td style="padding: 3px 0; font-size: 11px; color: #6b7280; text-align: right;">${escapeHtml(doc.fileName ?? "")}</td>
      </tr>
    `,
    )
    .join("");
}

export function buildOnlineEmailHtml(payload) {
  const transactionLabel = getTransactionLabel(payload);
  const serviceClass = getServiceClass(payload);
  const subType = getSubTypeLabel(payload);
  const isAssessment = payload.transactionCategory === "assessment";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #d1d5db;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f3b8f; padding: 10px 18px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40" valign="middle">
                    <img src="https://www.balatandrrm.org/wp-content/uploads/2025/09/cropped-balatan_logo-1.png" alt="Balatan Logo" width="36" height="36" style="display: block; border-radius: 50%;" />
                  </td>
                  <td style="padding-left: 10px;" valign="middle">
                    <div style="color: #ffffff; font-size: 14px; font-weight: 700; letter-spacing: 0.2px;">
                      ASSESSORS ONLINE APPLICATION
                    </div>
                    <div style="color: #93c5fd; font-size: 10px; margin-top: 2px;">
                      Municipality of Balatan, Camarines Sur
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="padding: 22px 28px 6px; text-align: center;">
              <div style="background-color: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 14px 20px;">
                <div style="font-size: 16px; font-weight: 700; color: #166534; margin-bottom: 4px;">&#10003; Application Received Successfully</div>
                <div style="font-size: 12px; color: #166534;">Your documents have been uploaded online. No need to bring physical documents to the office.</div>
              </div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding: 16px 28px 6px; text-align: center; color: #111827; font-size: 13px; line-height: 1.55;">
              <div>Thank you for using the Municipal Assessor's Office Online Application.</div>
              <div>An email will be sent when your document/s are ready for release.</div>
              <div>Use the Transaction Code below when checking your application status.</div>
            </td>
          </tr>

          <!-- Application Details -->
          <tr>
            <td style="padding: 12px 16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #d1d5db; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="text-align: center; font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 14px;">
                      Application Details
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #111827;">Transaction Code : <strong>${escapeHtml(payload.referenceNumber)}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #111827;">Requestor Name : <strong>${escapeHtml(payload.requestorName)}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #111827;">Type of Transaction : <strong>${escapeHtml(transactionLabel)}</strong></td>
                      </tr>
                      ${subType ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #111827;">Sub-Type : <strong>${escapeHtml(subType)}</strong></td></tr>` : ""}
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #111827;">Service Class : <strong>${escapeHtml(serviceClass)}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #111827;">Submission Method : <strong>Online</strong></td>
                      </tr>
                    </table>

                    <!-- Property Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                      ${buildPropertyDetails(payload)}
                    </table>

                    <!-- Uploaded Documents -->
                    ${payload.documents && Object.keys(payload.documents).length > 0 ? `
                    <div style="margin-top: 12px;">
                      <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 6px;">Uploaded Documents</div>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px;">
                        ${buildUploadedDocs(payload)}
                      </table>
                    </div>
                    ` : ""}

                    <!-- What Happens Next -->
                    <div style="margin-top: 16px; padding: 14px 16px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
                      <div style="font-size: 13px; font-weight: 700; color: #1e40af; margin-bottom: 8px;">What Happens Next?</div>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f; vertical-align: top; width: 18px;">1.</td>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f;">Our team will review your uploaded documents.</td>
                        </tr>
                        ${isAssessment ? `
                        <tr>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f; vertical-align: top;">2.</td>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f;">Pay the required fees at the Municipal Assessor's Office.</td>
                        </tr>
                        ` : `
                        <tr>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f; vertical-align: top;">2.</td>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f;">Pay the required fees at the Municipal Assessor's Office.</td>
                        </tr>
                        <tr>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f; vertical-align: top;">3.</td>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f;">Your certified document/s will be ready for pickup within 3-5 business days.</td>
                        </tr>
                        `}
                        <tr>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f; vertical-align: top;">${isAssessment ? "4" : "4"}.</td>
                          <td style="padding: 3px 0; font-size: 12px; color: #1e3a5f;">You will receive an email notification once your documents are processed.</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Payment Section -->
                    <div style="margin-top: 14px; padding: 14px 16px; background-color: #fefce8; border: 1px solid #fde047; border-radius: 6px;">
                      <div style="font-size: 13px; font-weight: 700; color: #854d0e; margin-bottom: 8px;">Payment</div>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 3px 0; font-size: 12px; color: #713f12;">&#9633; <strong>Counter Payment</strong> — Pay at the Municipal Assessor's Office, Balatan, Camarines Sur (Mon-Fri, 8:00 AM - 5:00 PM). Present your Transaction Code.</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0 3px; font-size: 12px; color: #713f12;">&#9633; <strong>Online Payment</strong> — <span style="color: #b45309; font-weight: 600;">COMING SOON!</span> GCash, Maya, and bank transfer options will be available soon.</td>
                        </tr>
                      </table>
                    </div>


                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 20px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 11px;">
                This is an automated message. Please do not reply directly to this email.
              </p>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 11px;">
                For concerns, contact <a href="mailto:balatan.assessor@gmail.com" style="color: #0f3b8f; text-decoration: none;">balatan.assessor@gmail.com</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
