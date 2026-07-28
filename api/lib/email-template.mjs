import {
  ASSESSMENT_LABELS,
  CERTIFICATION_LABELS,
  REQUIREMENTS,
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

function getRequirementsTitle(payload) {
  if (payload.transactionCategory === "assessment" && payload.assessmentType) {
    return ASSESSMENT_LABELS[payload.assessmentType] ?? "Assessment Requirements";
  }

  if ((payload.certificationSelections ?? []).length > 0) {
    const selectedLabels = payload.certificationSelections
      .map((selection) => CERTIFICATION_LABELS[selection.type] ?? selection.type)
      .join(", ");
    return `CERTIFICATION REQUIREMENTS (${selectedLabels})`;
  }

  return "CERTIFICATION REQUIREMENTS";
}

function getRequirements(payload) {
  if (payload.transactionCategory === "assessment" && payload.assessmentType) {
    return REQUIREMENTS[payload.assessmentType] ?? [];
  }

  return REQUIREMENTS.certification;
}

function buildRequirementsRows(requirements) {
  return requirements
    .map(
      (requirement) => `
      <tr>
        <td style="width: 20px; border: 1px solid #9ca3af; text-align: center; padding: 6px 4px; font-size: 12px;">&#9633;</td>
        <td style="border: 1px solid #9ca3af; padding: 6px 8px; font-size: 12px; color: #111827;">
          ${escapeHtml(requirement)}
        </td>
      </tr>
    `,
    )
    .join("");
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
    ["Requestor Address", payload.requestorAddress || "-"],
    ["Contact Number", payload.requestorContact || "-"],
    ["Purpose", payload.purpose || "-"],
  ];

  return rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding: 5px 0; font-size: 12px; color: #374151; width: 170px;">${escapeHtml(label)}</td>
        <td style="padding: 5px 0; font-size: 12px; color: #111827; font-weight: 600;">${escapeHtml(value)}</td>
      </tr>
    `,
    )
    .join("");
}

export function buildEmailHtml(payload) {
  const transactionLabel = getTransactionLabel(payload);
  const serviceClass = getServiceClass(payload);
  const requirementsTitle = getRequirementsTitle(payload);
  const requirements = getRequirements(payload);

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
          <tr>
            <td style="background-color: #0f3b8f; padding: 10px 18px; text-align: left;">
              <div style="color: #ffffff; font-size: 14px; font-weight: 700; letter-spacing: 0.2px;">
                ASSESSORS ONLINE APPLICATION
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 22px 28px 10px; text-align: center; color: #111827; font-size: 13px; line-height: 1.55;">
              <div>Thank you for using the Municipal Assessor's Office Online Application.</div>
              <div>An email will be sent when document/s are ready for release.</div>
              <div>Use the Transaction Code below when checking your application status.</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 16px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #d1d5db; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="text-align: center; font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 14px;">
                      Assessor's Online Application
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #111827;">Transaction Code : <strong>${escapeHtml(payload.referenceNumber)}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #111827;">Requestor Name : <strong>${escapeHtml(payload.requestorName)}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0 4px; font-size: 13px; color: #111827;">Type of Transaction : <strong>${escapeHtml(transactionLabel)}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0 10px; font-size: 13px; color: #111827;">Service Class : <strong>${escapeHtml(serviceClass)}</strong></td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                      ${buildPropertyDetails(payload)}
                    </table>

                    <div style="text-align: center; font-size: 13px; color: #374151; font-style: italic; margin: 10px 0 12px;">
                      Please bring the following documents.
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 14px;">
                      <tr>
                        <td colspan="2" style="border: 1px solid #9ca3af; padding: 8px 10px; text-align: center; font-size: 13px; font-weight: 700; color: #111827;">
                          REQUIREMENTS: ${escapeHtml(requirementsTitle).toUpperCase()}
                        </td>
                      </tr>
                      ${buildRequirementsRows(requirements)}
                    </table>

                    <div style="text-align: center; font-size: 13px; color: #111827; margin-bottom: 4px;">
                      Please bring all necessary documents on your scheduled appointment date.
                    </div>
                    <div style="text-align: center; font-size: 13px; color: #111827;">
                      Incomplete documents will not be processed.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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
